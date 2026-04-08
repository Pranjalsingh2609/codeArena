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
    const events = ["init", "language-update", "receive-message", "users-update", "code-update", "cursor-update", "user-joined"];
    events.forEach((e) => socket.off(e));

    // INIT
    socket.on("init", (data) => {
      setCode(data.code);
      setLanguage(data.language);
      setUsers(data.users);
      setMessages(data.messages);
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
    socket.on("receive-message", (msg) => setMessages((prev) => [...prev, msg]));

    // USERS UPDATE
    socket.on("users-update", setUsers);

    // USER JOINED
    socket.on("user-joined", (user) => {
      setUsers((prev) => (prev.find((u) => u.id === user.id) ? prev : [...prev, user]));
    });

    return () => events.forEach((e) => socket.off(e));
  }, [roomId, username]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Send chat
  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("send-message", { roomId, text: input });
    setInput("");
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0b1120", color: "#e2e8f0" }}>
      {/* Top Bar */}
      <div style={{ height: "60px", background: "rgba(15,23,42,0.9)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", borderBottom: "1px solid #2b3b54" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#38bdf8" }}>🚀 CodeMeet</div>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>Room: {roomId}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Timer />
          <LanguageSelector language={language} setLanguage={setLanguage} roomId={roomId} />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: "320px", background: "#020617", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", padding: "12px" }}>
          <VideoCall roomId={roomId} username={username} users={users} />

          {/* Participants */}
          <div style={{ marginBottom: "10px" }}>
            <h4 style={{ color: "#38bdf8" }}>👥 Participants</h4>
            {users.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#64748b" }}>No users yet</div>
            ) : (
              users.map((u) => <div key={u.id} style={{ padding: "4px" }}>👤 {u.name}</div>)
            )}
          </div>

          {/* Chat */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", marginTop: "12px" }}>
            <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "10px", borderRadius: "10px", background: "#0f172a", fontSize: "13px", marginBottom: "8px" }}>
              {messages.map((msg, i) => (
                <div key={i}><strong>{msg.user}</strong>: {msg.text}</div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type message..."
                style={{ flex: 1, padding: "8px", background: "#353d61", border: "1px solid #1e293b", color: "#fff", borderRadius: "20px" }}
              />
              <button onClick={sendMessage} style={{ padding: "8px 14px", background: "#384f40", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" }}>Send</button>
            </div>
          </div>
        </div>

        {/* Editor + Console */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "12px" }}>
          <div style={{ flex: 1, borderRadius: "10px", overflow: "hidden" }}>
            <CodeEditor code={code} setCode={setCode} roomId={roomId} language={language} username={username} />
          </div>

          <div style={{ height: "280px", display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            <CodeRunner code={code} setOutput={setOutput} language={language} />
            <OutputConsole output={output} />
          </div>

          <div style={{ padding: "10px", background: "#020617", borderTop: "1px solid #1e293b", borderRadius: "8px", marginTop: "8px" }}>
            <CodeAnalysisPanel code={code} language={language} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;