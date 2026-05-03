const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

exports.analyzeCodeWithAI = async (code, language) => {
  if (!code || code.trim().length < 5) return [];

  const prompt = `
You are a senior software engineer and security expert.

Analyze this ${language} code.

Find:
- security issues
- bugs
- performance issues
- bad practices
- improvements

Return ONLY valid JSON array.

Format:
[
  {
    "type": "security | bug | performance | style",
    "severity": "low | medium | high",
    "message": "clear issue",
    "line": "line number if possible",
    "fix": "how to fix it"
  }
]

Code:
${code}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";

    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");

    if (start === -1 || end === -1) {
      throw new Error("Invalid JSON from Groq");
    }

    return JSON.parse(text.slice(start, end + 1));
  } catch (error) {
    console.error("Groq AI analysis error:", error.message);

    return [
      {
        type: "system",
        severity: "low",
        message: "Groq AI analysis failed",
        line: null,
        fix: "Check GROQ_API_KEY or Groq logs",
      },
    ];
  }
};
