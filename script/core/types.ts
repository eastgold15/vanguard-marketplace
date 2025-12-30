import type { Project } from "ts-morph";

export interface GenConfig {
  skip: boolean;
  stages: Set<"contract" | "service" | "controller">;
}

export interface GenContext {
  tableName: string; // "users"
  pascalName: string; // "Users"
  schemaKey: string; // "usersTable"

  // 🔥 新增：精确控制每个文件的输出位置
  paths: {
    root: string; // 根目录 (用于相对路径计算)
    contract: string; // .../modules/users.contract.ts
    service: string; // .../modules/users.service.ts
    controller: string; // .../modules/users.controller.ts
    index: string; // .../modules/index.ts
  };

  config: GenConfig;

  // 产物元数据 (用于依赖引用)
  artifacts: {
    contractName?: string; // "UsersContract"
    serviceName?: string; // "UsersService"
  };
}

export interface Task {
  name: string;
  run(project: Project, ctx: GenContext): void;
}
