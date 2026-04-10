const { runStaticAnalysis } = require("../utils/staticAnalysis");
const { analyzeCodeWithAI } = require("../utils/aiAnalysis");

const rooms = {};
const aiCache = new Map();

module.exports = (io, socket) => {

  // ================= JOIN ROOM =================
  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        code: "",
        language: "javascript",
        users: [],
      };
    }

    rooms[roomId].users.push({ id: socket.id, name: username });

    socket.emit("init", rooms[roomId]);

    // 🔥 IMPORTANT
    socket.to(roomId).emit("user-joined", {
      id: socket.id,
      name: username,
    });

    io.to(roomId).emit("users-update", rooms[roomId].users);
  });

  // ================= CODE =================
  socket.on("code-change", ({ roomId, code }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].code = code;

    socket.to(roomId).emit("code-update", { code, cursor, cursorId: socket.id, });

    const staticIssues = runStaticAnalysis(code);
    io.to(roomId).emit("ai-suggestions", staticIssues);
  });

  // ================= LANGUAGE =================
  socket.on("language-change", ({ roomId, language }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].language = language;
    socket.to(roomId).emit("language-update", language);
  });

  // ================= VIDEO =================
  socket.on("join-video", (roomId) => {
    const users = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

    const otherUsers = users.filter(id => id !== socket.id);

    socket.emit("all-users", otherUsers);

    // 🔥 FIX (MOST IMPORTANT)
    socket.to(roomId).emit("user-joined-video", socket.id);
  });

  socket.on("sending-signal", ({ userToSignal, signal }) => {
    io.to(userToSignal).emit("receiving-signal", {
      signal,
      from: socket.id,
    });
  });

  socket.on("returning-signal", ({ signal, to }) => {
    io.to(to).emit("signal-returned", {
      signal,
      from: socket.id,
    });
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId].users =
        rooms[roomId].users.filter(u => u.id !== socket.id);

      socket.to(roomId).emit("user-left", socket.id);
      io.to(roomId).emit("users-update", rooms[roomId].users);

      if (rooms[roomId].users.length === 0) {
        delete rooms[roomId];
      }
    }
  });
};