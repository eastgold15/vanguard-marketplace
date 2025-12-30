import * as path from "node:path";
import { Pipeline } from "./core/pipeline";
import { ContractTask } from "./tasks/contract.task";
import { ControllerTask } from "./tasks/controller.task";
import { IndexTask } from "./tasks/index.task";
import { RouterTask } from "./tasks/router.task";
import { ServiceTask } from "./tasks/service.task";

const SCHEMA_PATH = path.resolve(
  __dirname,
  "../packages/contract/src/table.schema.ts"
);

// 🔥 核心配置：分别指定各模块生成位置
const CONTRACT_DIR = path.resolve(
  __dirname,
  "../packages/contract/src/modules"
);
const SERVICE_DIR = path.resolve(__dirname, "../apps/b2badmin/server/services");
const CONTROLLER_DIR = path.resolve(
  __dirname,
  "../apps/b2badmin/server/controllers"
);
const ROUTER_FILE = path.resolve(
  __dirname,
  "../apps/b2badmin/server/controllers/app-router.ts"
);

const pipeline = new Pipeline([
  ContractTask,
  ServiceTask,
  ControllerTask,
  IndexTask,
  RouterTask,
]);

// 运行！Contract 生成到 packages/contract，Service/Controller/Router 生成到 apps/b2badmin
pipeline
  .run(SCHEMA_PATH, {
    contractDir: CONTRACT_DIR,
    serviceDir: SERVICE_DIR,
    controllerDir: CONTROLLER_DIR,
    routerFile: ROUTER_FILE,
  })
  .catch(console.error);
