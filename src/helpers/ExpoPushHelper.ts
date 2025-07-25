// Note: No api key is needed, just the device token.

import axios from "axios";

export class ExpoPushHelper {
  private static readonly EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

  static async sendMessage(expoPushToken: string, title: string, body: string): Promise<void> {
    const message = {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data: { title, body }
    };

    await axios.post(this.EXPO_PUSH_ENDPOINT, message, {
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json"
      }
    });
  }

  static async sendTypedMessage(
    expoPushToken: string,
    title: string,
    body: string,
    type: "privateMessage" | "notification",
    contextId: string
  ): Promise<void> {
    const data = type === "privateMessage" ? { type, conversationId: contextId } : { type, notificationId: contextId };

    const message = {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data
    };

    await axios.post(this.EXPO_PUSH_ENDPOINT, message, {
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json"
      }
    });
  }

  static async sendBulkMessages(expoPushTokens: string[], title: string, body: string): Promise<void> {
    const messages = expoPushTokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data: { title, body }
    }));

    // Expo recommends sending no more than 100 messages per request
    const chunkSize = 100;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      await axios.post(this.EXPO_PUSH_ENDPOINT, chunk, {
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json"
        }
      });
    }
  }

  static async sendBulkTypedMessages(
    expoPushTokens: string[],
    title: string,
    body: string,
    type: "privateMessage" | "notification",
    contextId: string
  ): Promise<void> {
    const data = type === "privateMessage" ? { type, conversationId: contextId } : { type, notificationId: contextId };

    const messages = expoPushTokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data
    }));

    // Expo recommends sending no more than 100 messages per request
    const chunkSize = 100;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      await axios.post(this.EXPO_PUSH_ENDPOINT, chunk, {
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json"
        }
      });
    }
  }
}
