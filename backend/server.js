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

const CLIENT_URL = "https://codermeet.netlify.app";

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  }),
);
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
    const uniqueId = Date.now() + "_" + Math.random().toString(36).slice(2);

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
      filename = `temp_${uniqueId}.py`;
      fs.writeFileSync(filename, code);
      process = spawn("python", [filename]);
    }

    // ✅ C++
    else if (language === "cpp") {
      filename = `temp_${uniqueId}.cpp`;
      fs.writeFileSync(filename, code);
      const exeFile = `temp_${uniqueId}.exe`;

      const compile = spawn("g++", [filename, "-o", exeFile]);

      compile.on("close", (codeCompile) => {
        if (codeCompile !== 0) {
          return res.json({ output: "Compilation Error" });
        }

        const run = spawn(exeFile);
        handleProcess(run, input, res, [filename, exeFile]);
      });

      return;
    }

    // ✅ Java
    else if (language === "java") {
      filename = `Main_${uniqueId}.java`;
      fs.writeFileSync(filename, code);

      const className = filename.replace(".java", "");

      const compile = spawn("javac", [filename]);

      compile.on("close", (codeCompile) => {
        if (codeCompile !== 0) {
          return res.json({ output: "Compilation Error" });
        }

        const run = spawn("java", [className]);
        handleProcess(run, input, res, [filename, `${className}.class`]);
      });

      return;
    } else {
      return res.json({ output: "Unsupported language" });
    }

    handleProcess(process, input, res, [filename]);
  } catch (err) {
    res.json({ output: err.message });
  }
});

// 🔥 COMMON HANDLER
function handleProcess(process, input, res, files = []) {
  let output = "";
  let errorOutput = "";

  process.stdout.on("data", (data) => {
    output += data.toString();
  });

  process.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  process.on("close", () => {
    // ✅ CLEANUP FILES
    files.forEach((file) => {
      if (file && fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

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
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    // ✅ Allow connection even without token (IMPORTANT for debugging)
    if (!token) {
      socket.user = { email: "guest@codermeet" };
      return next();
    }

    const decoded = require("jsonwebtoken").verify(
      token,
      process.env.JWT_SECRET,
    );

    socket.user = decoded;
    next();
  } catch (err) {
    console.log("Auth error:", err.message);

    // ✅ Don't block connection
    socket.user = { email: "guest@codermeet" };
    next();
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
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
