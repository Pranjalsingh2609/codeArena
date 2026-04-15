import React from "react";

const OutputConsole = ({ output }) => {
  const styles = {
    container: {
      background: "#020617",
      color: "#22c55e",
      padding: "14px",
      height: "240px",
      overflowY: "auto",
      fontFamily: "Fira Code, monospace",
      borderRadius: "8px",
      border: "1px solid #1e293b",
      boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    },

    header: {
      color: "#94a3b8",
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "8px",
      borderBottom: "1px solid #1e293b",
      paddingBottom: "6px",
    },

    output: {
      fontSize: "14px",
      whiteSpace: "pre-wrap",
      lineHeight: "1.5",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Console</div>
      <pre style={styles.output}>
        {output || "Program output will appear here..."}
      </pre>
    </div>
  );
};

export default OutputConsole;