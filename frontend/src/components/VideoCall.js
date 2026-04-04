import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { socket } from "../socket";

const VideoCall = ({ roomId }) => {

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const peerRef = useRef(null);

  const [error, setError] = useState("");

  useEffect(() => {
    let stream;

    const startVideo = async () => {
      try {
        const currentStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        stream = currentStream;

        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        // 🔥 JOIN VIDEO ROOM
        socket.emit("join-video", roomId);

        // 👥 EXISTING USERS → create peer (initiator)
        socket.on("all-users", (users) => {
          if (users.length > 0) {
            const peer = createPeer(users[0], currentStream);
            peerRef.current = peer;
          }
        });

        // 🆕 NEW USER JOINED → create receiver peer
        socket.on("user-joined-video", (userId) => {
          const peer = addPeer(userId, currentStream);
          peerRef.current = peer;
        });

        // 📡 RECEIVE SIGNAL
        socket.on("receiving-signal", ({ signal, from }) => {
          const peer = addPeer(from, currentStream);
          peer.signal(signal);
          peerRef.current = peer;
        });

        // 🔁 SIGNAL RETURNED
        socket.on("signal-returned", ({ signal }) => {
          peerRef.current?.signal(signal);
        });

      } catch (err) {
        setError("Camera or microphone access denied.");
      }
    };

    startVideo();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      socket.off("all-users");
      socket.off("user-joined-video");
      socket.off("receiving-signal");
      socket.off("signal-returned");

      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };

  }, [roomId]);

  // 🔥 CREATE PEER (Caller)
  const createPeer = (userToSignal, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", {
        userToSignal,
        signal
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    return peer;
  };

  // 🔥 ADD PEER (Receiver)
  const addPeer = (incomingId, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });

    peer.on("signal", (signal) => {
      socket.emit("returning-signal", {
        signal,
        to: incomingId
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    return peer;
  };

  // 🎨 YOUR ORIGINAL STYLES (UNCHANGED)
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      padding: "12px"
    },

    videoCard: {
      position: "relative",
      borderRadius: "10px",
      overflow: "hidden",
      border: "1px solid #1e293b",
      background: "#020617",
      boxShadow: "0 4px 12px rgba(0,0,0,0.35)"
    },

    video: {
      width: "100%",
      display: "block"
    },

    label: {
      position: "absolute",
      bottom: "6px",
      left: "8px",
      background: "rgba(0,0,0,0.6)",
      color: "#fff",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px"
    },

    error: {
      color: "#ef4444",
      fontSize: "14px"
    }
  };

  return (
    <div style={styles.container}>

      {error && <div style={styles.error}>{error}</div>}

      {/* 🎥 YOUR VIDEO */}
      <div style={styles.videoCard}>
        <video
          ref={myVideo}
          autoPlay
          muted
          playsInline
          style={styles.video}
        />
        <div style={styles.label}>You</div>
      </div>

      {/* 🎥 REMOTE VIDEO */}
      <div style={styles.videoCard}>
        <video
          ref={userVideo}
          autoPlay
          playsInline
          style={styles.video}
        />
        <div style={styles.label}>Participant</div>
      </div>

    </div>
  );
};

export default VideoCall;