import "reflect-metadata";
import dotenv from "dotenv";
import { Environment } from "../src/helpers/Environment";
import { Pool } from "@churchapps/apihelper";
import { DBCreator } from "@churchapps/apihelper";

const init = async () => {
  dotenv.config();
  Environment.init(process.env.APP_ENV).then(() => { 
    console.log("Connecting");
    Pool.initPool();
  }));
  

  const tablesAndProcedure: { title: string, file: string, customDelimeter?: boolean }[] = [
    { title: "Connections", file: "connections.mysql" },
    { title: "Conversations", file: "conversations.mysql" },
    { title: "Messages", file: "messages.mysql" },
    { title: "Private Messages", file: "privateMessages.mysql" },
    { title: "Cleanup Procedure", file: "cleanup.mysql", customDelimeter: true },
    { title: "Update Conversation Stats", file: "updateConversationStats.mysql", customDelimeter: true }
  ];

  await initTablesAndProcedures("Messaging", tablesAndProcedure);
}

const initTablesAndProcedures = async (displayName: string, entries: { title: string, file: string, customDelimeter?: boolean }[]) => {
  console.log("");
  console.log("SECTION: " + displayName);
  for (const entry of entries) {
    await DBCreator.runScript(entry.title, "./tools/dbScripts/" + entry.file, entry.customDelimeter || false);
  }
}

init()
  .then(() => { console.log("Database Created"); process.exit(0); })
  .catch((ex) => {
    console.log(ex);
    console.log("Database not created due to errors");
    process.exit(0);
  });