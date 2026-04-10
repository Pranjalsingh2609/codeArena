import React, { useRef, useEffect, useCallback, useState } from "react";
import Editor from "@monaco-editor/react";
import { Range } from "monaco-editor";
import { socket } from "../socket";

const CodeEditor = ({ code, setCode, roomId, language }) => {
  const editorRef = useRef(null);
  const isRemote = useRef(false);
  const decorationsRef = useRef({});
  const [cursors, setCursors] = useState({});

  // ✅ Handle local changes
  const handleChange = useCallback(
    (value = "") => {
      if (isRemote.current) {
        isRemote.current = false;
        return;
      }

      setCode(value);

      const cursor = editorRef.current?.getPosition();

      socket.emit("code-change", {
        roomId,
        code: value,
        cursor,
      });
    },
    [roomId, setCode]
  );

  // ✅ Cursor change (throttled)
  const handleCursorChange = useCallback((e) => {
    const now = Date.now();
    if (!handleCursorChange.lastEmit) handleCursorChange.lastEmit = 0;

    if (now - handleCursorChange.lastEmit > 50) {
      handleCursorChange.lastEmit = now;

      socket.emit("cursor-change", {
        roomId,
        cursor: e.position,
      });
    }
  }, [roomId]);

  // ✅ Socket listeners
  useEffect(() => {
    const handleInit = ({ code: initCode, cursors: initCursors }) => {
      if (!editorRef.current) return;

      if (initCode !== editorRef.current.getValue()) {
        isRemote.current = true;
        editorRef.current.setValue(initCode);
        setCode(initCode);
      }

      setCursors(initCursors || {});
    };

    const handleUpdate = ({ code: newCode, cursorId, cursor }) => {
      if (!editorRef.current) return;

      const current = editorRef.current.getValue();

      if (newCode !== current) {
        isRemote.current = true;

        const pos = editorRef.current.getPosition();

        editorRef.current.setValue(newCode);
        setCode(newCode);

        if (pos) editorRef.current.setPosition(pos);
      }

      // ✅ Update cursor safely
      if (
        cursorId &&
        cursor &&
        typeof cursor.lineNumber === "number" &&
        typeof cursor.column === "number" &&
        cursorId !== socket.id
      ) {
        setCursors((prev) => ({
          ...prev,
          [cursorId]: cursor,
        }));
      }
    };

    const handleCursorUpdate = ({ cursorId, cursor }) => {
      if (
        !cursor ||
        cursorId === socket.id ||
        typeof cursor.lineNumber !== "number" ||
        typeof cursor.column !== "number"
      ) return;

      setCursors((prev) => ({
        ...prev,
        [cursorId]: cursor,
      }));
    };

    socket.on("init", handleInit);
    socket.on("code-update", handleUpdate);
    socket.on("cursor-update", handleCursorUpdate);

    return () => {
      socket.off("init", handleInit);
      socket.off("code-update", handleUpdate);
      socket.off("cursor-update", handleCursorUpdate);

      // 🧹 Clean decorations
      if (editorRef.current) {
        Object.values(decorationsRef.current).forEach((dec) => {
          editorRef.current.deltaDecorations(dec, []);
        });
      }
      decorationsRef.current = {};
    };
  }, [roomId, setCode]);

  // ✅ Apply cursor decorations
  useEffect(() => {
    if (!editorRef.current) return;

    Object.entries(cursors).forEach(([id, cursor]) => {
      const oldDec = decorationsRef.current[id] || [];

      const newDec = editorRef.current.deltaDecorations(oldDec, [
        {
          range: new Range(
            cursor.lineNumber,
            cursor.column,
            cursor.lineNumber,
            cursor.column
          ),
          options: {
            className: "remote-cursor",
            afterContentClassName: "remote-cursor-label",
          },
        },
      ]);

      decorationsRef.current[id] = newDec;
    });
  }, [cursors]);

  // ✅ Editor mount
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition(handleCursorChange);

    setTimeout(() => {
      editor.layout();
      editor.focus();
    }, 100);
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