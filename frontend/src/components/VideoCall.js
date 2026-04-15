import React, { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import { socket } from "../socket";

const MAX_VIDEO_USERS = 4;

const VideoCall = ({ roomId, username }) => {
  const myVideo = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());

  const [peers, setPeers] = useState([]);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [videoJoined, setVideoJoined] = useState(false);

  const addPeerToState = useCallback((id, stream) => {
    setPeers((prev) => {
      const exists = prev.some((p) => p.id === id);
      if (exists) {
        return prev.map((p) => (p.id === id ? { ...p, stream } : p));
      }
      return [...prev, { id, stream }];
    });
  }, []);

  const removePeerFromState = useCallback((id) => {
    setPeers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const destroyPeer = useCallback(
    (peerId) => {
      const existing = peersRef.current.get(peerId);
      if (existing) {
        try {
          existing.destroy();
        } catch {}
        peersRef.current.delete(peerId);
      }
      removePeerFromState(peerId);
    },
    [removePeerFromState],
  );

  const createPeer = useCallback(
    (userToSignal, stream) => {
      if (peersRef.current.has(userToSignal)) {
        return peersRef.current.get(userToSignal);
      }

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on("signal", (signal) => {
        socket.emit("sending-signal", { userToSignal, signal });
      });

      peer.on("stream", (remoteStream) => {
        addPeerToState(userToSignal, remoteStream);
      });

      peer.on("close", () => {
        destroyPeer(userToSignal);
      });

      peer.on("error", () => {
        destroyPeer(userToSignal);
      });

      peersRef.current.set(userToSignal, peer);
      return peer;
    },
    [addPeerToState, destroyPeer],
  );

  const addPeer = useCallback(
    (incomingId, stream) => {
      if (peersRef.current.has(incomingId)) {
        return peersRef.current.get(incomingId);
      }

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
      });

      peer.on("signal", (signal) => {
        socket.emit("returning-signal", { signal, to: incomingId });
      });

      peer.on("stream", (remoteStream) => {
        addPeerToState(incomingId, remoteStream);
      });

      peer.on("close", () => {
        destroyPeer(incomingId);
      });

      peer.on("error", () => {
        destroyPeer(incomingId);
      });

      peersRef.current.set(incomingId, peer);
      return peer;
    },
    [addPeerToState, destroyPeer],
  );

  useEffect(() => {
    let isMounted = true;
    const currentPeers = peersRef.current;
    const currentVideo = myVideo.current;

    const handleAllUsers = (users) => {
      if (!localStreamRef.current) return;

      if (users.length >= MAX_VIDEO_USERS) {
        setError(`Video room full. Max ${MAX_VIDEO_USERS} users allowed.`);
        return;
      }

      users.forEach((userId) => {
        if (!currentPeers.has(userId)) {
          createPeer(userId, localStreamRef.current);
        }
      });
    };

    const handleUserJoinedVideo = (userId) => {
      if (!localStreamRef.current) return;

      const totalUsers = currentPeers.size + 1;
      if (totalUsers >= MAX_VIDEO_USERS) return;

      if (!currentPeers.has(userId)) {
        addPeer(userId, localStreamRef.current);
      }
    };

    const handleReceivingSignal = ({ signal, from }) => {
      const peer = currentPeers.get(from);
      if (peer) {
        peer.signal(signal);
      }
    };

    const handleSignalReturned = ({ signal, from }) => {
      const peer = currentPeers.get(from);
      if (peer) {
        peer.signal(signal);
      }
    };

    const handleUserLeft = (userId) => {
      destroyPeer(userId);
    };

    const start = async () => {
      try {
        setError("");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;

        if (currentVideo) {
          currentVideo.srcObject = stream;
        }

        socket.on("all-users", handleAllUsers);
        socket.on("user-joined-video", handleUserJoinedVideo);
        socket.on("receiving-signal", handleReceivingSignal);
        socket.on("signal-returned", handleSignalReturned);
        socket.on("user-left", handleUserLeft);

        socket.emit("join-video", roomId);
        setVideoJoined(true);
      } catch (err) {
        setError("Camera/Microphone permission denied ❌");
      }
    };

    start();

    return () => {
      isMounted = false;

      socket.off("all-users", handleAllUsers);
      socket.off("user-joined-video", handleUserJoinedVideo);
      socket.off("receiving-signal", handleReceivingSignal);
      socket.off("signal-returned", handleSignalReturned);
      socket.off("user-left", handleUserLeft);

      currentPeers.forEach((peer) => {
        try {
          peer.destroy();
        } catch {}
      });
      currentPeers.clear();

      setPeers([]);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (currentVideo) {
        currentVideo.srcObject = null;
      }
    };
  }, [roomId, createPeer, addPeer, destroyPeer]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    const nextMuted = !muted;
    audioTrack.enabled = !nextMuted;
    setMuted(nextMuted);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.title}>Video Call</div>
        <div style={styles.status}>
          {videoJoined
            ? `Live • ${peers.length + 1}/${MAX_VIDEO_USERS}`
            : "Connecting..."}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.videoGrid}>
        <div style={styles.card}>
          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            style={styles.video}
          />
          <div style={styles.footer}>
            <span>{username || "You"} (You)</span>
            <button onClick={toggleMute} style={styles.button}>
              {muted ? "Unmute" : "Mute"}
            </button>
          </div>
        </div>

        {peers.map((peer) => (
          <RemoteVideo key={peer.id} stream={peer.stream} peerId={peer.id} />
        ))}
      </div>
    </div>
  );
};

const RemoteVideo = ({ stream, peerId }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={styles.card}>
      <video ref={ref} autoPlay playsInline style={styles.video} />
      <div style={styles.remoteFooter}>User: {peerId.slice(0, 6)}</div>
    </div>
  );
};

const styles = {
  wrapper: {
    padding: "10px",
    background: "#0f172a",
    borderRadius: "12px",
    border: "1px solid #1e293b",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  title: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#e2e8f0",
  },
  status: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  error: {
    marginBottom: "10px",
    padding: "8px 10px",
    borderRadius: "8px",
    background: "rgba(239,68,68,0.12)",
    color: "#fca5a5",
    fontSize: "13px",
  },
  videoGrid: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  card: {
    width: "200px",
    background: "#020617",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #1e293b",
  },
  video: {
    width: "100%",
    height: "140px",
    objectFit: "cover",
    background: "#000",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px",
    color: "#e2e8f0",
    fontSize: "12px",
  },
  remoteFooter: {
    padding: "8px",
    color: "#cbd5e1",
    fontSize: "12px",
  },
  button: {
    border: "none",
    borderRadius: "6px",
    padding: "6px 10px",
    background: "#22c55e",
    color: "#000",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default VideoCall;
