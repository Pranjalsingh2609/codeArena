import React, { useEffect, useState, useCallback } from "react";

const CodeRunner = ({ code, language, setOutput }) => {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const BASE_URL = "https://codearena123.duckdns.org";

  const runCode = useCallback(async () => {
    if (loading) return;

    if (!code?.trim()) {
      setOutput("⚠️ No code to run");
      return;
    }

    setLoading(true);
    setOutput("⏳ Running...\n");
    setAnalysis("");

    try {
      const res = await fetch(`${BASE_URL}/api/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          input,
        }),
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const data = await res.json();

      if (!input && (!data.output || data.output.trim() === "")) {
        setShowInput(true);
        setOutput("⚠️ Input required.\nPlease provide input and run again.");
      } else {
        setOutput(data.output || "No output returned.");
      }

      setAnalysis("✅ Code executed successfully.");
    } catch (error) {
      console.error("Run Error:", error);
      setOutput("❌ Failed to execute code. Check backend or network.");
      setAnalysis("");
    } finally {
      setLoading(false);
    }
  }, [code, language, input, loading, setOutput]);

  useEffect(() => {
    const handleRunCode = () => {
      runCode();
    };

    const handleToggleInput = () => {
      setShowInput((prev) => !prev);
    };

    document.addEventListener("run-code", handleRunCode);
    document.addEventListener("toggle-input", handleToggleInput);

    return () => {
      document.removeEventListener("run-code", handleRunCode);
      document.removeEventListener("toggle-input", handleToggleInput);
    };
  }, [runCode]);

  return (
    <div style={styles.container}>
      {showInput && (
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input (stdin)..."
          style={styles.textarea}
        />
      )}

      {analysis && (
        <div style={styles.analysisBox}>
          <strong>AI Analysis:</strong>
          <div>{analysis}</div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    background: "#020617",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  textarea: {
    width: "100%",
    minHeight: "80px",
    background: "#1e293b",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "13px",
    resize: "vertical",
    outline: "none",
  },

  analysisBox: {
    background: "#0f172a",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#e2e8f0",
    border: "1px solid #1e293b",
  },
};

export default CodeRunner;