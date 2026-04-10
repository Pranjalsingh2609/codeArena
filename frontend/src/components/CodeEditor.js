import React, { useRef, useEffect, useCallback, useState } from "react";
import Editor from "@monaco-editor/react";
import { Range } from "monaco-editor";
import { socket } from "../socket";

const CodeEditor = ({ code, setCode, roomId, language }) => {
  const editorRef = useRef(null);
  const isRemote = useRef(false);
  const decorationsRef = useRef({});
  const [cursors, setCursors] = useState({});
  const [users, setUsers] = useState([]);

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
    [roomId, setCode],
  );

  // ✅ Cursor change (throttled)
  const handleCursorChange = useCallback(
    (e) => {
      const now = Date.now();
      if (!handleCursorChange.lastEmit) handleCursorChange.lastEmit = 0;

      if (now - handleCursorChange.lastEmit > 50) {
        handleCursorChange.lastEmit = now;

        socket.emit("cursor-change", {
          roomId,
          cursor: e.position,
        });
      }
    },
    [roomId],
  );

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
      )
        return;

      setCursors((prev) => ({
        ...prev,
        [cursorId]: cursor,
      }));
    };

    const handleUsersUpdate = (usersList) => {
      setUsers(usersList);
    };

    socket.on("users-update", handleUsersUpdate);
    socket.on("init", handleInit);
    socket.on("code-update", handleUpdate);
    socket.on("cursor-update", handleCursorUpdate);

    return () => {
      socket.off("init", handleInit);
      socket.off("code-update", handleUpdate);
      socket.off("cursor-update", handleCursorUpdate);
      socket.off("users-update", handleUsersUpdate);

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
            cursor.column,
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
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.title}>🚀 CodeArena</div>

        <div style={styles.users}>
          {users.map((u) => (
            <div key={u.id} style={styles.badge}>
              <div style={styles.avatar}>{u.name?.charAt(0).toUpperCase()}</div>
              {u.name}
              <div style={styles.onlineDot}></div>
            </div>
          ))}
        </div>
      </div>

      {/* EDITOR */}
      <div style={styles.editorWrapper}>
        <Editor
          height="100%"
          width="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 15,
            minimap: { enabled: false },
            wordWrap: "on",
            tabSize: 2,
            automaticLayout: true,
            smoothScrolling: true,
          }}
        />
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        {language.toUpperCase()} • Live Collaboration ⚡
      </div>
    </div>
  );
};
const styles = {
  container: {
    height: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg, #0d1117, #0b0f14)",
  },

  header: {
    height: "55px",
    backdropFilter: "blur(10px)",
    background: "rgba(22, 27, 34, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    color: "#e6edf3",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
  },

  title: {
    fontSize: "17px",
    fontWeight: "600",
    letterSpacing: "0.5px",
  },

  users: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  badge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#fff",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    boxShadow: "0 0 8px rgba(34,197,94,0.6)",
    transition: "all 0.2s ease",
  },

  avatar: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#0d1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
    color: "#22c55e",
  },

  onlineDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 6px #22c55e",
  },

  editorWrapper: {
    flex: 1,
  },

  footer: {
    height: "32px",
    background: "rgba(22, 27, 34, 0.9)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    fontSize: "12px",
    color: "#8b949e",
  },
};
export default React.memo(CodeEditor);
