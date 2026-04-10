const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const runCode = (code, language) => {
  return new Promise((resolve) => {
    const jobId = Date.now();
    const dir = path.join(__dirname, `../temp/${jobId}`);

    fs.mkdirSync(dir, { recursive: true });

    let command = "";

    // ---------------- JAVASCRIPT ----------------
    if (language === "javascript") {
      fs.writeFileSync(`${dir}/Main.js`, code);

      command = `docker run --rm -v ${dir}:/app -w /app node:18 node Main.js`;
    }

    // ---------------- PYTHON ----------------
    else if (language === "python") {
      fs.writeFileSync(`${dir}/Main.py`, code);

      command = `docker run --rm -v ${dir}:/app -w /app python:3.10 python Main.py`;
    }

    // ---------------- C++ ----------------
    else if (language === "cpp") {
      fs.writeFileSync(`${dir}/Main.cpp`, code);

      command = `docker run --rm -v ${dir}:/app -w /app gcc:latest sh -c "g++ Main.cpp -o main && ./main"`;
    }

    // ---------------- JAVA ----------------
    else if (language === "java") {
      fs.writeFileSync(`${dir}/Main.java`, code);

      command = `docker run --rm -v ${dir}:/app -w /app openjdk:17 sh -c "javac Main.java && java Main"`;
    }

    else {
      return resolve("❌ Unsupported language");
    }

    // 🔥 TIME LIMIT (10 seconds safe default)
    exec(command, { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) {
        return resolve(stderr || err.message);
      }
      resolve(stdout || "✅ Executed successfully");
    });
  });
};

module.exports = runCode;