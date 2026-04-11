const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const DOCKER_BIN = "/usr/bin/docker";

const runCode = (code, language, input = "") => {
  return new Promise((resolve) => {
    const jobId = Date.now().toString();
    const dir = path.join(__dirname, "..", "temp", jobId);

    try {
      fs.mkdirSync(dir, { recursive: true });

      let command = "";

      // ---------------- JAVASCRIPT ----------------
      if (language === "javascript") {
        fs.writeFileSync(path.join(dir, "Main.js"), code, "utf8");
        fs.writeFileSync(path.join(dir, "input.txt"), input, "utf8");

        command = `${DOCKER_BIN} run --rm -v "${dir}:/app" -w /app node:18 sh -c "node Main.js < input.txt"`;
      }

      // ---------------- PYTHON ----------------
      else if (language === "python") {
        fs.writeFileSync(path.join(dir, "Main.py"), code, "utf8");
        fs.writeFileSync(path.join(dir, "input.txt"), input, "utf8");

        command = `${DOCKER_BIN} run --rm -v "${dir}:/app" -w /app python:3.10 sh -c "python Main.py < input.txt"`;
      }

      // ---------------- C++ ----------------
      else if (language === "cpp") {
        fs.writeFileSync(path.join(dir, "Main.cpp"), code, "utf8");
        fs.writeFileSync(path.join(dir, "input.txt"), input, "utf8");

        command = `${DOCKER_BIN} run --rm -v "${dir}:/app" -w /app gcc:latest sh -c "g++ Main.cpp -o main && ./main < input.txt"`;
      }

      // ---------------- JAVA ----------------
      else if (language === "java") {
        fs.writeFileSync(path.join(dir, "Main.java"), code, "utf8");
        fs.writeFileSync(path.join(dir, "input.txt"), input, "utf8");

        command = `${DOCKER_BIN} run --rm -v "${dir}:/app" -w /app openjdk:17 sh -c "javac Main.java && java Main < input.txt"`;
      }

      else {
        return resolve("❌ Unsupported language");
      }

      exec(command, { timeout: 10000 }, (err, stdout, stderr) => {
        try {
          fs.rmSync(dir, { recursive: true, force: true });
        } catch {}

        if (err) {
          return resolve(stderr || err.message || "❌ Execution failed");
        }

        resolve(stdout || "✅ Executed successfully");
      });
    } catch (error) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {}

      resolve(`❌ Server error: ${error.message}`);
    }
  });
};

module.exports = runCode;