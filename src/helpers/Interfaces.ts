import WebSocket from "ws";
import { Message, } from "../models"

export type PayloadAction = "message" | "deleteMessage" | "callout" | "attendance" | "prayerRequest" | "socketId";

export interface PayloadInterface { churchId: string, conversationId: string, action: PayloadAction, data: any }
export interface AttendanceInterface { viewers?: ViewerInterface[], totalViewers?: number, conversationId: string }
export interface ViewerInterface { displayName: string, count: number }
export interface SocketConnectionInterface { id: string, socket: WebSocket }

