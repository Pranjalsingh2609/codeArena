// socket/socketHandler.js
// Handles real-time code collaboration and AI-powered analysis

const { runStaticAnalysis } = require("../utils/staticAnalysis");
const { analyzeCodeWithAI } = require("../utils/aiAnalysis");

const rooms = {}; // Stores room data: code, language, users, etc.

module.exports = (io, socket) => {
  // User joins a room
  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        code: "",
        language: "javascript",
        users: [],
        messages: [],
      };
    }

    // ✅ store user properly
    rooms[roomId].users.push({
      id: socket.id,
      name: username,
    });

    // ✅ send users list to all
    io.to(roomId).emit("users-update", rooms[roomId].users);

    socket.emit("sync-code", rooms[roomId]);
    socket.emit("chat-history", rooms[roomId].messages);
  });

  const debounceTimers = {};
  const aiCache = new Map();

  socket.on("code-change", ({ roomId, code }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].code = code;

    socket.to(roomId).emit("code-update", code);

    // 🧠 STATIC ANALYSIS (fast → keep immediate)
    const staticIssues = runStaticAnalysis(code, rooms[roomId].language);
    io.to(roomId).emit("ai-suggestions", staticIssues);

    // 🚀 AI ANALYSIS (debounced)
    if (debounceTimers[roomId]) {
      clearTimeout(debounceTimers[roomId]);
    }

    debounceTimers[roomId] = setTimeout(async () => {
      try {
        const cacheKey = code.slice(0, 200); // simple hash substitute

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
    }, 1200); // 🧠 1.2 sec debounce
  });

  // 🎥 VIDEO SIGNALING

  socket.on("join-video", (roomId) => {
    socket.join(roomId);

    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

    // Notify others someone joined
    socket.to(roomId).emit("user-joined-video", socket.id);

    // Send existing users list to new user
    socket.emit(
      "all-users",
      clients.filter((id) => id !== socket.id),
    );
  });

  // 📡 Sending signal (offer/answer)
  socket.on("sending-signal", ({ userToSignal, signal }) => {
    io.to(userToSignal).emit("receiving-signal", {
      signal,
      from: socket.id,
    });
  });

  // 📡 Returning signal
  socket.on("returning-signal", ({ signal, to }) => {
    io.to(to).emit("signal-returned", {
      signal,
      from: socket.id,
    });
  });

  // User changes language
  socket.on("language-change", ({ roomId, language }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].language = language;

    socket.to(roomId).emit("language-update", language);

    console.log(`Room ${roomId} language changed to ${language}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    for (const roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter(
        (id) => id !== socket.id,
      );

      // Delete room if empty
      if (rooms[roomId].users.length === 0) {
        delete rooms[roomId];
      }
    }
  });

  // 💬 CHAT MESSAGE
  socket.on("send-message", ({ roomId, message }) => {
    if (!rooms[roomId]) return;

    const newMessage = {
      user: socket.user?.email || "Anonymous",
      text: message,
      time: new Date().toISOString(),
    };

    // Save message
    rooms[roomId].messages.push(newMessage);

    // Broadcast to room
    io.to(roomId).emit("receive-message", newMessage);
  });
};
