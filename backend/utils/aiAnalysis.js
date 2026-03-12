// utils/aiAnalysis.js

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.analyzeCodeWithAI = async (code, language) => {
  if (!code) return [];

  const prompt = `
Analyze the following ${language} code.

Check for:
1. Security vulnerabilities
2. Ethical issues (bias, privacy leaks)
3. License or compliance issues

Return ONLY valid JSON like this:
[
  { "type": "security", "message": "SQL injection risk" }
]

Code:
${code}
`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      max_output_tokens: 500,
    });

    const responseText = response.output_text;

    let issues = [];

    try {
      issues = JSON.parse(responseText);
    } catch {
      issues = [
        {
          type: "ai_response",
          message: responseText,
        },
      ];
    }

    return issues;

  } catch (error) {
    console.error("AI analysis error:", error.message);
    return [
      {
        type: "system",
        message: "AI analysis failed",
      },
    ];
  }
};