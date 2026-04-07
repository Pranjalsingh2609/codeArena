import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

import CodeEditor from "../components/CodeEditor";
import LanguageSelector from "../components/LanguageSelector";
import OutputConsole from "../components/OutputConsole";
import VideoCall from "../components/VideoCall";
import Timer from "../components/Timer";
import CodeAnalysisPanel from "../components/CodeAnalysisPanel";
import CodeRunner from "../components/CodeRunner";
import { socket } from "../socket";

const InterviewRoom = () => {
  const { roomId } = useParams();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);

  const chatRef = useRef(null);
  useEffect(() => {
    socket.emit("join-room", {
      roomId,
      username: "User-" + Math.floor(Math.random() * 1000),
    });

    // 🔥 CLEAR OLD LISTENERS (VERY IMPORTANT)
    socket.off("sync-code");
    socket.off("language-update");
    socket.off("chat-history");
    socket.off("receive-message");
    socket.off("users-update");

    // ✅ Now attach fresh listeners
    socket.on("sync-code", (data) => {
      setCode(data.code);
      setLanguage(data.language);
    });

    socket.on("language-update", (lang) => setLanguage(lang));
    socket.on("chat-history", (msgs) => setMessages(msgs));

    socket.on("receive-message", (msg) =>
      setMessages((prev) => [...prev, msg]),
    );

    socket.on("users-update", (usersList) => {
      setUsers(usersList);
    });

    return () => {
      socket.off("sync-code");
      socket.off("language-update");
      socket.off("chat-history");
      socket.off("receive-message");
      socket.off("users-update");
    };
  }, [roomId]);

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("send-message", { roomId, message: input });
    setInput("");
  };

  const styles = {
    page: {
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Inter, sans-serif",
      background: "#0b1120",
      color: "#e2e8f0",
      overflow: "hidden",
    },
    topBar: {
      height: "60px",
      background: "rgba(15, 23, 42, 0.9)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #2b3b54",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      zIndex: 10,
    },
    logo: { fontSize: "22px", fontWeight: "700", color: "#38bdf8" },
    roomInfo: { fontSize: "12px", color: "#94a3b8" },
    topControls: { display: "flex", alignItems: "center", gap: "16px" },
    main: { flex: 1, display: "flex", overflow: "hidden" },
    sidebar: {
      width: "320px",
      background: "#020617",
      borderRight: "1px solid #1e293b",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      padding: "12px",
    },
    chatBox: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      marginTop: "12px",
    },
    messages: {
      flex: 1,
      overflowY: "auto",
      padding: "10px",
      borderRadius: "10px",
      background: "#0f172a",
      fontSize: "13px",
      marginBottom: "8px",
    },
    inputBox: { display: "flex", gap: "6px" },
    input: {
      flex: 1,
      padding: "8px",
      background: "#353d61",
      border: "1px solid #1e293b",
      color: "#fff",
      borderRadius: "20px",
      outline: "none",
    },
    button: {
      padding: "8px 14px",
      background: "#384f40",
      border: "none",
      borderRadius: "6px",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "500",
      transition: "0.2s",
    },
    buttonHover: {
      background: "#16a34a",
    },
    editorSection: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    editorContainer: {
      flex: 1,
      padding: "12px",
      overflow: "hidden",
      borderRadius: "10px",
    },
    consoleContainer: {
      height: "280px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      marginTop: "8px",
    },
    analysisPanel: {
      padding: "10px",
      background: "#020617",
      borderTop: "1px solid #1e293b",
      borderRadius: "8px",
      marginTop: "8px",
    },
  };

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div>
          <div style={styles.logo}>🚀 CodeMeet</div>
          <div style={styles.roomInfo}>Room: {roomId}</div>
        </div>
        <div style={styles.topControls}>
          <Timer />
          <LanguageSelector
            language={language}
            setLanguage={setLanguage}
            roomId={roomId}
          />
        </div>
      </div>

      <div style={styles.main}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <VideoCall roomId={roomId} />

          <div style={{ marginBottom: "10px" }}>
            <h4
              style={{
                fontSize: "14px",
                marginBottom: "6px",
                color: "#38bdf8",
              }}
            >
              👥 Participants
            </h4>

            {users.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                No users yet
              </div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    fontSize: "13px",
                    padding: "4px 6px",
                    borderRadius: "6px",
                    background: "#0f172a",
                    marginBottom: "4px",
                  }}
                >
                  👤 {u.name}
                </div>
              ))
            )}
          </div>

          <div style={styles.chatBox}>
            <div ref={chatRef} style={styles.messages}>
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: "6px" }}>
                  <strong>{msg.user}</strong>: {msg.text}
                </div>
              ))}
            </div>

            <div style={styles.inputBox}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type message..."
                style={styles.input}
              />
              <button onClick={sendMessage} style={styles.button}>
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Editor + Console + Analysis */}
        <div style={styles.editorSection}>
          <div style={styles.editorContainer}>
            <CodeEditor
              code={code}
              setCode={setCode}
              roomId={roomId}
              language={language}
            />
          </div>

          <div style={styles.consoleContainer}>
            <CodeRunner code={code} setOutput={setOutput} language={language} />
            <OutputConsole output={output} />
          </div>

          <div style={styles.analysisPanel}>
            <CodeAnalysisPanel code={code} language={language} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
