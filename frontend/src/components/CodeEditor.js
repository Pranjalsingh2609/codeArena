import React, { useCallback, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { socket } from "../socket";

const CodeEditor = ({ code, setCode, roomId, language = "javascript" }) => {
  const editorRef = useRef(null);
  const debounceRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  // 🚀 Handle code changes (debounced + safe)
  const handleChange = useCallback(
    (value) => {
      if (value === undefined) return;

      // prevent loop when update comes from socket
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
      }

      setCode(value);

      // debounce emit
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        socket.emit("code-update", {
          roomId,
          code: value,
        });
      }, 300);
    },
    [roomId, setCode]
  );

  // 📡 Listen for incoming code updates
  useEffect(() => {
    const handleIncomingCode = ({ code: newCode }) => {
      isRemoteUpdate.current = true;
      setCode(newCode);
    };

    socket.on("code-update", handleIncomingCode);

    return () => {
      socket.off("code-update", handleIncomingCode);
    };
  }, [setCode]);

  // 📌 Capture Monaco instance
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    setTimeout(() => {
      editor.layout();
      editor.focus();
    }, 100);
  };

  // 📐 Resize handling
  useEffect(() => {
    const handleResize = () => {
      editorRef.current?.layout();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={code || ""}
        theme="vs-dark"
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={editorOptions}
      />
    </div>
  );
};

// 🎨 Styles
const styles = {
  container: {
    height: "100%", // ✅ FIXED (important for layout)
    width: "100%",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#1e1e1e",
    border: "1px solid #2d3748",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  },
};

// ⚙️ Editor options
const editorOptions = {
  fontSize: 16,
  fontFamily: "Fira Code, monospace",
  minimap: { enabled: false },
  wordWrap: "on",
  tabSize: 2,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  cursorBlinking: "blink",
  cursorStyle: "line",
  cursorWidth: 2,
  smoothScrolling: true,
  padding: { top: 10 },
  lineHeight: 22,
};

export default React.memo(CodeEditor);