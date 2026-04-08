const { runStaticAnalysis } = require("../utils/staticAnalysis");
const { analyzeCodeWithAI } = require("../utils/aiAnalysis");

const rooms = {};
const debounceTimers = {};
const aiCache = new Map();

module.exports = (io, socket) => {

  // 🔹 JOIN ROOM
  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = { code: "", language: "javascript", users: [], cursors: {}, messages: [] };
    }

    if (!rooms[roomId].users.find(u => u.id === socket.id)) {
      rooms[roomId].users.push({ id: socket.id, name: username });
    }

    socket.emit("init", {
      code: rooms[roomId].code,
      language: rooms[roomId].language,
      users: rooms[roomId].users,
      cursors: rooms[roomId].cursors,
      messages: rooms[roomId].messages,
    });

    socket.to(roomId).emit("user-joined", { id: socket.id, name: username });
    io.to(roomId).emit("users-update", rooms[roomId].users);
  });

  // 🔹 CODE CHANGE
  socket.on("code-change", ({ roomId, code, cursor }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].code = code;
    rooms[roomId].cursors[socket.id] = cursor;

    io.to(roomId).emit("code-update", { code, cursorId: socket.id, cursor });

    const staticIssues = runStaticAnalysis(code, rooms[roomId].language);
    io.to(roomId).emit("ai-suggestions", staticIssues);

    if (debounceTimers[roomId]) clearTimeout(debounceTimers[roomId]);
    debounceTimers[roomId] = setTimeout(async () => {
      try {
        const cacheKey = code.slice(0, 200);
        if (aiCache.has(cacheKey)) {
          io.to(roomId).emit("ai-suggestions", aiCache.get(cacheKey));
          return;
        }
        const aiIssues = await analyzeCodeWithAI(code, rooms[roomId].language);
        aiCache.set(cacheKey, aiIssues);
        io.to(roomId).emit("ai-suggestions", aiIssues);
      } catch (err) {
        console.error("AI Error:", err);
      }
    }, 800);
  });

  // 🔹 CURSOR CHANGE
  socket.on("cursor-change", ({ roomId, cursor }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].cursors[socket.id] = cursor;
    socket.to(roomId).emit("cursor-update", { cursorId: socket.id, cursor });
  });

  // 🔹 LANGUAGE CHANGE
  socket.on("language-change", ({ roomId, language }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].language = language;
    socket.to(roomId).emit("language-update", language);
  });

  // 🔹 CHAT MESSAGE
  socket.on("send-message", ({ roomId, message }) => {
    if (!rooms[roomId]) return;
    const newMessage = { user: socket.user?.email || "Anonymous", text: message, time: new Date().toISOString() };
    rooms[roomId].messages.push(newMessage);
    io.to(roomId).emit("receive-message", newMessage);
  });

  // 🔹 DISCONNECT
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter(u => u.id !== socket.id);
      delete rooms[roomId].cursors[socket.id];
      io.to(roomId).emit("users-update", rooms[roomId].users);
      if (rooms[roomId].users.length === 0) delete rooms[roomId];
    }
  });

  // 🔹 VIDEO CALL SIGNALING
  socket.on("join-video", (roomId) => {
    socket.join(roomId);
    const otherUsers = Array.from(io.sockets.adapter.rooms.get(roomId) || []).filter(id => id !== socket.id);
    socket.emit("all-users", otherUsers);
  });

  socket.on("sending-signal", ({ userToSignal, signal }) => {
    io.to(userToSignal).emit("receiving-signal", { signal, from: socket.id });
  });

  socket.on("returning-signal", ({ signal, to }) => {
    io.to(to).emit("signal-returned", { signal });
  });
};