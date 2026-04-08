import React, { useCallback, useRef, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { socket } from "../socket";

const CodeEditor = ({ roomId, language = "javascript" }) => {
  const [code, setCode] = useState("");          // Local state
  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const decorationsRef = useRef({});             // Track remote cursors

  // 🔹 Local typing
  const handleChange = useCallback(
    (value) => {
      if (!editorRef.current || value === undefined) return;

      // Ignore remote updates
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
      }

      setCode(value);

      const cursor = editorRef.current.getPosition();
      socket.emit("code-change", { roomId, code: value, cursor });
    },
    [roomId]
  );

  // 🔹 Initial code load on join
  useEffect(() => {
    const handleInit = ({ code: initCode, cursors }) => {
      if (!editorRef.current) return;

      isRemoteUpdate.current = true;
      editorRef.current.setValue(initCode);
      setCode(initCode);

      // Render existing cursors
      for (const [id, cursor] of Object.entries(cursors || {})) {
        if (!cursor) continue;
        decorationsRef.current[id] = editorRef.current.deltaDecorations(
          decorationsRef.current[id] || [],
          [
            {
              range: new editorRef.current.constructor.Range(
                cursor.lineNumber,
                cursor.column,
                cursor.lineNumber,
                cursor.column
              ),
              options: { className: "remote-cursor" },
            },
          ]
        );
      }
    };

    socket.on("init", handleInit);
    return () => socket.off("init", handleInit);
  }, []);

  // 🔹 Listen for remote code updates
  useEffect(() => {
    const handleIncomingCode = ({ code: newCode, cursorId, cursor }) => {
      if (!editorRef.current) return;

      const currentCode = editorRef.current.getValue();
      if (newCode === currentCode) return;

      const localCursor = editorRef.current.getPosition();
      isRemoteUpdate.current = true;
      editorRef.current.setValue(newCode);
      setCode(newCode);

      // Restore local cursor
      if (localCursor) editorRef.current.setPosition(localCursor);

      // Show remote cursor
      if (cursorId && cursor) {
        decorationsRef.current[cursorId] = editorRef.current.deltaDecorations(
          decorationsRef.current[cursorId] || [],
          [
            {
              range: new editorRef.current.constructor.Range(
                cursor.lineNumber,
                cursor.column,
                cursor.lineNumber,
                cursor.column
              ),
              options: { className: "remote-cursor" },
            },
          ]
        );
      }
    };

    socket.on("code-update", handleIncomingCode);
    return () => socket.off("code-update", handleIncomingCode);
  }, []);

  // 🔹 Capture Monaco instance
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setTimeout(() => {
      editor.layout();
      editor.focus();
    }, 100);

    // 🔹 Track cursor movements separately
    editor.onDidChangeCursorPosition((e) => {
      const cursor = e.position;
      socket.emit("cursor-change", { roomId, cursor });
    });
  };

  // 🔹 Resize handling
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