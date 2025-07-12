import { init } from "./App";
import { Pool } from "@churchapps/apihelper";
import { Environment } from "./helpers/Environment";
import { Logger } from "./helpers/Logger";

const port = process.env.SERVER_PORT;
Environment.init(process.env.APP_ENV).then(() => {
  Pool.initPool();

  init().then(app => {
    app.listen(port, () => {
      // Removed server startup logging to reduce CloudWatch noise
      // Only essential operational logs should go to CloudWatch in production
    });
  });
});
