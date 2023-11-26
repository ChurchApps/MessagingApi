import { ArrayHelper } from "@churchapps/apihelper";
import { Conversation, Device, Message, PrivateMessage, Notification } from "../models";
import { Repositories } from "../repositories";
import { DeliveryHelper } from "./DeliveryHelper";
import { FirebaseHelper } from "./FirebaseHelper";

export class NotificationHelper {

  static checkShouldNotify = async (conversation: Conversation, message: Message, senderPersonId:string) => {
    switch (conversation.contentType) {
      case "privateMessage":
        console.log("Conversation", conversation);
        const pm:PrivateMessage = await Repositories.getCurrent().privateMessage.loadByConversationId(conversation.churchId, conversation.id);
        pm.notifyPersonId = (pm.fromPersonId === senderPersonId) ? pm.toPersonId : pm.fromPersonId;
        await Repositories.getCurrent().privateMessage.save(pm);
        const method = await this.notifyUser(message.churchId, pm.notifyPersonId);
        if (method) {
          pm.deliveryMethod = method;
          await Repositories.getCurrent().privateMessage.save(pm);
        }
        break;
      default:
        if (conversation.messages.length>0)
        {
          const allMessages:Message[] = await Repositories.getCurrent().message.loadForConversation(conversation.churchId, conversation.id);
          const peopleIds = ArrayHelper.getIds(allMessages, "personId");
          if (peopleIds.length>1)
          {
            for (let i=peopleIds.length-1; i>=0; i--) {
              if (peopleIds[i] === senderPersonId) peopleIds.splice(i, 1);
            }
            await this.createNotifications(peopleIds, conversation.churchId, conversation.contentType, conversation.contentId, "New message: " + conversation.title);
          }
        }
        break;
    }
  }

  static createNotifications = async (peopleIds:string[], churchId:string, contentType: string, contentId: string, message: string,) => {
    const notifications:Notification[] = [];
      peopleIds.forEach((personId: string) => {
        const notification:Notification = {
          churchId,
          personId,
          contentType,
          contentId,
          timeSent: new Date(),
          isNew: true,
          message
        };
        console.log(notification);
        notifications.push(notification);
      });

      // don't notify people a second time about the same type of event.
      const existing = await Repositories.getCurrent().notification.loadExistingUnread(notifications[0].churchId, notifications[0].contentType, notifications[0].contentId);
      for (let i=notifications.length-1; i>=0; i--) {
        if (ArrayHelper.getAll(existing, "personId", notifications[i].personId).length > 0) notifications.splice(i, 1);
      }
      if (notifications.length > 0) {
        const promises: Promise<Notification>[] = [];
        notifications.forEach(n => {
          const promise = Repositories.getCurrent().notification.save(n).then(async (notification) => {
            const method = await NotificationHelper.notifyUser(n.churchId, n.personId);
            notification.deliveryMethod = method;
            await Repositories.getCurrent().notification.save(notification);
            return notification;
          });
          promises.push(promise);
        });
        const result = await Promise.all(promises);
        return result;
      } else return []
  }


  static notifyUser = async (churchId:string, personId:string) => {
    let method = "";
    const repos = Repositories.getCurrent();
    // await repos.connection.loadForNotification(payload.churchId, payload.conversationId);
    const connections = await repos.connection.loadForNotification(churchId, personId);
    console.log("CONNECTIONS", connections.length);
    if (connections.length > 0) {
      method = "socket";
      const deliveryCount = await DeliveryHelper.sendMessages(connections, { churchId, conversationId: "alert", action: "notification", data: {} });
      console.log("DELIVERY COUNT", deliveryCount);
    } else {
      const devices:Device[] = await Repositories.getCurrent().device.loadForPerson(personId);
      const promises: Promise<any>[] = [];
      devices.forEach(device => {
        promises.push(FirebaseHelper.sendMessage(device.fcmToken, "New Notification", "New Notification"));
      });
      await Promise.all(promises);
      if (devices.length > 0) method = "push";
    }
    return method;
  }


}