const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const socketHandler = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

/* -------------------- MIDDLEWARE -------------------- */

// CORS (restrict in production)
app.use(
  cors({
    origin: "*", // 🔥 Replace with your frontend URL in production
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
  const { code, language, input } = req.body;

  if (!code) {
    return res.status(400).json({ output: "⚠️ No code provided" });
  }

  try {
    let output = "";

    // ⚠️ DEMO EXECUTION (ONLY JS)
    if (language === "javascript") {
      try {
        // Capture console.log output
        const logs = [];
        const originalLog = console.log;

        console.log = (...args) => {
          logs.push(args.join(" "));
        };

        // Run code
        const result = eval(code); // ⚠️ Not safe for production

        console.log = originalLog;

        output =
          logs.length > 0
            ? logs.join("\n")
            : result !== undefined
            ? result.toString()
            : "✅ Code executed successfully";
      } catch (err) {
        output = "❌ " + err.message;
      }
    } else {
      output = "⚠️ Currently only JavaScript is supported";
    }

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
    origin: "*", // 🔥 Replace with frontend URL later
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