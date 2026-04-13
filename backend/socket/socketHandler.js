 const { runStaticAnalysis } = require("../utils/staticAnalysis");
// const { analyzeCodeWithAI } = require("../utils/aiAnalysis"); // optional

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
        cursors: {}, // ✅ track cursors
      };
    }

    // ✅ prevent duplicate users
    const exists = rooms[roomId].users.find(u => u.id === socket.id);
    if (!exists) {
      rooms[roomId].users.push({ id: socket.id, name: username });
    }

    // ✅ send full state
    socket.emit("init", {
      code: rooms[roomId].code,
      language: rooms[roomId].language,
      users: rooms[roomId].users,
      cursors: rooms[roomId].cursors,
    });

    socket.to(roomId).emit("user-joined", {
      id: socket.id,
      name: username,
    });

    io.to(roomId).emit("users-update", rooms[roomId].users);
  });

  // ================= CODE =================
  socket.on("code-change", ({ roomId, code, cursor }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].code = code;

    // ✅ save cursor
    if (cursor) {
      rooms[roomId].cursors[socket.id] = cursor;
    }

    // ✅ broadcast with cursor + id
    socket.to(roomId).emit("code-update", {
      code,
      cursor,
      cursorId: socket.id,
    });

    // ✅ static analysis (optional cache)
    const cacheKey = code;
    if (aiCache.has(cacheKey)) {
      io.to(roomId).emit("ai-suggestions", aiCache.get(cacheKey));
    } else {
      const issues = runStaticAnalysis(code);
      aiCache.set(cacheKey, issues);
      io.to(roomId).emit("ai-suggestions", issues);
    }
  });

  // ================= CURSOR =================
  socket.on("cursor-change", ({ roomId, cursor }) => {
    if (!rooms[roomId] || !cursor) return;

    rooms[roomId].cursors[socket.id] = cursor;

    socket.to(roomId).emit("cursor-update", {
      cursorId: socket.id,
      cursor,
    });
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
      const room = rooms[roomId];

      // ✅ remove user
      room.users = room.users.filter(u => u.id !== socket.id);

      // ✅ remove cursor
      delete room.cursors[socket.id];

      socket.to(roomId).emit("user-left", socket.id);
      io.to(roomId).emit("users-update", room.users);

      // 🧹 cleanup empty room
      if (room.users.length === 0) {
        delete rooms[roomId];
      }
    }
  });
};