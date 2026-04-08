import React, { useCallback, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { socket } from "../socket";

const CodeEditor = ({ code, setCode, roomId, language = "javascript" }) => {
  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  // 🚀 Handle local typing (INSTANT EMIT)
  const handleChange = useCallback(
    (value) => {
      if (value === undefined) return;

      // جلوگیری infinite loop
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
      }

      // update local state
      setCode(value);

      // ⚡ instant emit (no debounce)
      socket.emit("code-change", {
        roomId,
        code: value,
      });
    },
    [roomId, setCode],
  );

  // 📡 Listen for remote updates (REAL-TIME)
  useEffect(() => {
    const handleIncomingCode = ({ code: newCode }) => {
      const editor = editorRef.current;
      if (!editor) return;

      const currentCode = editor.getValue();
      if (newCode === currentCode) return;

      // save cursor position
      const cursorPosition = editor.getPosition();

      // mark as remote change
      isRemoteUpdate.current = true;

      // 🔥 direct change (no React delay)
      editor.setValue(newCode);

      setCode(newCode);

      // restore cursor
      if (cursorPosition) {
        editor.setPosition(cursorPosition);
      }
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
    };
  }, []);

  return (
    <div style={styles.container}>
      <Editor
        height="100%"
        width="100%"
        language={language}
        defaultValue={code || ""}
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
    height: "100%",
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
