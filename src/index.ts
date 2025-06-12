import { init } from './App';
import { Pool } from "@churchapps/apihelper";
import { Environment } from './helpers/Environment';
import { Logger } from './helpers/Logger';

const port = process.env.SERVER_PORT;
Environment.init(process.env.APP_ENV).then(() => {
  Pool.initPool();

  init().then(app => {
    app.listen(port, () => {
      Logger.info(`Server running at http://localhost:${port}/`);
    });
  });
});
