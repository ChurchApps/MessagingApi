import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

import { registerPrivateMessaging } from "./privateMessaging";
import { registerPublicMessaging } from "./publicMessaging";

export function initializeSocketIO(app: http.Server) {
  const io = new Server(app, {
    cors: {
      // https://admin.socket.io - Socket status can be checked here by inputing socketURL i.e. messagingApi url
      //  TODO: add all the frontend apps URL which will be using messaging
      origin: ["https://admin.socket.io", "http://pranav01.localhost:3301"],
      credentials: true
    },
  });

  // Setup admin UI
  instrument(io, { auth: false });

  io.on("connection", (socket) => {
    console.log("connection made. socketId: ", socket.id)
    registerPrivateMessaging(io, socket);
    registerPublicMessaging(io, socket);

    socket.on("disconnect", () => {
      socket.disconnect()
    })

    socket.on("test messages", event => {
      console.log(event)
    })
  });
}
