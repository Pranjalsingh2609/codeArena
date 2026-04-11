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

      const inputPath = path.join(dir, "input.txt");
      fs.writeFileSync(inputPath, input, "utf8");

      let command = "";

      if (language === "javascript") {
        fs.writeFileSync(path.join(dir, "Main.js"), code, "utf8");
        command = `${DOCKER_BIN} run --rm -i --network none -m 128m --cpus=0.5 -v "${dir}:/app" -w /app node:18 sh -c "node Main.js" < "${inputPath}"`;
      } else if (language === "python") {
        fs.writeFileSync(path.join(dir, "Main.py"), code, "utf8");
        command = `${DOCKER_BIN} run --rm -i --network none -m 128m --cpus=0.5 -v "${dir}:/app" -w /app python:3.10 sh -c "python Main.py" < "${inputPath}"`;
      } else if (language === "cpp") {
        fs.writeFileSync(path.join(dir, "Main.cpp"), code, "utf8");
        command = `${DOCKER_BIN} run --rm -i --network none -m 256m --cpus=0.5 -v "${dir}:/app" -w /app gcc:latest sh -c "g++ Main.cpp -o main && ./main" < "${inputPath}"`;
      } else if (language === "java") {
        fs.writeFileSync(path.join(dir, "Main.java"), code, "utf8");
        command = `${DOCKER_BIN} run --rm -i --network none -m 256m --cpus=0.5 -v "${dir}:/app" -w /app openjdk:17 sh -c "javac Main.java && java Main" < "${inputPath}"`;
      } else {
        return resolve("❌ Unsupported language");
      }

      exec(
        command,
        {
          timeout: 10000,
          maxBuffer: 1024 * 1024,
          env: { ...process.env, PATH: `${process.env.PATH || ""}:/usr/bin:/bin` },
        },
        (err, stdout, stderr) => {
          try {
            fs.rmSync(dir, { recursive: true, force: true });
          } catch {}

          if (err) {
            return resolve((stderr || err.message || "❌ Execution failed").trim());
          }

          resolve((stdout || stderr || "").trim() || "✅ Executed successfully");
        }
      );
    } catch (error) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {}

      resolve(`❌ Server error: ${error.message}`);
    }
  });
};

module.exports = runCode;
