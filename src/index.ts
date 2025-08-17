import { Pool } from "@churchapps/apihelper";
import { init } from "./App";
import { Environment } from "./helpers/Environment";

const port = process.env.SERVER_PORT;
Environment.init(process.env.APP_ENV).then(() => {
  Pool.initPool();

  init().then((app: any) => {
    app.listen(port, () => {
      // Removed server startup logging to reduce CloudWatch noise
      // Only essential operational logs should go to CloudWatch in production
    });
  });
});
