import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import CodeEditor from "../components/CodeEditor";
import LanguageSelector from "../components/LanguageSelector";
import OutputConsole from "../components/OutputConsole";
import VideoCall from "../components/VideoCall";
import Timer from "../components/Timer";
import CodeAnalysisPanel from "../components/CodeAnalysisPanel";

import { socket } from "../socket";

const InterviewRoom = () => {
  const { roomId } = useParams();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("sync-code", (data) => {
      setCode(data.code);
      setLanguage(data.language);
    });

    socket.on("code-update", (newCode) => setCode(newCode));
    socket.on("language-update", (lang) => setLanguage(lang));

    return () => {
      socket.off("sync-code");
      socket.off("code-update");
      socket.off("language-update");
    };
  }, [roomId]);

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
      width: "280px",
      background: "#0f172a",
      borderRight: "1px solid #1e293b",
      padding: "10px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    editorSection: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      height: "100%", // stable height for editor + console
    },
    editorContainer: {
      flex: 1,
      height: "100%", // full height of editorSection
      padding: "10px",
      boxSizing: "border-box", // include padding in height calculation
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
            <OutputConsole />
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
