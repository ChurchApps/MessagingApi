import admin from "firebase-admin";
import { FcmMessage } from "../models";
import { DataMessagePayload, Message } from "firebase-admin/lib/messaging/messaging-api";

export class FirebaseHelper {

  static app: admin.app.App = null;

  static async sendMessage(fcmToken:string, message: Message) {
    console.log("sending fcm message");
    if (fcmToken) {
      await this.initialize();
      admin.messaging().send({ token: fcmToken, data: message as any})
      // const payload: DataMessagePayload = { data: message as any };
      // await admin.messaging().sendToDevice(fcmToken, payload, { contentAvailable: true, priority: "normal" })
    }
  }

  static async initialize() {
    if (!this.app) {
      this.app = admin.initializeApp({
        credential: admin.credential.applicationDefault()
      })
    }

  }

}