import fs from "fs";
import path from "path";

import { AwsHelper, EnvironmentBase } from "@churchapps/apihelper";

export class Environment extends EnvironmentBase {
  static deliveryProvider: string;
  static socketPort: number;
  static socketUrl: string;
  static firebaseClientEmail: string;
  static firebasePrivateKey: string;
  static membershipApi: string;

  static async init(environment: string) {
    let file = "dev.json";
    if (environment === "staging") file = "staging.json";
    if (environment === "prod") file = "prod.json";

    const relativePath = "../../config/" + file;
    const physicalPath = path.resolve(__dirname, relativePath);

    const json = fs.readFileSync(physicalPath, "utf8");
    const data = JSON.parse(json);
    await this.populateBase(data, "messagingApi", environment);

    this.deliveryProvider = data.deliveryProvider;
    this.socketPort = data.socketPort;
    this.socketUrl = data.socketUrl;
    this.membershipApi = data.membershipApi;

    this.firebaseClientEmail =
      process.env.FIREBASE_CLIENT_EMAIL || (await AwsHelper.readParameter(`/${environment}/firebase/clientEmail`));
    this.firebasePrivateKey =
      process.env.FIREBASE_PRIVATE_KEY || (await AwsHelper.readParameter(`/${environment}/firebase/privateKey`));
    this.firebasePrivateKey = this.firebasePrivateKey.replace(/\\n/g, "\n");
  }
}
