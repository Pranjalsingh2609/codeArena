import React, { useEffect, useState } from "react";

const Timer = () => {

  const [seconds, setSeconds] = useState(0);

  useEffect(() => {

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);

  }, []);

  const formatTime = () => {

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const mm = String(minutes).padStart(2, "0");
    const ss = String(remainingSeconds).padStart(2, "0");

    return `${mm}:${ss}`;
  };

  const styles = {
    container: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      background: "#0f172a",
      padding: "6px 12px",
      borderRadius: "6px",
      border: "1px solid #1e293b",
      fontFamily: "Fira Code, monospace",
      color: "#facc15",
      fontSize: "14px",
      fontWeight: "500",
      width: "fit-content",
      boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
    },

    icon: {
      fontSize: "16px"
    }
  };

  return (
    <div style={styles.container}>
      <span style={styles.icon}>⏱</span>
      <span>{formatTime()}</span>
    </div>
  );
};

export default Timer;