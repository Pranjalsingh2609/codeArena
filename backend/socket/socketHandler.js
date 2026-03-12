// socket/socketHandler.js
// Handles real-time code collaboration and AI-powered analysis

const { runStaticAnalysis } = require("../utils/staticAnalysis");
const { analyzeCodeWithAI } = require("../utils/aiAnalysis");

const rooms = {}; // Stores room data: code, language, users, etc.

module.exports = (io, socket) => {

  // User joins a room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        code: "",
        language: "javascript",
        users: []
      };
    }

    rooms[roomId].users.push(socket.id);

    // Sync current code and language to joining user
    socket.emit("sync-code", rooms[roomId]);

    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // User updates code
  socket.on("code-change", async ({ roomId, code }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].code = code;

    // Broadcast updated code to other users
    socket.to(roomId).emit("code-update", code);

    try {
      // 1. Run static analysis
      const staticIssues = runStaticAnalysis(code, rooms[roomId].language);

      // 2. Run AI analysis
      const aiIssues = await analyzeCodeWithAI(code, rooms[roomId].language);

      // 3. Merge issues
      const issues = [...staticIssues, ...aiIssues];

      // 4. Emit AI suggestions to all users in the room
      io.to(roomId).emit("ai-suggestions", issues);

    } catch (error) {
      console.error("Error running AI analysis:", error);
    }
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
      rooms[roomId].users = rooms[roomId].users.filter(id => id !== socket.id);

      // Delete room if empty
      if (rooms[roomId].users.length === 0) {
        delete rooms[roomId];
      }
    }
  });

};