import "reflect-metadata";
import winston from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
import AWS from 'aws-sdk';
import { Environment } from "./Environment";

export class Logger {
  private _logger: winston.Logger = null;
  private wc: WinstonCloudWatch;
  private pendingMessages = false;

  public error(msg: string | object) {
    if (this._logger === null) this.init();
    this.pendingMessages = true;
    this._logger.error(msg);
  }

  public info(msg: string | object) {
    if (this._logger === null) this.init();
    this.pendingMessages = true;
    this._logger.info(msg);
  }


  private init() {
    this.pendingMessages = false;
    AWS.config.update({ region: 'us-east-2' });
    if (Environment.appEnv === "dev") {
      this._logger = winston.createLogger({ transports: [new winston.transports.Console()], format: winston.format.json() });
      // this.wc = new WinstonCloudWatch({ logGroupName: 'StreamingLiveDev', logStreamName: 'ChatApi' });
      // this._logger = winston.createLogger({ transports: [this.wc], format: winston.format.json() });
    }
    else if (Environment.appEnv === "staging") {
      this.wc = new WinstonCloudWatch({ logGroupName: 'CoreApis', logStreamName: 'MessagingApi', name: "CoreApis_MessagingApi" });
      this._logger = winston.createLogger({ transports: [this.wc], format: winston.format.json() });
    }
    else if (Environment.appEnv === "prod") {
      this.wc = new WinstonCloudWatch({ logGroupName: 'CoreApis', logStreamName: 'MessagingApi', name: "CoreApis_MessagingApi" });
      this._logger = winston.createLogger({ transports: [this.wc], format: winston.format.json() });
    }
    this._logger.info("Logger initialized");
  }

  public flush() {
    const promise = new Promise<void>((resolve) => {
      if (this.pendingMessages) {
        this.wc.kthxbye(() => {
          this._logger = null;
          resolve();
        });
      } else resolve();
    });
    return promise;
  }


}
