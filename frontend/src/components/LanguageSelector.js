import React, { useCallback } from "react";
import { socket } from "../socket";

const LanguageSelector = ({ language = "javascript", setLanguage, roomId }) => {

  const changeLanguage = useCallback((e) => {
    const lang = e.target.value;

    setLanguage(lang);

    socket.emit("language-change", {
      roomId,
      language: lang,
    });

  }, [roomId, setLanguage]);

  const styles = {
    container: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },

    label: {
      color: "#cbd5f5",
      fontSize: "14px",
      fontWeight: "500"
    },

    select: {
      background: "#1e293b",
      color: "white",
      border: "1px solid #334155",
      padding: "8px 12px",
      borderRadius: "6px",
      outline: "none",
      cursor: "pointer",
      fontSize: "14px"
    }
  };

  return (
    <div style={styles.container}>
      
      <label style={styles.label}>Language</label>

      <select
        value={language}
        onChange={changeLanguage}
        style={styles.select}
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
        <option value="java">Java</option>
      </select>

    </div>
  );
};

export default LanguageSelector;