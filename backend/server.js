const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const socketHandler = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

// ✅ CORS for frontend
app.use(cors());
app.use(express.json());

// Basic API route
app.get("/", (req, res) => {
  res.send("CodeArena Backend is running!");
});

// 🔗 Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // replace with frontend URL in production
    methods: ["GET", "POST"],
  },
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);
  socketHandler(io, socket);
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});