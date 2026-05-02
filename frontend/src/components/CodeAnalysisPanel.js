// components/CodeAnalysisPanel.js
import React, { useState, useEffect } from "react";
import { socket } from "../socket";

const CodeAnalysisPanel = ({ roomId }) => {
  const [analysis, setAnalysis] = useState([]);

  useEffect(() => {
    if (!roomId) return;

    // Listen for AI suggestions from backend
    socket.on("ai-suggestions", (issues) => {
      setAnalysis(issues || []);
    });

    // Cleanup on unmount
    return () => {
      socket.off("ai-suggestions");
    };
  }, [roomId]);

  return (
    <div
      style={{
        background: "#111827",
        color: "#facc15",
        padding: "10px",
        height: "50px",
        overflowY: "auto",
        borderRadius: "8px",
        border: "1px solid #1e293b",
        fontFamily: "Fira Code, monospace",
      }}
    >
      <div style={{ fontWeight: "600", marginBottom: "6px" }}>AI Analysis</div>
      {analysis.length === 0 ? (
        <div>No issues detected.</div>
      ) : (
        analysis.map((issue, idx) => (
          <div key={idx} style={{ marginBottom: "4px" }}>
            <strong>{issue.type}:</strong> {issue.message}
          </div>
        ))
      )}
    </div>
  );
};

export default CodeAnalysisPanel;
