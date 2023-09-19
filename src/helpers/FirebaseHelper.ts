import admin from "firebase-admin";
import { FcmMessage } from "../models";
import { DataMessagePayload, Message } from "firebase-admin/lib/messaging/messaging-api";

export class FirebaseHelper {

  static app: admin.app.App = null;



  static async sendMessage(fcmToken:string, title:string, body:string) {
    const message: Message = {
      notification: {
        body,
        title
      },
      token: fcmToken
    }

    console.log("sending fcm message");
    if (fcmToken) {
      await this.initialize();

      console.log(message)
      admin.messaging().send(message)
      // const payload: DataMessagePayload = { data: message as any };
      // await admin.messaging().sendToDevice(fcmToken, payload, { contentAvailable: true, priority: "normal" })
    }
  }

  static async initialize() {
    if (!this.app) {
      this.app = admin.initializeApp({
        databaseURL: "https://b1mobile.firebaseio.com",
        credential: admin.credential.cert({
          projectId: 'b1mobile',
          clientEmail: 'firebase-adminsdk-ngq7g@b1mobile.iam.gserviceaccount.com',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDCIa2uCEOZOsKU\nGorph9fBSCyXR7oT3ytuXjjUqxDMB8Rva5KgqJqbalujBn0WDHTrbYTWNcLcIDeh\nTiS7evM+E4PO7tQ0iRaRD8LdQ9ZOG1gUswsIvizcCGuWZ0uigUsT/DpUH9ipKpeI\nR35O9yS7zZHNZ4QLZ9+OMAdHprNOfRYrkehdVwW42t/j1Yfzw7KykbZOC7G+G9Ti\nCINxO83VExNPN2QJ+JX16AIgFqf7GSSoGhAqbaUoj80EotZE77CovBj39B2uPMo9\nltDsDqFYuS77UVGiQuSM8+hdqgeri+L33FIs02S9B/fPR4PvfkLDMo1DCISH0c5B\nzJl5caEvAgMBAAECggEAQ8xPQ8BPG2ySF/dNHFH839u89vht3BLMsDbn0h4MN7Ve\nvSrsgn9fv3ddmYnilZi0HKSbB9SuwQHfa85GtdMysDNQjSyLn+1gnDjM7UmLxqt2\nD4SYDe2c7Rtjt5tLpu1QsyIbnNWibTIaydVuH1Xg1lXs3beRPgqA4L+VS0jExlv8\nAtfw4TPYfr55KuTLWlgYjrSid2j20eTGuHTzGNtDDiCynhQy2rRCUJESPhsvbmkV\nizvTGhW3fvLITrMS0Uxc84mBiWz8BMiApCGV/b/TyaHn1RNMSuTvDig8xm0u02Dg\nK30Mtw+zQG/nLlqPlJTmcG9wl4Tgaqv8hqsZ2WgJAQKBgQD/YdVIw0gumDdKEZX+\nbJqa3zTG0d48URi+hsizZKKEKVD4U6O90jECKzJaLWKpp/B23wndqS2/Kr5dz4He\nDxy4eMisXNIdgWOruzIMqo3l4LVXNNsbEzy6JkTrIg8ygD+SG27dAWwIFPCIqEe9\nxNXPNQQlRypea7kK4WlFWGskMQKBgQDCmekkdzKc7+Jmj5vmPPGVYNxuJHMX41pS\nm11j+523zeW1tLjzoTIuLdCO0EhJvOrk2zZVg77w8fs6wZLFKIA4hiL4bd907P+2\nqWGzWgtoanCiGV+9EO8lzZexGdlozbTJstnQkkFlml2t/Hodggdxy61dnayq5uWX\nDftZFuSjXwKBgQDOCpW0xfFXvnFlLfkRM3gtGYaQHkSp71gCZ+ZHbhr8fAUaxQhn\nnszxjf5q6REgBiGpFlv0XYlOIeNC9qc1jIXEg5aMEbtoGLtck4RW2cfwPrKv8DIS\njxvAqB2Ug381ZGllrQJuBratco96AiMXhVZnfcOhe+BAG7NIhwKS8zpGEQKBgQCU\nOSMp0VjNzLHHqM74WacxPmvnwP+hTFy52vkRdM+29q9m7daKS1ercN4QSXkmIS1R\nT99c11KSt93B7TtbzPONGi58x0OTDgngGbf/IjDaQWi1L1qK6eEeDDDkhmngt/5i\nO0ZI5X3GZAPCyDJDU41UEe1lBvpD2kc5/T5bp2JTRQKBgF0dS7jOI504qlj/At86\nxBXOACcWunkOZaxQvExaPAdb4aebdGgUglsI51XzFW0Hkj2n6CMQ00kmXb8qL9qT\n7Bzf6MI7080LqEjaRa1KH2eKDIWgRA8lGQ+wHi2X9ECeOSIFTm3NaRSWxDyxThB6\nYhl6wG184kEBPnOHWsC7zHz1\n-----END PRIVATE KEY-----\n'
      })
      })
    }

  }

}