import React, { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import { socket } from "../socket";

const VideoCall = ({ roomId, username }) => {
  const myVideo = useRef(null);
  const peersRef = useRef([]);
  const [peers, setPeers] = useState([]);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");

  // ✅ Add peer with useCallback to avoid stale closure
  const addPeer = useCallback((incomingId, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", signal => socket.emit("returning-signal", { signal, to: incomingId }));
    peer.on("stream", remoteStream => {
      setPeers(prev => {
        if (!prev.includes(remoteStream)) return [...prev, peer];
        return prev;
      });
    });

    return peer;
  }, []);

  const createPeer = useCallback((userToSignal, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", signal => socket.emit("sending-signal", { userToSignal, signal }));
    peer.on("stream", remoteStream => {
      setPeers(prev => {
        if (!prev.includes(remoteStream)) return [...prev, peer];
        return prev;
      });
    });

    return peer;
  }, []);

useEffect(() => {
  let stream;

  const startVideo = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (myVideo.current) myVideo.current.srcObject = stream;

      socket.emit("join-video", roomId, username);

      socket.on("all-users", users => {
        const peersTemp = users.map(userId => {
          const peer = createPeer(userId, stream);
          peersRef.current.push({ peerID: userId, peer });
          return peer;
        });
        setPeers(peersTemp);
      });

      socket.on("user-joined-video", userId => {
        const peer = addPeer(userId, stream);
        peersRef.current.push({ peerID: userId, peer });
        setPeers(prev => [...prev, peer]);
      });

      socket.on("receiving-signal", ({ signal, from }) => {
        const item = peersRef.current.find(p => p.peerID === from);
        if (item) item.peer.signal(signal);
        else {
          const peer = addPeer(from, stream);
          peer.signal(signal);
          peersRef.current.push({ peerID: from, peer });
          setPeers(prev => [...prev, peer]);
        }
      });

      socket.on("signal-returned", ({ signal, from }) => {
        const item = peersRef.current.find(p => p.peerID === from);
        if (item) item.peer.signal(signal);
      });

    } catch (err) {
      setError("Camera or microphone access denied.");
    }
  };

  startVideo();

  // 🔹 Capture the peers snapshot for cleanup
  const peersAtMount = peersRef.current;

  return () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    socket.off("all-users");
    socket.off("user-joined-video");
    socket.off("receiving-signal");
    socket.off("signal-returned");

    // ✅ Destroy peers using the snapshot, not the mutable ref
    peersAtMount.forEach(p => p.peer.destroy());
  };
}, [roomId, username, addPeer, createPeer]); // deps remain the same

  const toggleMute = () => {
    if (myVideo.current?.srcObject) {
      const track = myVideo.current.srcObject.getAudioTracks()[0];
      if (track) track.enabled = muted;
      setMuted(!muted);
    }
  };

  return (
    <div style={{ padding: 10 }}>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <div>
          <video ref={myVideo} autoPlay muted playsInline style={{ width: 200, borderRadius: 10 }} />
          <button onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</button>
          <div>You</div>
        </div>
        {peers.map((peer, index) => (
          <Video key={index} peer={peer} />
        ))}
      </div>
    </div>
  );
};

const Video = ({ peer }) => {
  const ref = useRef();
  useEffect(() => {
    peer.on("stream", stream => { if (ref.current) ref.current.srcObject = stream; });
  }, [peer]);
  return <video ref={ref} autoPlay playsInline style={{ width: 200, borderRadius: 10 }} />;
};

export default VideoCall;