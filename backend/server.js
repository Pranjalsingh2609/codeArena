
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

// Import routes and socket handler
const codeAnalysisRoutes = require("./routes/codeAnalysis");
const socketHandler = require("./socket/socketHandler");
const authRoutes = require("./routes/authRoutes");


// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON requests
app.use("/api/auth", authRoutes);
// Routes
app.use("/api", codeAnalysisRoutes);

// Root route for testing server
app.get("/", (req, res) => {
  res.send("AI-Powered Code Ethics & Security Advisor Backend Running");
});

app.post("/api/run", (req, res) => {
  const { code } = req.body;

  let output = [];

  try {
    // Backup original console.log
    const originalLog = console.log;

    // Override console.log
    console.log = (...args) => {
      output.push(args.join(" "));
    };

    eval(code);

    // Restore console.log
    console.log = originalLog;

    res.json({ output: output.join("\n") || "No output" });
  } catch (err) {
    res.json({ output: err.message });
  }
});

// Create HTTP server and attach Socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow any origin (adjust for production)
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) return next(new Error("No token"));

  try {
    const decoded = require("jsonwebtoken").verify(
      token,
      process.env.JWT_SECRET
    );

    socket.user = decoded;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
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