import React, { useRef, useEffect, useCallback, useState } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { socket } from "../socket";

const CodeEditor = ({ code, setCode, roomId, language, username }) => {
  const editorRef = useRef(null);
  const isRemote = useRef(false);
  const decorationsRef = useRef({});
  const [cursors, setCursors] = useState({}); // Other users cursors

  // Handle local code changes (debounced)
  const handleChange = useCallback(
    (value) => {
      if (isRemote.current) {
        isRemote.current = false;
        return;
      }
      setCode(value);
      const cursor = editorRef.current.getPosition();
      socket.emit("code-change", { roomId, code: value, cursor });
    },
    [roomId, setCode]
  );

  // Handle cursor updates
  const handleCursorChange = useCallback(
    (e) => {
      socket.emit("cursor-change", { roomId, cursor: e.position });
    },
    [roomId]
  );

  // Initialize editor & socket listeners
  useEffect(() => {
    // INIT code and cursors
    socket.on("init", ({ code: initCode, cursors: initCursors }) => {
      if (editorRef.current) {
        isRemote.current = true;
        editorRef.current.setValue(initCode);
        setCode(initCode);
        setCursors(initCursors || {});
      }
    });

    // CODE UPDATE
    socket.on("code-update", ({ code: newCode, cursorId, cursor }) => {
      if (!editorRef.current) return;

      const current = editorRef.current.getValue();
      if (current !== newCode) {
        isRemote.current = true;
        const pos = editorRef.current.getPosition();
        editorRef.current.setValue(newCode);
        setCode(newCode);
        editorRef.current.setPosition(pos);
      }

      if (cursorId && cursor && cursorId !== socket.id) {
        setCursors((prev) => ({ ...prev, [cursorId]: cursor }));
      }
    });

    // CURSOR UPDATE
    socket.on("cursor-update", ({ cursorId, cursor }) => {
      if (!cursor || cursorId === socket.id) return;
      setCursors((prev) => ({ ...prev, [cursorId]: cursor }));
    });

    return () => {
      socket.off("init");
      socket.off("code-update");
      socket.off("cursor-update");
    };
  }, [setCode]);

  // Update decorations for other users
  useEffect(() => {
    if (!editorRef.current) return;

    for (const [id, cursor] of Object.entries(cursors)) {
      decorationsRef.current[id] = editorRef.current.deltaDecorations(
        decorationsRef.current[id] || [],
        [
          {
            range: new monaco.Range(cursor.lineNumber, cursor.column, cursor.lineNumber, cursor.column),
            options: {
              className: "remote-cursor",
              afterContentClassName: "remote-cursor-label",
            },
          },
        ]
      );
    }
  }, [cursors]);

  // Editor mount
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition(handleCursorChange);
    editor.layout();
    editor.focus();
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
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
          minimap: { enabled: false },
          wordWrap: "on",
          tabSize: 2,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          cursorBlinking: "blink",
        }}
      />
    </div>
  );
};

export default React.memo(CodeEditor);