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
    // This middleware handles both Lambda and localhost environments
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
      // Handle localhost development - parse raw body stream
      else if (!req.body && req.readable) {
        // For localhost, we need to manually parse the body
        let data = "";
        req.setEncoding("utf8");
        req.on("data", (chunk) => {
          data += chunk;
        });
        req.on("end", () => {
          try {
            if (contentType.includes("application/json") && data) {
              req.body = JSON.parse(data);
            } else if (contentType.includes("application/x-www-form-urlencoded") && data) {
              req.body = Object.fromEntries(new URLSearchParams(data));
            } else {
              req.body = data || {};
            }
          } catch (_e) {
            req.body = {};
          }
          next();
        });
        return; // Don't call next() here, it will be called in the 'end' event
      }

      next();
    });

    // Note: No standard body-parser middleware needed
    // Custom middleware above handles both Lambda (Buffer) and localhost (stream) body parsing
  };

  const server = app.setConfig(configFunction).build();

  if (Environment.deliveryProvider === "local") SocketHelper.init();

  return server;
};
