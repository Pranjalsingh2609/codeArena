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
    if (roomId.trim() !== "") {
      navigate(`/room/${roomId}`);
    }
  };

  const styles = {
    page: {
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#020617",
      fontFamily: "Inter, sans-serif"
    },

    card: {
      background: "#0f172a",
      padding: "40px",
      borderRadius: "12px",
      width: "380px",
      textAlign: "center",
      border: "1px solid #1e293b",
      boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
    },

    title: {
      color: "white",
      marginBottom: "10px",
      fontSize: "28px"
    },

    subtitle: {
      color: "#94a3b8",
      fontSize: "14px",
      marginBottom: "30px"
    },

    button: {
      width: "100%",
      padding: "12px",
      background: "#6366f1",
      border: "none",
      borderRadius: "6px",
      color: "white",
      fontSize: "14px",
      cursor: "pointer",
      marginBottom: "15px"
    },

    input: {
      width: "100%",
      padding: "10px",
      borderRadius: "6px",
      border: "1px solid #334155",
      background: "#020617",
      color: "white",
      marginBottom: "10px",
      outline: "none"
    },

    joinButton: {
      width: "100%",
      padding: "12px",
      background: "#22c55e",
      border: "none",
      borderRadius: "6px",
      color: "white",
      fontSize: "14px",
      cursor: "pointer"
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.card}>

        <h1 style={styles.title}>🚀 CodeMeet</h1>

        <p style={styles.subtitle}>
          Real-time collaborative coding interviews
        </p>

        <button style={styles.button} onClick={createRoom}>
          Create Interview Room
        </button>

        <input
          style={styles.input}
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button style={styles.joinButton} onClick={joinRoom}>
          Join Room
        </button>

      </div>

    </div>
  );
};

export default Home;