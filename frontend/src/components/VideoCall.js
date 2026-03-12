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

        socket.emit("join-video", roomId);

        socket.on("user-joined", (signal) => {

          peerRef.current = new Peer({
            initiator: false,
            trickle: false,
            stream: currentStream
          });

          peerRef.current.signal(signal);

          peerRef.current.on("stream", (remoteStream) => {
            if (userVideo.current) {
              userVideo.current.srcObject = remoteStream;
            }
          });

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

      socket.off("user-joined");

      if (peerRef.current) {
        peerRef.current.destroy();
      }

    };

  }, [roomId]);

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