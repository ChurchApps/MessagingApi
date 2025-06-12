import dotenv from "dotenv";
import bodyParser from "body-parser";
import "reflect-metadata";
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import { bindings } from "./inversify.config";
import express from "express";
import { CustomAuthProvider } from "@churchapps/apihelper";
import cors from "cors"
import { SocketHelper } from "./helpers/SocketHelper";
import { Environment } from "./helpers";


export const init = async () => {
  dotenv.config();
  const container = new Container();
  await container.loadAsync(bindings);
  const app = new InversifyExpressServer(container, null, null, null, CustomAuthProvider);

  const configFunction = (expApp: express.Application) => {
    // CORS configuration
    expApp.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Handle Buffer body parsing from serverless-express
    expApp.use((req, res, next) => {
      if (req.body && Buffer.isBuffer(req.body)) {
        try {
          const bodyStr = req.body.toString('utf8');
          if (bodyStr.startsWith('{') || bodyStr.startsWith('[')) {
            req.body = JSON.parse(bodyStr);
          }
        } catch (e) {
          // If parsing fails, leave as buffer
        }
      }
      next();
    });

    // Standard body parsers
    expApp.use(bodyParser.urlencoded({ extended: true }));
    expApp.use(bodyParser.json({ limit: '10mb' }));
  };

  const server = app.setConfig(configFunction).build();

  if (Environment.deliveryProvider === "local") SocketHelper.init();

  return server;
}
