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

  // 💬 Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    // Join room
    socket.emit("join-room", roomId);

    // Code sync
    socket.on("sync-code", (data) => {
      setCode(data.code);
      setLanguage(data.language);
    });

    socket.on("code-update", (newCode) => setCode(newCode));
    socket.on("language-update", (lang) => setLanguage(lang));

    // 💬 Chat events
    socket.on("chat-history", (msgs) => {
      setMessages(msgs);
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Cleanup (VERY IMPORTANT)
    return () => {
      socket.off("sync-code");
      socket.off("code-update");
      socket.off("language-update");
      socket.off("chat-history");
      socket.off("receive-message");
    };
  }, [roomId]);

  // Auto scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit("send-message", {
      roomId,
      message: input,
    });

    setInput("");
  };

  const styles = {
    page: {
      height: "100vh",
      background: "#020617",
      color: "white",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Inter, sans-serif",
    },
    topBar: {
      height: "60px",
      background: "#0f172a",
      borderBottom: "1px solid #1e293b",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
    },
    logo: { fontSize: "18px", fontWeight: "600" },
    roomInfo: { fontSize: "12px", color: "#94a3b8" },
    topControls: { display: "flex", alignItems: "center", gap: "14px" },
    main: { flex: 1, display: "flex", overflow: "hidden" },
    sidebar: {
      width: "300px",
      background: "#0f172a",
      borderRight: "1px solid #1e293b",
      padding: "10px",
      display: "flex",
      flexDirection: "column",
    },
    chatBox: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      marginTop: "10px",
    },
    messages: {
      flex: 1,
      overflowY: "auto",
      background: "#020617",
      padding: "8px",
      borderRadius: "8px",
      fontSize: "12px",
    },
    inputBox: {
      display: "flex",
      marginTop: "6px",
    },
    input: {
      flex: 1,
      padding: "6px",
      background: "#0f172a",
      border: "1px solid #1e293b",
      color: "white",
      borderRadius: "4px",
    },
    button: {
      marginLeft: "6px",
      padding: "6px 10px",
      cursor: "pointer",
    },
    editorSection: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    editorContainer: {
      flex: 1,
      padding: "10px",
      display: "flex",
      flexDirection: "column",
    },
    consoleContainer: {
      height: "200px",
      borderTop: "1px solid #1e293b",
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

      {/* Main Layout */}
      <div style={styles.main}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <VideoCall roomId={roomId} />

          {/* 💬 Chat */}
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

        {/* Editor + Console */}
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
            <CodeRunner code={code} setOutput={setOutput} />
            <OutputConsole output={output} />
          </div>

          <div style={{ marginTop: "10px" }}>
            <CodeAnalysisPanel code={code} language={language} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
