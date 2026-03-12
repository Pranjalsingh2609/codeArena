
// server.js
// Backend server for AI-Powered Code Ethics & Security Advisor

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

// Import routes and socket handler
const codeAnalysisRoutes = require("./routes/codeAnalysis");
const socketHandler = require("./socket/socketHandler");

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON requests

// Routes
app.use("/api", codeAnalysisRoutes);

// Root route for testing server
app.get("/", (req, res) => {
  res.send("AI-Powered Code Ethics & Security Advisor Backend Running");
});

// Create HTTP server and attach Socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow any origin (adjust for production)
    methods: ["GET", "POST"],
  },
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Delegate socket events to handler
  socketHandler(io, socket);

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});