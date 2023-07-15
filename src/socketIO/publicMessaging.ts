import { Server, Socket } from "socket.io";

// used in streaminglive

// maybe use public namespace here

export function registerPublicMessaging(io: Server, socket: Socket) {
  console.log("registering public messages...")
}