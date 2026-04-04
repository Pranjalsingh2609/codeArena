import React, { useState } from "react";

const CodeRunner = ({ code, setOutput }) => {
  const [loading, setLoading] = useState(false);

  const runCode = async () => {
    setLoading(true);
    setOutput("Running...");

    try {
      const res = await fetch("http://localhost:5000/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      setOutput(data.output || "No output");
    } catch (err) {
      setOutput("Error running code");
    }

    setLoading(false);
  };

  return (
    <button
      onClick={runCode}
      disabled={loading}
      style={{
        padding: "8px 16px",
        background: "#22c55e",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      {loading ? "Running..." : "Run Code"}
    </button>
  );
};

export default CodeRunner;