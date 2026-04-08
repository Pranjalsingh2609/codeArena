import React, { useCallback, useRef, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { socket } from "../socket";
import * as monaco from "monaco-editor";

const CodeEditor = ({ roomId, username, language = "javascript" }) => {
  const [code, setCode] = useState("");
  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const decorationsRef = useRef({});
  const debounceTimer = useRef(null);

  // Debounced code emit
  const handleChange = useCallback((value) => {
    if (!editorRef.current || value === undefined) return;
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    setCode(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const cursor = editorRef.current.getPosition();
      socket.emit("code-change", { roomId, code: value, cursor });
    }, 50); // 50ms debounce
  }, [roomId]);

  useEffect(() => {
    socket.emit("join-room", { roomId, username });

    const handleInit = ({ code: initCode, cursors }) => {
      if (!editorRef.current) return;
      isRemoteUpdate.current = true;
      editorRef.current.setValue(initCode);
      setCode(initCode);

      for (const [id, cursor] of Object.entries(cursors || {})) {
        if (!cursor) continue;
        decorationsRef.current[id] = editorRef.current.deltaDecorations(
          decorationsRef.current[id] || [],
          [{
            range: new monaco.Range(cursor.lineNumber, cursor.column, cursor.lineNumber, cursor.column),
            options: { className: "remote-cursor" }
          }]
        );
      }
    };

    const handleUpdate = ({ code: newCode, cursorId, cursor }) => {
      if (!editorRef.current) return;
      const localCursor = editorRef.current.getPosition();

      if (newCode !== editorRef.current.getValue()) {
        isRemoteUpdate.current = true;
        editorRef.current.setValue(newCode);
        setCode(newCode);
        editorRef.current.setPosition(localCursor);
      }

      if (cursorId && cursor) {
        decorationsRef.current[cursorId] = editorRef.current.deltaDecorations(
          decorationsRef.current[cursorId] || [],
          [{
            range: new monaco.Range(cursor.lineNumber, cursor.column, cursor.lineNumber, cursor.column),
            options: { className: "remote-cursor" }
          }]
        );
      }
    };

    socket.on("init", handleInit);
    socket.on("code-update", handleUpdate);

    return () => {
      socket.off("init", handleInit);
      socket.off("code-update", handleUpdate);
    };
  }, [roomId, username]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setTimeout(() => { editor.layout(); editor.focus(); }, 100);
    editor.onDidChangeCursorPosition(e => socket.emit("cursor-change", { roomId, cursor: e.position }));
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
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
        }}
      />
    </div>
  );
};

export default React.memo(CodeEditor);