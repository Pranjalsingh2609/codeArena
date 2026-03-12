// controllers/codeAnalysisController.js
// Handles code analysis for security, ethics, privacy, and license compliance

const { analyzeCodeWithAI } = require("../utils/aiAnalysis");
const { runStaticAnalysis } = require("../utils/staticAnalysis");

exports.analyzeCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "Code and language are required." });
    }

    // 1. Run static analysis (pattern checks)
    const staticIssues = runStaticAnalysis(code, language);

    // 2. Run AI analysis for more advanced checks
    const aiIssues = await analyzeCodeWithAI(code, language);

    // 3. Merge issues (remove duplicates if needed)
    const issues = [...staticIssues, ...aiIssues];

    return res.json({ issues });
  } catch (error) {
    console.error("Error analyzing code:", error);
    return res.status(500).json({ error: "Failed to analyze code." });
  }
};