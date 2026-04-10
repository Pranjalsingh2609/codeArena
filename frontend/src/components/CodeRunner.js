import React from "react";

const CodeRunner = ({ code, language, setOutput }) => {

  const runCode = () => {
    console.log("Running code...");
    
    // Demo output (replace with API later)
    setOutput(`Output:\n${code}`);
  };

  return (
    <div style={{ marginBottom: "8px" }}>
      <button
        onClick={runCode}
        style={{
          padding: "10px 18px",
          background: "#22c55e",
          color: "#000",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        ▶ Run Code
      </button>
    </div>
  );
};

export default CodeRunner;