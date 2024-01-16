import { ArrayHelper, EmailHelper } from "@churchapps/apihelper";
import { Conversation, Device, Message, PrivateMessage, Notification, NotificationPreference } from "../models";
import { Repositories } from "../repositories";
import { DeliveryHelper } from "./DeliveryHelper";
import { FirebaseHelper } from "./FirebaseHelper";
import axios from "axios";
import { Environment } from "./Environment";

export class NotificationHelper {

  static checkShouldNotify = async (conversation: Conversation, message: Message, senderPersonId:string, title?:string) => {
    switch (conversation.contentType) {
      case "streamingLive":
        // don't send notifications for live stream chat room.
        break;
      case "privateMessage":
        const pm:PrivateMessage = await Repositories.getCurrent().privateMessage.loadByConversationId(conversation.churchId, conversation.id);
        pm.notifyPersonId = (pm.fromPersonId === senderPersonId) ? pm.toPersonId : pm.fromPersonId;
        await Repositories.getCurrent().privateMessage.save(pm);
        const method = await this.notifyUser(message.churchId, pm.notifyPersonId, title);
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


  static notifyUser = async (churchId:string, personId:string, title:string = "New Notification") => {
    console.log("notifyUser", churchId, personId, title)
    let method = "";
    const repos = Repositories.getCurrent();
    let deliveryCount = 0;
    const connections = await repos.connection.loadForNotification(churchId, personId);
    console.log("connections", connections.length)
    if (connections.length > 0) {
      method = "socket";
      deliveryCount = await DeliveryHelper.sendMessages(connections, { churchId, conversationId: "alert", action: "notification", data: {} });
    }
    if (deliveryCount===0) {
      const devices:Device[] = await Repositories.getCurrent().device.loadForPerson(personId);
      console.log("devices", devices.length)
      const promises: Promise<any>[] = [];
      devices.forEach(device => {
        promises.push(FirebaseHelper.sendMessage(device.fcmToken, title, title));
      });
      await Promise.all(promises);
      if (devices.length > 0) method = "push";
    }
    return method;
  }

  static sendEmailNotifications = async (frequency:string) => {
    let promises: Promise<any>[] = [];
    const allNotifications:Notification[] = await Repositories.getCurrent().notification.loadUndelivered();
    const allPMs:PrivateMessage[] = await Repositories.getCurrent().privateMessage.loadUndelivered();
    if (allNotifications.length === 0 && allPMs.length === 0) return;

    const peopleIds = ArrayHelper.getIds(allNotifications, "personId").concat(ArrayHelper.getIds(allPMs, "notifyPersonId"));

    const notificationPrefs = await Repositories.getCurrent().notificationPreference.loadByPersonIds(peopleIds);
    const todoPrefs:NotificationPreference[] = [];
    peopleIds.forEach(async personId => {
      const notifications:Notification[] = ArrayHelper.getAll(allNotifications, "personId", personId);
      const pms:PrivateMessage[] = ArrayHelper.getAll(allPMs, "notifyPersonId", personId);
      let pref = ArrayHelper.getOne(notificationPrefs, "personId", personId);
      if (!pref) pref = await this.createNotificationPref(notifications[0]?.churchId || pms[0]?.churchId, personId);
      if (pref.emailFrequency==="never") promises = promises.concat(this.markMethod(notifications, pms, "none"));
      else if (pref.emailFrequency === frequency) todoPrefs.push(pref)
    });

    if (todoPrefs.length > 0) {
      const allEmailData = await this.getEmailData(todoPrefs);
      todoPrefs.forEach(pref => {
        const notifications:Notification[] = ArrayHelper.getAll(allNotifications, "personId", pref.personId);
        const pms:PrivateMessage[] = ArrayHelper.getAll(allPMs, "notifyPersonId", pref.personId);
        const emailData = ArrayHelper.getOne(allEmailData, "id", pref.personId);
        if (emailData) promises.push(this.sendEmailNotification(emailData.email, notifications, pms));
      });

    }
    await Promise.all(promises);
  }

  static markMethod = (notifications:Notification[], privateMessages:PrivateMessage[], method:string) => {
    const promises: Promise<any>[] = [];
    notifications.forEach(notification => {
      notification.deliveryMethod = "none";
      promises.push(Repositories.getCurrent().notification.save(notification));
    });
    privateMessages.forEach(pm => {
      pm.deliveryMethod = "none";
      promises.push(Repositories.getCurrent().privateMessage.save(pm));
    });
    return promises;
  }

  static createNotificationPref = async (churchId:string, personId:string) => {
    const pref:NotificationPreference = { churchId, personId, allowPush: true, emailFrequency: "daily" };
    const result = await Repositories.getCurrent().notificationPreference.save(pref);
    return result;
  }

  static getEmailData = async (notificationPrefs:NotificationPreference[]) => {
    const peopleIds = ArrayHelper.getIds(notificationPrefs, "personId");
    const data = {
      peopleIds,
      jwtSecret: Environment.jwtSecret
    }
    const result = await axios.post(Environment.membershipApi + "/people/apiEmails", data);
    return result.data;
  }

  static sendEmailNotification = async (email:string, notifications:Notification[], privateMessages:PrivateMessage[]) => {
    let title = notifications.length + " New Notifications";
    if (notifications.length === 1 && privateMessages.length===0) title = "New Notification: " + notifications[0].message;
    else if (notifications.length === 0 && privateMessages.length===1) title = "New Private Message";


    await EmailHelper.sendTemplatedEmail("support@churchapps.org", email, "Chums", "https://chums.org", title, title, "ChurchEmailTemplate.html");
    const promises: Promise<any>[] = this.markMethod(notifications, privateMessages, "email");
    await Promise.all(promises);
  }


}