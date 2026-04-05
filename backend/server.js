const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const { spawn } = require("child_process");
const fs = require("fs");

// Import routes and socket handler
const codeAnalysisRoutes = require("./routes/codeAnalysis");
const socketHandler = require("./socket/socketHandler");
const authRoutes = require("./routes/authRoutes");

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: "https://codermeet.netlify.app",
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json()); // Parse JSON requests
app.use("/api/auth", authRoutes);
// Routes
app.use("/api", codeAnalysisRoutes);

// Root route for testing server
app.get("/", (req, res) => {
  res.send("AI-Powered Code Ethics & Security Advisor Backend Running");
});


app.post("/api/run", (req, res) => {
  const { code, language, input } = req.body;

  let filename, process;

  try {
    // ✅ JavaScript
    if (language === "javascript") {
      let output = [];

      const originalLog = console.log;
      console.log = (...args) => output.push(args.join(" "));

      eval(code);

      console.log = originalLog;

      return res.json({ output: output.join("\n") || "No output" });
    }

    // ✅ Python
    else if (language === "python") {
      filename = "temp.py";
      fs.writeFileSync(filename, code);

      process = spawn("python", [filename]);
    }

    // ✅ C++
    else if (language === "cpp") {
      filename = "temp.cpp";
      fs.writeFileSync(filename, code);

      const compile = spawn("g++", ["temp.cpp", "-o", "temp.exe"]);

      compile.on("close", (codeCompile) => {
        if (codeCompile !== 0) {
          return res.json({ output: "Compilation Error" });
        }

        const run = spawn("temp.exe");

        handleProcess(run, input, res);
      });

      return;
    }

    // ✅ Java
    else if (language === "java") {
      filename = "Main.java";
      fs.writeFileSync(filename, code);

      const compile = spawn("javac", ["Main.java"]);

      compile.on("close", (codeCompile) => {
        if (codeCompile !== 0) {
          return res.json({ output: "Compilation Error" });
        }

        const run = spawn("java", ["Main"]);

        handleProcess(run, input, res);
      });

      return;
    }

    else {
      return res.json({ output: "Unsupported language" });
    }

    handleProcess(process, input, res);

  } catch (err) {
    res.json({ output: err.message });
  }
});

// 🔥 COMMON HANDLER
function handleProcess(process, input, res) {
  let output = "";
  let errorOutput = "";

  process.stdout.on("data", (data) => {
    output += data.toString();
  });

  process.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  process.on("close", () => {
    if (errorOutput) {
      return res.json({ output: errorOutput });
    }
    res.json({ output: output || "No output" });
  });

  // ✅ SAFE INPUT WRITE
  if (input) {
    process.stdin.write(input + "\n");
  }
  process.stdin.end();
}

// Create HTTP server and attach Socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
   origin: "https://codermeet.netlify.app",
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) return next(new Error("No token"));

  try {
    const decoded = require("jsonwebtoken").verify(
      token,
      process.env.JWT_SECRET,
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
const PORT = process.env.PORT || 8080 ;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
