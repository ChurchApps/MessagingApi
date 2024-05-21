import admin from "firebase-admin";
import { Message } from "firebase-admin/lib/messaging/messaging-api";
import { Environment } from "./Environment";
import { Repositories } from "../repositories";

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
        try {
        const result = await admin.messaging().send(message)
        console.log("Message sent", result);
        } catch (e) {
            if (e.toString().indexOf("entity was not found") > -1) {
                console.log("Removing invalid token", fcmToken);
                await Repositories.getCurrent().device.deleteByToken(fcmToken);
            }
        }
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