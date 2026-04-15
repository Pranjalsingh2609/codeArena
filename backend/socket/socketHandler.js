const { runStaticAnalysis } = require("../utils/staticAnalysis");

const rooms = {};
const aiCache = new Map();

const MAX_USERS_PER_ROOM = 10;
const MAX_VIDEO_USERS_PER_ROOM = 4;
const MAX_CODE_SIZE = 200000;
const CURSOR_THROTTLE_MS = 80;
const AI_CACHE_LIMIT = 200;

const lastCursorEmit = new Map();

function getRoom(roomId) {
  return rooms[roomId];
}

function ensureRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      code: "",
      language: "javascript",
      users: [],
      cursors: {},
      videoUsers: new Set(),
      messages: [],
    };
  }
  return rooms[roomId];
}

function removeUserFromRoom(roomId, socketId) {
  const room = rooms[roomId];
  if (!room) return;

  room.users = room.users.filter((u) => u.id !== socketId);
  delete room.cursors[socketId];
  room.videoUsers.delete(socketId);

  if (room.users.length === 0) {
    delete rooms[roomId];
  }
}

function safeCacheSet(key, value) {
  if (aiCache.size >= AI_CACHE_LIMIT) {
    const firstKey = aiCache.keys().next().value;
    if (firstKey) aiCache.delete(firstKey);
  }
  aiCache.set(key, value);
}

module.exports = (io, socket) => {
<<<<<<< HEAD
  // ================= JOIN ROOM =================
=======
>>>>>>> 3e7065d (🚀 Optimized socketHandler for scalability and performance)
  socket.on("join-room", ({ roomId, username }) => {
    if (!roomId || typeof roomId !== "string") return;

    const cleanUsername =
      typeof username === "string" && username.trim()
        ? username.trim().slice(0, 30)
        : "Guest";

    const room = ensureRoom(roomId);

    const alreadyJoined = room.users.some((u) => u.id === socket.id);
    if (!alreadyJoined && room.users.length >= MAX_USERS_PER_ROOM) {
      socket.emit("room-error", {
        message: `Room full. Max ${MAX_USERS_PER_ROOM} users allowed.`,
      });
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;

    if (!alreadyJoined) {
      room.users.push({ id: socket.id, name: cleanUsername });
    }

    socket.emit("init", {
      code: room.code,
      language: room.language,
      users: room.users,
      cursors: room.cursors,
<<<<<<< HEAD
      messages: room.messages || [],
=======
      messages: room.messages,
>>>>>>> 3e7065d (🚀 Optimized socketHandler for scalability and performance)
    });

    socket.to(roomId).emit("user-joined", {
      id: socket.id,
      name: cleanUsername,
    });

    io.to(roomId).emit("users-update", room.users);
  });

  socket.on("code-change", ({ roomId, code, cursor }) => {
    const room = getRoom(roomId);
    if (!room) return;
    if (typeof code !== "string") return;
    if (code.length > MAX_CODE_SIZE) return;

    room.code = code;

    if (
      cursor &&
      typeof cursor.lineNumber === "number" &&
      typeof cursor.column === "number"
    ) {
      room.cursors[socket.id] = cursor;
    }

    socket.to(roomId).emit("code-update", {
      code,
      cursor,
      cursorId: socket.id,
    });

    const cacheKey = `${room.language}::${code}`;
    if (aiCache.has(cacheKey)) {
      io.to(roomId).emit("ai-suggestions", aiCache.get(cacheKey));
      return;
    }

    try {
      const issues = runStaticAnalysis(code, room.language);
      safeCacheSet(cacheKey, issues);
      io.to(roomId).emit("ai-suggestions", issues);
    } catch {
      io.to(roomId).emit("ai-suggestions", []);
    }
  });

  socket.on("cursor-change", ({ roomId, cursor }) => {
    const room = getRoom(roomId);
    if (!room || !cursor) return;

    if (
      typeof cursor.lineNumber !== "number" ||
      typeof cursor.column !== "number"
    ) {
      return;
    }

    const now = Date.now();
    const last = lastCursorEmit.get(socket.id) || 0;

    if (now - last < CURSOR_THROTTLE_MS) {
      return;
    }

    lastCursorEmit.set(socket.id, now);
    room.cursors[socket.id] = cursor;

    socket.to(roomId).emit("cursor-update", {
      cursorId: socket.id,
      cursor,
    });
  });

  socket.on("language-change", ({ roomId, language }) => {
    const room = getRoom(roomId);
    if (!room) return;
    if (typeof language !== "string") return;

    room.language = language;
    socket.to(roomId).emit("language-update", language);
  });

  socket.on("join-video", (roomId) => {
    const room = getRoom(roomId);
    if (!room) return;

    if (!room.videoUsers.has(socket.id)) {
      if (room.videoUsers.size >= MAX_VIDEO_USERS_PER_ROOM) {
        socket.emit("video-room-full", {
          message: `Video room full. Max ${MAX_VIDEO_USERS_PER_ROOM} users allowed.`,
        });
        return;
      }
      room.videoUsers.add(socket.id);
    }

    const allVideoUsers = Array.from(room.videoUsers);
    const otherUsers = allVideoUsers.filter((id) => id !== socket.id);

    socket.emit("all-users", otherUsers);
    socket.to(roomId).emit("user-joined-video", socket.id);
  });

  socket.on("sending-signal", ({ userToSignal, signal }) => {
    if (!userToSignal || !signal) return;
<<<<<<< HEAD
=======

>>>>>>> 3e7065d (🚀 Optimized socketHandler for scalability and performance)
    io.to(userToSignal).emit("receiving-signal", {
      signal,
      from: socket.id,
    });
  });

  socket.on("returning-signal", ({ signal, to }) => {
    if (!to || !signal) return;
<<<<<<< HEAD
=======

>>>>>>> 3e7065d (🚀 Optimized socketHandler for scalability and performance)
    io.to(to).emit("signal-returned", {
      signal,
      from: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;

    lastCursorEmit.delete(socket.id);

    if (!roomId || !rooms[roomId]) return;

    removeUserFromRoom(roomId, socket.id);

    if (rooms[roomId]) {
      socket.to(roomId).emit("user-left", socket.id);
      io.to(roomId).emit("users-update", rooms[roomId].users);
    }
  });
};
