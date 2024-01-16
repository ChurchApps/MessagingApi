import admin from "firebase-admin";
import { FcmMessage } from "../models";
import { DataMessagePayload, Message } from "firebase-admin/lib/messaging/messaging-api";
import { Environment } from "./Environment";

export class FirebaseHelper {

  static app: admin.app.App = null;



  static async sendMessage(fcmToken:string, title:string, body:string) {
    if (Environment.firebasePrivateKey) {
      const message: Message = {
        notification: {
          body,
          title
        },
        token: fcmToken
      }

      console.log("Sending message to " + fcmToken, message);

      if (fcmToken) {
        await this.initialize();
        await admin.messaging().send(message)
      }
    }
  }

  static async initialize() {
    if (!this.app) {
      this.app = admin.initializeApp({
        databaseURL: "https://b1mobile.firebaseio.com",
        credential: admin.credential.cert({
          projectId: "b1mobile",
          clientEmail: Environment.firebaseClientEmail,
          privateKey: Environment.firebasePrivateKey
      })
      })
    }

  }

}