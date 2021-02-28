import WebSocket from "ws";
import { Message, } from "../models"

export interface PayloadInterface { action?: string }
export interface MessageInterface extends PayloadInterface, Message { }
export interface AttendanceInterface extends PayloadInterface { viewers?: ViewerInterface[], totalViewers?: number, conversationId: string }


export interface ViewerInterface { displayName: string, count: number }

/*
export interface ConnectionInterface {
    room: string,
    connectionId: string,
    displayName: string,
    joinTime: number,
    prettyJoinTime: string
    ws?: WebSocket
}*/

export type SocketResponse = MessageInterface & AttendanceInterface;
