import { io } from "socket.io-client";

const SOCKET_URL = "https://codearena123.duckdns.org";

export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  auth: {
    token: localStorage.getItem("token"),
  },
});
