import "reflect-metadata";
import winston from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";
import { fromEnv } from "@aws-sdk/credential-providers";
import { Environment } from "./Environment";

export class Logger {
  private static instance: Logger;
  private _logger: winston.Logger = null;
  private wc: WinstonCloudWatch;
  private pendingMessages = false;

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public static error(msg: string | object) {
    Logger.getInstance().error(msg);
  }

  public static info(msg: string | object) {
    Logger.getInstance().info(msg);
  }

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
    const cloudWatchClient = new CloudWatchLogs({
      region: "us-east-2",
      credentials: fromEnv()
    });

    if (Environment.appEnv === "dev") {
      this._logger = winston.createLogger({
        transports: [new winston.transports.Console()],
        format: winston.format.json()
      });
    } else if (Environment.appEnv === "staging" || Environment.appEnv === "prod") {
      this.wc = new WinstonCloudWatch({
        cloudWatchLogs: cloudWatchClient,
        logGroupName: "CoreApis",
        logStreamName: "MessagingApi",
        name: "CoreApis_MessagingApi"
      });
      this._logger = winston.createLogger({ transports: [this.wc], format: winston.format.json() });
    }
    // Removed logger initialization message to reduce CloudWatch noise
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
