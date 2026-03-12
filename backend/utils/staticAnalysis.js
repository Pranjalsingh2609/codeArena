// utils/staticAnalysis.js
exports.runStaticAnalysis = (code, language) => {
  const issues = [];

  if (/eval\(/.test(code)) {
    issues.push({ type: "Security", message: "Use of eval() can lead to code injection." });
  }

  if (language === "javascript" && /import .* from ['"]lodash['"]/.test(code)) {
    issues.push({ type: "License", message: "Check the license of lodash if using commercially." });
  }

  return issues;
};