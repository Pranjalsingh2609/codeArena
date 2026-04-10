import React, { useState } from "react";

const CodeRunner = ({ code, language, setOutput }) => {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const runCode = async () => {
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

      // Handle no output case
      if (!input && (!data.output || data.output.trim() === "")) {
        setShowInput(true);
        setOutput("⚠️ Input required.\nPlease provide input and run again.");
      } else {
        setOutput(data.output || "No output returned.");
      }

      // Simple AI feedback (can upgrade later)
      setAnalysis("✅ Code executed successfully.");

    } catch (error) {
      console.error("Run Error:", error);
      setOutput("❌ Failed to execute code. Check backend or network.");
      setAnalysis("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      
      {/* Controls */}
      <div style={styles.header}>
        <button
          onClick={() => setShowInput((prev) => !prev)}
          style={styles.toggleBtn}
        >
          {showInput ? "Hide Input" : "Add Input"}
        </button>

        <button
          onClick={runCode}
          disabled={loading}
          style={{
            ...styles.runBtn,
            background: loading ? "#334155" : "#22c55e",
          }}
        >
          {loading ? "Running..." : "▶ Run Code"}
        </button>
      </div>

      {/* Input Box */}
      {showInput && (
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input (stdin)..."
          style={styles.textarea}
        />
      )}

      {/* AI Analysis */}
      {analysis && (
        <div style={styles.analysisBox}>
          <strong>AI Analysis:</strong>
          <div>{analysis}</div>
        </div>
      )}
    </div>
  );
};

/* Styles */
const styles = {
  container: {
    width: "100%",
    background: "#020617",
    borderRadius: "10px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    border: "1px solid #1e293b",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },

  toggleBtn: {
    background: "#1e293b",
    color: "#38bdf8",
    border: "1px solid #334155",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },

  runBtn: {
    color: "#000",
    border: "none",
    borderRadius: "6px",
    padding: "6px 16px",
    fontWeight: "600",
    cursor: "pointer",
  },

  textarea: {
    width: "100%",
    minHeight: "80px",
    background: "#1e293b",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "10px",
    fontSize: "13px",
    resize: "vertical",
  },

  analysisBox: {
    background: "#0f172a",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#e2e8f0",
    border: "1px solid #1e293b",
  },
};

export default CodeRunner;