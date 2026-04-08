import React, { useCallback, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { socket } from "../socket";

const CodeEditor = ({ code, setCode, roomId, language = "javascript" }) => {
  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  // 🔹 Local typing
  const handleChange = useCallback((value) => {
    if (!editorRef.current || value === undefined) return;

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const cursor = editorRef.current.getPosition();
    setCode(value);

    // Emit code + cursor
    socket.emit("code-change", { roomId, code: value, cursor });
  }, [roomId, setCode]);

  // 🔹 Listen for remote code updates
  useEffect(() => {
    const handleIncomingCode = ({ code: newCode, cursorId, cursor }) => {
      const editor = editorRef.current;
      if (!editor) return;

      const currentCode = editor.getValue();
      if (newCode === currentCode) return;

      const localCursor = editor.getPosition();
      isRemoteUpdate.current = true;
      editor.setValue(newCode);

      setCode(newCode);

      // Restore local cursor if this update is from another user
      if (localCursor) editor.setPosition(localCursor);

      // Optionally: show remote cursors (requires decorations)
      if (cursorId && cursor) {
        editor.deltaDecorations(
          [],
          [{
            range: new editorRef.current.constructor.Range(
              cursor.lineNumber,
              cursor.column,
              cursor.lineNumber,
              cursor.column
            ),
            options: { className: "remote-cursor" }
          }]
        );
      }
    };

    socket.on("code-update", handleIncomingCode);
    return () => socket.off("code-update", handleIncomingCode);
  }, [setCode]);

  // 🔹 Capture Monaco instance
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setTimeout(() => { editor.layout(); editor.focus(); }, 100);
  };

  // 🔹 Resize
  useEffect(() => {
    const handleResize = () => editorRef.current?.layout();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={styles.container}>
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={editorOptions}
      />
    </div>
  );
};

const styles = {
  container: {
    height: "100%",
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    background: "#1e1e1e",
    border: "1px solid #2d3748",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  },
};

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