const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const socketHandler = require("./socket/socketHandler");
const runCode = require("./services/dockerRunner"); // ✅ Docker runner

const app = express();
const server = http.createServer(app);

/* -------------------- MIDDLEWARE -------------------- */

app.use(
  cors({
    origin: "*", // 🔥 change to frontend URL in production
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

/* -------------------- ROUTES -------------------- */

// Health check
app.get("/", (req, res) => {
  res.send("🚀 CodeArena Backend is running!");
});

/* -------------------- RUN CODE API -------------------- */

app.post("/api/run", async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      output: "⚠️ Code and language are required",
    });
  }

  try {
    // 🚀 Run inside Docker sandbox
    const output = await runCode(code, language);

    res.json({ output });
  } catch (error) {
    console.error("Run API Error:", error);

    res.status(500).json({
      output: "❌ Server error while executing code",
    });
  }
});

/* -------------------- SOCKET.IO -------------------- */

const io = new Server(server, {
  cors: {
    origin: "*", // 🔥 replace in production
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socketHandler(io, socket);

  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

/* -------------------- SERVER START -------------------- */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});