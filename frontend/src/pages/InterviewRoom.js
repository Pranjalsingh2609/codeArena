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
  const [username] = useState("User-" + Math.floor(Math.random() * 1000));

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);

  const chatRef = useRef(null);

  useEffect(() => {
    // Join room
    socket.emit("join-room", { roomId, username });

    // Clear old listeners
    const events = [
      "init",
      "language-update",
      "receive-message",
      "users-update",
      "code-update",
      "cursor-update",
      "user-joined",
    ];
    events.forEach((e) => socket.off(e));

    // INIT
    socket.on("init", (data) => {
      setCode(data.code || "");
      setLanguage(data.language || "javascript");
      setUsers(data.users || []);
      setMessages(data.messages || []);
    });

    // LANGUAGE UPDATE
    socket.on("language-update", setLanguage);

    // CODE UPDATE
    socket.on("code-update", ({ code: newCode }) => {
      setCode((prev) => (prev !== newCode ? newCode : prev));
    });

    // CURSOR UPDATE (for CodeEditor)
    socket.on("cursor-update", ({ cursorId, cursor }) => {
      // Optional: pass to CodeEditor via prop or event bus
    });

    // CHAT
    socket.on("receive-message", (msg) =>
      setMessages((prev) => [...prev, msg]),
    );

    // USERS UPDATE
    socket.on("users-update", (data) => {
      setUsers(data || []);
    });

    // USER JOINED
    socket.on("user-joined", (user) => {
      setUsers((prev) =>
        prev.find((u) => u.id === user.id) ? prev : [...prev, user],
      );
    });

    return () => events.forEach((e) => socket.off(e));
  }, [roomId, username]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Send chat
  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("send-message", { roomId, text: input });
    setInput("");
  };

  return (
    <div style={styles.app}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div>
          <div
            style={{ fontSize: "22px", fontWeight: "700", color: "#38bdf8" }}
          >
            🚀 CoderMeet
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
            Room: {roomId}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Timer />
          <LanguageSelector
            language={language}
            setLanguage={setLanguage}
            roomId={roomId}
          />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <VideoCall roomId={roomId} username={username} users={users} />

          {/* Participants */}
          <div style={{ marginBottom: "10px" }}>
            <h4 style={{ color: "#38bdf8" }}>👥 Participants</h4>

           {(users || []).length === 0 ? (
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                No users yet
              </div>
            ) : (
              (users || []).map((u) => (
                <div key={u.id} style={{ padding: "4px" }}>
                  👤 {u.name}
                </div>
              ))
            )}
          </div>

          {/* Chat */}
          <div style={styles.main}>
            <div
              ref={chatRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px",
                borderRadius: "10px",
                background: "#0f172a",
                fontSize: "13px",
                marginBottom: "8px",
              }}
            >
              {(messages || []).map((msg, i) => (
                <div key={i}>
                  <strong>{msg.user}</strong>: {msg.text}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type message..."
                style={{
                  flex: 1,
                  padding: "8px",
                  background: "#353d61",
                  border: "1px solid #1e293b",
                  color: "#fff",
                  borderRadius: "20px",
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: "8px 14px",
                  background: "#384f40",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Editor + Console */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: "12px",
          }}
        >
          <div style={{ flex: 1, borderRadius: "10px", overflow: "hidden" }}>
            <CodeEditor
              code={code}
              setCode={setCode}
              roomId={roomId}
              language={language}
              username={username}
            />
          </div>

          <div
            style={{
              height: "280px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <CodeRunner code={code} setOutput={setOutput} language={language} />
            <OutputConsole output={output} />
          </div>

          <div
            style={{
              padding: "10px",
              background: "#020617",
              borderTop: "1px solid #1e293b",
              borderRadius: "8px",
              marginTop: "8px",
            }}
          >
            <CodeAnalysisPanel code={code} language={language} />
          </div>
        </div>
      </div>
    </div>
  );
};


const styles = {
  app: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background:
      "radial-gradient(circle at top left, #172554 0%, #0f172a 35%, #020617 100%)",
    color: "#e2e8f0",
    fontFamily:
      "'Inter', 'Segoe UI', 'Poppins', 'Helvetica Neue', sans-serif",
  },

  topBar: {
    height: "76px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 22px",
    borderBottom: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(2, 6, 23, 0.72)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    zIndex: 10,
  },

  brandWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  brand: {
    fontSize: "28px",
    fontWeight: 800,
    letterSpacing: "0.4px",
    background: "linear-gradient(90deg, #60a5fa, #22d3ee, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  roomText: {
    fontSize: "12px",
    color: "#94a3b8",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "520px",
  },

  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  topControl: {
    background: "rgba(15, 23, 42, 0.82)",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: "14px",
    padding: "10px 14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
  },

  body: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    padding: "14px",
    gap: "14px",
  },

  sidebar: {
    width: "340px",
    minWidth: "340px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    background: "rgba(2, 6, 23, 0.62)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "22px",
    padding: "14px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    overflow: "hidden",
  },

  card: {
    background: "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.95))",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: "22px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.24)",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(148,163,184,0.10)",
  },

  sectionTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#f8fafc",
    letterSpacing: "0.2px",
  },

  sectionSub: {
    fontSize: "12px",
    color: "#94a3b8",
  },

  videoCard: {
    overflow: "hidden",
  },

  participantsCard: {
    padding: "14px",
  },

  participantList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "10px",
    maxHeight: "150px",
    overflowY: "auto",
  },

  participantItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "14px",
    background: "rgba(30, 41, 59, 0.65)",
    border: "1px solid rgba(148,163,184,0.10)",
  },

  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "13px",
    flexShrink: 0,
  },

  participantName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#e2e8f0",
  },

  participantTag: {
    fontSize: "11px",
    color: "#94a3b8",
  },

  chatCard: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  chatMessages: {
    flex: 1,
    overflowY: "auto",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minHeight: 0,
  },

  emptyState: {
    fontSize: "13px",
    color: "#64748b",
    padding: "14px",
    borderRadius: "14px",
    background: "rgba(15, 23, 42, 0.5)",
    border: "1px dashed rgba(148,163,184,0.16)",
    textAlign: "center",
  },

  messageBubble: {
    padding: "10px 12px",
    borderRadius: "14px",
    background: "rgba(30, 41, 59, 0.72)",
    border: "1px solid rgba(148,163,184,0.10)",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },

  messageUser: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#7dd3fc",
    marginBottom: "4px",
  },

  messageText: {
    fontSize: "13px",
    color: "#e2e8f0",
  },

  chatInputWrap: {
    display: "flex",
    gap: "10px",
    padding: "14px",
    borderTop: "1px solid rgba(148,163,184,0.10)",
  },

  input: {
    flex: 1,
    padding: "12px 14px",
    background: "rgba(15, 23, 42, 0.9)",
    border: "1px solid rgba(148,163,184,0.14)",
    color: "#fff",
    borderRadius: "14px",
    outline: "none",
    fontSize: "14px",
  },

  button: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(59,130,246,0.28)",
  },

  editorCard: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },

  editorHeaderBadge: {
    fontSize: "12px",
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(34,211,238,0.12)",
    color: "#67e8f9",
    border: "1px solid rgba(34,211,238,0.18)",
  },

  editorWrap: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    borderRadius: "0 0 22px 22px",
  },

  lowerGrid: {
    height: "350px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },

  panelBody: {
    padding: "12px",
    height: "calc(100% - 56px)",
    overflow: "hidden",
  },

  analysisCard: {
    minHeight: "180px",
    overflow: "hidden",
  },
};

export default InterviewRoom;
