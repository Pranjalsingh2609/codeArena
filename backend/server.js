const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const { spawn } = require("child_process");
const { NodeVM } = require("vm2"); // ✅ Safe JS sandbox
require("dotenv").config();

// Import routes and socket handler
const codeAnalysisRoutes = require("./routes/codeAnalysis");
const authRoutes = require("./routes/authRoutes");
const socketHandler = require("./socket/socketHandler");

// Initialize Express
const app = express();
const CLIENT_URL = "https://codermeet.netlify.app";

// Middleware
app.use(cors({ origin: CLIENT_URL, methods: ["GET", "POST"], credentials: true }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", codeAnalysisRoutes);

// Root route
app.get("/", (req, res) => res.send("AI-Powered Code Ethics & Security Advisor Backend Running"));

// Code execution route
app.post("/api/run", async (req, res) => {
  const { code, language, input } = req.body;
  const uniqueId = Date.now() + "_" + Math.random().toString(36).slice(2);
  let filename, process;

  try {
    if (language === "javascript") {
      // ✅ Sandbox JS using vm2
      const vm = new NodeVM({
        console: "redirect",
        sandbox: { input },
        timeout: 3000, // 3 seconds max
      });

      let output = [];
      vm.on("console.log", (...args) => output.push(args.join(" ")));

      try {
        await vm.run(`(async () => { ${code} })()`);
      } catch (err) {
        return res.json({ output: `JS Error: ${err.message}` });
      }

      return res.json({ output: output.join("\n") || "No output" });
    }

    // Python
    else if (language === "python") {
      filename = `temp_${uniqueId}.py`;
      fs.writeFileSync(filename, code);
      process = spawn("python", [filename]);
    }

    // C++
    else if (language === "cpp") {
      filename = `temp_${uniqueId}.cpp`;
      fs.writeFileSync(filename, code);
      const exeFile = `temp_${uniqueId}.exe`;

      const compile = spawn("g++", [filename, "-o", exeFile]);
      compile.on("close", (codeCompile) => {
        if (codeCompile !== 0) return res.json({ output: "Compilation Error" });
        const run = spawn(`./${exeFile}`);
        handleProcess(run, input, res, [filename, exeFile]);
      });
      return;
    }

    // Java
    else if (language === "java") {
      filename = `Main_${uniqueId}.java`;
      fs.writeFileSync(filename, code);
      const className = filename.replace(".java", "");

      const compile = spawn("javac", [filename]);
      compile.on("close", (codeCompile) => {
        if (codeCompile !== 0) return res.json({ output: "Compilation Error" });
        const run = spawn("java", [className]);
        handleProcess(run, input, res, [filename, `${className}.class`]);
      });
      return;
    } else {
      return res.json({ output: "Unsupported language" });
    }

    handleProcess(process, input, res, [filename]);
  } catch (err) {
    return res.json({ output: err.message });
  }
});

// 🔹 Common process handler
function handleProcess(process, input, res, files = []) {
  let output = "";
  let errorOutput = "";

  process.stdout.on("data", (data) => (output += data.toString()));
  process.stderr.on("data", (data) => (errorOutput += data.toString()));

  process.on("close", () => {
    // Cleanup temp files
    files.forEach(file => file && fs.existsSync(file) && fs.unlinkSync(file));
    if (errorOutput) return res.json({ output: errorOutput });
    return res.json({ output: output || "No output" });
  });

  if (input) process.stdin.write(input + "\n");
  process.stdin.end();
}

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"], credentials: true },
  transports: ["websocket", "polling"],
});

// Socket authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      socket.user = { email: "guest@codermeet" };
      return next();
    }
    const decoded = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.log("Auth error:", err.message);
    socket.user = { email: "guest@codermeet" };
    next();
  }
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socketHandler(io, socket);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));