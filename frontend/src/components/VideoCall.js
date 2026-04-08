import React, { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import { socket } from "../socket";

const VideoCall = ({ roomId, username }) => {
  const myVideo = useRef(null);
  const peersRef = useRef([]); // stores peer objects
  const [peers, setPeers] = useState([]); // state for rendering
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");

  // Add a new incoming peer
  const addPeer = useCallback((incomingId, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", signal => {
      socket.emit("returning-signal", { signal, to: incomingId });
    });

    peer.on("stream", remoteStream => {
      setPeers(prev => {
        if (!prev.find(p => p.id === incomingId)) {
          return [...prev, { id: incomingId, stream: remoteStream }];
        }
        return prev;
      });
    });

    return peer;
  }, []);

  // Create a new outgoing peer
  const createPeer = useCallback((userToSignal, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", signal => {
      socket.emit("sending-signal", { userToSignal, signal });
    });

    peer.on("stream", remoteStream => {
      setPeers(prev => {
        if (!prev.find(p => p.id === userToSignal)) {
          return [...prev, { id: userToSignal, stream: remoteStream }];
        }
        return prev;
      });
    });

    return peer;
  }, []);

useEffect(() => {
  let stream;

  const start = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      myVideo.current.srcObject = stream;

      socket.emit("join-video", roomId);

      socket.on("all-users", (users) => {
        users.forEach(userId => {
          const peer = createPeer(userId, stream);
          peersRef.current.push({ peerID: userId, peer });
        });
      });

      socket.on("user-joined-video", (userId) => {
        const peer = addPeer(userId, stream);
        peersRef.current.push({ peerID: userId, peer });
      });

      socket.on("receiving-signal", ({ signal, from }) => {
        const item = peersRef.current.find(p => p.peerID === from);
        if (item) item.peer.signal(signal);
      });

      socket.on("signal-returned", ({ signal, from }) => {
        const item = peersRef.current.find(p => p.peerID === from);
        if (item) item.peer.signal(signal);
      });

    } catch (err) {
      console.error(err);
      setError("Camera/Microphone permission denied ❌");
    }
  };

  start();

  return () => {
    socket.off("all-users");
    socket.off("user-joined-video");
    socket.off("receiving-signal");
    socket.off("signal-returned");
  };
}, [roomId, createPeer, addPeer]);

  const toggleMute = () => {
    if (myVideo.current?.srcObject) {
      const track = myVideo.current.srcObject.getAudioTracks()[0];
      if (track) track.enabled = muted; // invert mute state
      setMuted(!muted);
    }
  };

  return (
    <div style={{ padding: 10 }}>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {/* Local Video */}
        <div>
          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            style={{ width: 200, borderRadius: 10 }}
          />
          <button onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</button>
          <div>You</div>
        </div>

        {/* Remote Peers */}
        {peers.map(peer => (
          <Video key={peer.id} stream={peer.stream} />
        ))}
      </div>
    </div>
  );
};

const Video = ({ stream }) => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline style={{ width: 200, borderRadius: 10 }} />;
};

export default VideoCall;