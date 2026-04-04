import React, { useCallback, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { socket } from "../socket";

const CodeEditor = ({ code, setCode, roomId, language = "javascript" }) => {
  const containerRef = useRef();
  const editorRef = useRef();

  // 🔥 NEW: debounce + last sent tracking
  const debounceRef = useRef(null);
  const lastSentCode = useRef("");

  // 🚀 Handle code changes (MERGED + OPTIMIZED)
  const handleChange = useCallback(
    (value) => {
      if (value === undefined) return;

      setCode(value);

      // ❌ Prevent sending same code repeatedly
      if (value === lastSentCode.current) return;

      // 🧠 Debounce to avoid API spam
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        socket.emit("code-change", {
          roomId,
          code: value,
        });

        lastSentCode.current = value;
      }, 400); // ⚡ optimized delay
    },
    [roomId, setCode]
  );

  // 📌 Capture Monaco editor instance
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    // Initial layout fix
    setTimeout(() => {
      if (editorRef.current) editorRef.current.layout();
    }, 100);
  };

  // 📐 Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) editorRef.current.layout();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      // 🧹 cleanup debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        minHeight: "400px",
        width: "100%",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#1e1e1e",
        border: "1px solid #2d3748",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={code || ""}
        theme="vs-dark"
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 16,
          fontFamily: "Fira Code, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          automaticLayout: false, // manual control
          cursorBlinking: "smooth",
          smoothScrolling: true,
        }}
      />
    </div>
  );
};

export default React.memo(CodeEditor);