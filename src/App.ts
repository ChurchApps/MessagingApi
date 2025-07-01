import dotenv from "dotenv";
import "reflect-metadata";
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import { bindings } from "./inversify.config";
import express from "express";
import { CustomAuthProvider } from "@churchapps/apihelper";
import cors from "cors";
import { SocketHelper } from "./helpers/SocketHelper";
import { Environment } from "./helpers";

export const init = async () => {
  dotenv.config();
  const container = new Container();
  await container.loadAsync(bindings);
  const app = new InversifyExpressServer(container, null, null, null, CustomAuthProvider);

  const configFunction = (expApp: express.Application) => {
    // CORS configuration
    expApp.use(
      cors({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
        exposedHeaders: ["Content-Length", "X-Kuma-Revision"]
      })
    );

    // Explicit OPTIONS handler
    expApp.options("*", cors());

    // Handle body parsing from @codegenie/serverless-express
    expApp.use((req, res, next) => {
      const contentType = req.headers["content-type"] || "";

      // Handle Buffer instances (most common case with serverless-express)
      if (Buffer.isBuffer(req.body)) {
        try {
          const bodyString = req.body.toString("utf8");
          if (contentType.includes("application/json")) {
            req.body = JSON.parse(bodyString);
          } else {
            req.body = bodyString;
          }
        } catch (_e) {
          req.body = {};
        }
      }
      // Handle Buffer-like objects
      else if (req.body && req.body.type === "Buffer" && Array.isArray(req.body.data)) {
        try {
          const bodyString = Buffer.from(req.body.data).toString("utf8");
          if (contentType.includes("application/json")) {
            req.body = JSON.parse(bodyString);
          } else {
            req.body = bodyString;
          }
        } catch (_e) {
          req.body = {};
        }
      }
      // Handle string JSON bodies
      else if (typeof req.body === "string" && req.body.length > 0) {
        try {
          if (contentType.includes("application/json")) {
            req.body = JSON.parse(req.body);
          }
        } catch (_e) {
          // Ignore JSON parsing errors and leave body as string
        }
      }

      next();
    });

    // Note: No standard body-parser middleware needed
    // Custom buffer handling above replaces the need for body-parser
  };

  const server = app.setConfig(configFunction).build();

  if (Environment.deliveryProvider === "local") SocketHelper.init();

  return server;
};
