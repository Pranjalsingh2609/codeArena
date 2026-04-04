const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.analyzeCodeWithAI = async (code, language) => {
  if (!code || code.trim().length < 5) return [];

  // 🔥 STRONG PROMPT (very important)
  const prompt = `
You are a senior software engineer and security expert.

Analyze the given ${language} code carefully.

Focus on:
- Security vulnerabilities (injection, XSS, auth issues)
- Bugs / logical errors
- Performance issues
- Bad practices

Return ONLY a valid JSON array.

Each item MUST follow this format:
{
  "type": "security | bug | performance | style",
  "severity": "low | medium | high",
  "message": "clear explanation",
  "line": "line number if possible",
  "fix": "how to fix it"
}

Do NOT include any explanation outside JSON.

Code:
${code}
`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      max_output_tokens: 400,
    });

    let text = response.output_text?.trim() || "";

    // 🧠 CLEAN JSON EXTRACTION (very important)
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");

    if (start === -1 || end === -1) {
      throw new Error("Invalid JSON format from AI");
    }

    const jsonString = text.slice(start, end + 1);

    let issues = JSON.parse(jsonString);

    // ✅ Normalize output (extra safety)
    issues = issues.map((issue) => ({
      type: issue.type || "unknown",
      severity: issue.severity || "low",
      message: issue.message || "No description",
      line: issue.line || null,
      fix: issue.fix || "No fix provided",
    }));

    return issues;

  } catch (error) {
    console.error("AI analysis error:", error.message);

    return [
      {
        type: "system",
        severity: "low",
        message: "AI analysis failed",
        line: null,
        fix: "Try again later",
      },
    ];
  }
};