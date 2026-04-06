import { io } from "socket.io-client";

const SOCKET_URL = "https://codearena-az4r.onrender.com";

export const socket = io(SOCKET_URL, {
  auth: {
    token: localStorage.getItem("token") // or wherever you store JWT
  }
});