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

    // Handle body parsing from @codegenie/serverless-express
    expApp.use((req, res, next) => {
      const contentType = req.headers['content-type'] || '';
      
      // Handle Buffer instances (most common case with serverless-express)
      if (Buffer.isBuffer(req.body)) {
        try {
          const bodyString = req.body.toString('utf8');
          if (contentType.includes('application/json')) {
            req.body = JSON.parse(bodyString);
          } else {
            req.body = bodyString;
          }
        } catch (e) {
          console.error('Failed to parse Buffer body:', e.message);
          req.body = {};
        }
      }
      // Handle Buffer-like objects
      else if (req.body && req.body.type === 'Buffer' && Array.isArray(req.body.data)) {
        try {
          const bodyString = Buffer.from(req.body.data).toString('utf8');
          if (contentType.includes('application/json')) {
            req.body = JSON.parse(bodyString);
          } else {
            req.body = bodyString;
          }
        } catch (e) {
          console.error('Failed to parse Buffer-like body:', e.message);
          req.body = {};
        }
      }
      // Handle string JSON bodies
      else if (typeof req.body === 'string' && req.body.length > 0) {
        try {
          if (contentType.includes('application/json')) {
            req.body = JSON.parse(req.body);
          }
        } catch (e) {
          console.error('Failed to parse string body as JSON:', e.message);
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
