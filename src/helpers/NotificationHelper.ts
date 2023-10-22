import { Conversation, Message } from "../models";
import { Repositories } from "../repositories";
import { DeliveryHelper } from "./DeliveryHelper";

export class NotificationHelper {

  static checkShouldNotify = async (conversation: Conversation, message: Message) => {

    switch (conversation.contentType) {
      case "privateMessage":
        const pm = await Repositories.getCurrent().privateMessage.loadById(conversation.churchId, conversation.contentId);
        // get the personId

        // switch everything to memberId and don't use personId?

        // let personId =
        // await this.notifyUser(message.churchId, message.);
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