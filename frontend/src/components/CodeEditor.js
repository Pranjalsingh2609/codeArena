import React, { useRef, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { socket } from "../socket";
import { Range } from "monaco-editor";

const CodeEditor = ({ roomId, username, language = "javascript" }) => {
  const [code, setCode] = useState("");
  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const decorationsRef = useRef({});

  const handleChange = (value = "") => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    setCode(value);

    const cursor = editorRef.current?.getPosition();

    socket.emit("code-change", {
      roomId,
      code: value,
      cursor,
    });
  };

  useEffect(() => {
    const handleInit = ({ code: initCode, cursors }) => {
      if (!editorRef.current) return;
      isRemoteUpdate.current = true;
      editorRef.current.setValue(initCode);
      setCode(initCode);

      for (const [id, cursor] of Object.entries(cursors || {})) {
        if (!cursor) continue;
        decorationsRef.current[id] = editorRef.current.deltaDecorations(
          decorationsRef.current[id] || [],
          [
            {
              range: new Range(
                cursor.lineNumber,
                cursor.column,
                cursor.lineNumber,
                cursor.column,
              ),
              options: { className: "remote-cursor" },
            },
          ],
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

      if (
        cursorId &&
        cursor &&
        typeof cursor.lineNumber === "number" &&
        typeof cursor.column === "number"
      ) {
        const oldDecorations = decorationsRef.current[cursorId] || [];

        const newDecorations = editorRef.current.deltaDecorations(
          oldDecorations,
          [
            {
              range: new Range(
                cursor.lineNumber,
                cursor.column,
                cursor.lineNumber,
                cursor.column,
              ),
              options: { className: "remote-cursor" },
            },
          ],
        );

        decorationsRef.current[cursorId] = newDecorations;
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
    let lastEmit = 0;
    editorRef.current = editor;
    setTimeout(() => {
      editor.layout();
      editor.focus();
    }, 100);

    editor.onDidChangeCursorPosition((e) => {
      const now = Date.now();

      if (now - lastEmit > 50) {
        lastEmit = now;
        socket.emit("cursor-change", {
          roomId,
          cursor: e.position,
        });
      }
    });
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
