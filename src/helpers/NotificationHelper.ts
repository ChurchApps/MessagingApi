import { Conversation, Message, PrivateMessage } from "../models";
import { Repositories } from "../repositories";
import { DeliveryHelper } from "./DeliveryHelper";

export class NotificationHelper {

  static checkShouldNotify = async (conversation: Conversation, message: Message, senderPersonId:string) => {
    switch (conversation.contentType) {
      case "privateMessage":
        console.log("Conversation", conversation);
        const pm:PrivateMessage = await Repositories.getCurrent().privateMessage.loadByConversationId(conversation.churchId, conversation.id);
        const personId = (pm.fromPersonId === senderPersonId) ? pm.toPersonId : pm.fromPersonId;
        await this.notifyUser(message.churchId, personId);
        break;
    }
  }

  /*
  static notifyConversation = async (conversation: Conversation, message: Message) => {

  }*/

  static notifyUser = async (churchId:string, personId:string) => {
      const repos = Repositories.getCurrent();
      // await repos.connection.loadForNotification(payload.churchId, payload.conversationId);
      const connections = await repos.connection.loadForNotification(churchId, personId);
      console.log("CONNECTIONS", connections.length);
      if (connections.length > 0) {
        const deliveryCount = await DeliveryHelper.sendMessages(connections, { churchId, conversationId: "alert", action: "notification", data: {} });
        console.log("DELIVERY COUNT", deliveryCount);
        return deliveryCount;
      }
      else return 0;
  }


}