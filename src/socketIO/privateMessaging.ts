import { Server, Socket } from "socket.io";

// used for One - One messages using the chat UI found in header nav of apps

// maybe use private namespace here

export function registerPrivateMessaging(io: Server, socket: Socket) {
  console.log("registering private messages...")
}