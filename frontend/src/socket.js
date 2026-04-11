import { io } from "socket.io-client";

const SOCKET_URL = "http://16.176.142.165:5000";

export const socket = io(SOCKET_URL, {
  auth: {
    token: localStorage.getItem("token") // or wherever you store JWT
  }
});