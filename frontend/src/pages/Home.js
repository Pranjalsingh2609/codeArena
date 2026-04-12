import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");

  const createRoom = () => {
    const id = uuid();
    navigate(`/room/${id}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      joinRoom();
    }
  };

  const styles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "24px",
      background:
        "radial-gradient(circle at top left, #1e3a8a 0%, #0f172a 38%, #020617 100%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
    },

    glowOne: {
      position: "absolute",
      top: "-120px",
      left: "-120px",
      width: "280px",
      height: "280px",
      borderRadius: "50%",
      background: "rgba(59, 130, 246, 0.18)",
      filter: "blur(80px)",
    },

    glowTwo: {
      position: "absolute",
      bottom: "-120px",
      right: "-120px",
      width: "320px",
      height: "320px",
      borderRadius: "50%",
      background: "rgba(139, 92, 246, 0.16)",
      filter: "blur(90px)",
    },

    card: {
      width: "100%",
      maxWidth: "460px",
      padding: "36px",
      borderRadius: "24px",
      background: "rgba(15, 23, 42, 0.82)",
      border: "1px solid rgba(148, 163, 184, 0.16)",
      backdropFilter: "blur(14px)",
      boxShadow: "0 25px 60px rgba(0, 0, 0, 0.45)",
      position: "relative",
      zIndex: 1,
    },

    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 14px",
      borderRadius: "999px",
      background: "rgba(59, 130, 246, 0.12)",
      border: "1px solid rgba(96, 165, 250, 0.18)",
      color: "#93c5fd",
      fontSize: "12px",
      fontWeight: "700",
      letterSpacing: "0.4px",
      marginBottom: "18px",
    },

    title: {
      margin: "0 0 12px",
      fontSize: "36px",
      fontWeight: "800",
      lineHeight: "1.1",
      color: "#f8fafc",
    },

    highlight: {
      background: "linear-gradient(90deg, #60a5fa, #22d3ee, #a78bfa)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },

    subtitle: {
      margin: "0 0 28px",
      color: "#94a3b8",
      fontSize: "15px",
      lineHeight: "1.7",
    },

    heroBox: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "10px",
      marginBottom: "24px",
    },

    statCard: {
      padding: "12px 10px",
      borderRadius: "16px",
      background: "rgba(2, 6, 23, 0.6)",
      border: "1px solid rgba(148, 163, 184, 0.1)",
      textAlign: "center",
    },

    statValue: {
      color: "#f8fafc",
      fontSize: "15px",
      fontWeight: "700",
      marginBottom: "4px",
    },

    statLabel: {
      color: "#94a3b8",
      fontSize: "12px",
    },

    primaryButton: {
      width: "100%",
      padding: "14px 16px",
      border: "none",
      borderRadius: "14px",
      background: "linear-gradient(135deg, #2563eb, #7c3aed)",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      boxShadow: "0 14px 28px rgba(59, 130, 246, 0.28)",
      marginBottom: "20px",
      transition: "transform 0.2s ease",
    },

    dividerWrap: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "20px",
    },

    dividerLine: {
      flex: 1,
      height: "1px",
      background: "rgba(148, 163, 184, 0.16)",
    },

    dividerText: {
      color: "#64748b",
      fontSize: "12px",
      fontWeight: "600",
      letterSpacing: "0.5px",
    },

    label: {
      display: "block",
      marginBottom: "8px",
      color: "#cbd5e1",
      fontSize: "13px",
      fontWeight: "600",
      textAlign: "left",
    },

    inputWrap: {
      marginBottom: "14px",
    },

    input: {
      width: "100%",
      padding: "14px 16px",
      borderRadius: "14px",
      border: "1px solid rgba(148, 163, 184, 0.14)",
      background: "rgba(2, 6, 23, 0.85)",
      color: "#ffffff",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    },

    joinButton: {
      width: "100%",
      padding: "14px 16px",
      border: "none",
      borderRadius: "14px",
      background: "linear-gradient(135deg, #22c55e, #16a34a)",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: "700",
      cursor: roomId.trim() ? "pointer" : "not-allowed",
      opacity: roomId.trim() ? 1 : 0.7,
      boxShadow: "0 14px 28px rgba(34, 197, 94, 0.22)",
    },

    footerText: {
      marginTop: "18px",
      color: "#64748b",
      fontSize: "12px",
      textAlign: "center",
      lineHeight: "1.6",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />

      <div style={styles.card}>
        <div style={styles.badge}>⚡ LIVE COLLABORATION PLATFORM</div>

        <h1 style={styles.title}>
          Welcome to <span style={styles.highlight}>CodeArena</span>
        </h1>

        <p style={styles.subtitle}>
          Create a professional coding interview room with live code editing,
          instant collaboration, and a clean technical workspace.
        </p>

        <div style={styles.heroBox}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>Live</div>
            <div style={styles.statLabel}>Code Sync</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>Fast</div>
            <div style={styles.statLabel}>Room Join</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>Smooth</div>
            <div style={styles.statLabel}>Interview UX</div>
          </div>
        </div>

        <button style={styles.primaryButton} onClick={createRoom}>
          + Create New Interview Room
        </button>

        <div style={styles.dividerWrap}>
          <div style={styles.dividerLine} />
          <div style={styles.dividerText}>OR JOIN EXISTING ROOM</div>
          <div style={styles.dividerLine} />
        </div>

        <div style={styles.inputWrap}>
          <label style={styles.label}>Room ID</label>
          <input
            style={styles.input}
            placeholder="Paste your room ID here"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button
          style={styles.joinButton}
          onClick={joinRoom}
          disabled={!roomId.trim()}
        >
          Join Interview Room
        </button>

        <div style={styles.footerText}>
          Built for collaborative coding sessions, technical interviews, and
          real-time problem solving.
        </div>
      </div>
    </div>
  );
};

export default Home;