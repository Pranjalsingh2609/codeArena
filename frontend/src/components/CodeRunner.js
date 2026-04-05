import React, { useState } from "react";

const CodeRunner = ({ code, language }) => {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [output, setOutput] = useState("");
  const [analysis, setAnalysis] = useState("");



  const runCode = async () => {
    setLoading(true);
    setOutput("⏳ Running...\n");

    try {
     const res = await fetch("https://codearena-az4r.onrender.com/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, input }),
      });

      const data = await res.json();

      if (!input && (!data.output || data.output.trim() === "")) {
        setShowInput(true);
        setOutput("⚠️ Program may require input.\nEnter input below and run again.");
      } else {
        setOutput(data.output || "No output");
      }

      // Simple AI Analysis placeholder
      setAnalysis("No issues detected.");
    } catch (err) {
      console.error(err);
      setOutput("❌ Error running code");
      setAnalysis("");
    }

    setLoading(false);
  };

  return (
    <div className="code-runner-container" style={styles.container}>
      {/* Buttons */}
      <div style={styles.buttonContainer}>
        <button
          onClick={() => setShowInput(prev => !prev)}
          style={styles.toggleButton}
          onMouseOver={(e) => { e.target.style.background = "#38bdf8"; e.target.style.color = "#0f172a"; }}
          onMouseOut={(e) => { e.target.style.background = "#1e293b"; e.target.style.color = "#38bdf8"; }}
        >
          {showInput ? "Hide Input" : "Add Input"}
        </button>

        <button
          onClick={runCode}
          disabled={loading}
          style={{ ...styles.runButton, background: loading ? "#334155" : "#22c55e", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Running..." : "▶ Run"}
        </button>
      </div>

      {/* Input Area */}
      {showInput && (
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input here..."
          style={styles.textarea}
        />
      )}

      {/* Output Console */}
      {output && (
        <div style={{ ...styles.console, minHeight: output ? "120px" : "0" }}>
          {output}
        </div>
      )}

      {/* AI Analysis */}
      {analysis && (
        <div style={{ ...styles.console, minHeight: "0", borderTop: "1px solid #334155" }}>
          <strong style={{ color: "#38bdf8" }}>AI Analysis:</strong>
          <div>{analysis}</div>
        </div>
      )}
    </div>
  );
};

// Reusable styles
const styles = {
  container: {
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    background: "#0f172a",
    borderRadius: "10px",
    padding: "20px",
    fontFamily: "Fira Code, monospace",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },
  toggleButton: {
    background: "#1e293b",
    color: "#38bdf8",
    border: "1px solid #334155",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s",
  },
  runButton: {
    color: "#fff",
    borderRadius: "6px",
    border: "none",
    fontWeight: "600",
    fontSize: "14px",
    padding: "8px 20px",
    transition: "all 0.3s",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  textarea: {
    width: "100%",
    minHeight: "80px",
    background: "#1e293b",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "12px",
    fontSize: "14px",
    outline: "none",
    caretColor: "#22c55e",
    resize: "vertical",
    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)",
    transition: "border 0.3s",
  },
  console: {
    width: "100%",
    background: "#1e293b",
    borderRadius: "6px",
    padding: "12px",
    color: "#fff",
    fontSize: "14px",
    lineHeight: "1.5",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)",
  },
};

export default CodeRunner;