import type { Project } from "ts-morph";
import type { GenContext, Task } from "../core/types";

// 全局收集所有 controller 信息
const controllers: Array<{
  fileName: string;
  pascalName: string;
  tableName: string;
}> = [];

export const RouterTask: Task = {
  name: "Collecting Controllers",
  run(project: Project, ctx: GenContext) {
    if (!ctx.config.stages.has("controller")) return;

    // 收集 controller 信息
    controllers.push({
      fileName: `${ctx.tableName}.controller`,
      pascalName: ctx.pascalName,
      tableName: ctx.tableName,
    });
  },
};

/**
 * 在所有 controller 生成完成后调用，生成 app-router.ts
 */
export function generateRouterFile(project: Project, routerFilePath: string) {
  let routerFile = project.getSourceFile(routerFilePath);
  if (!routerFile) {
    routerFile = project.createSourceFile(routerFilePath, "", {
      overwrite: true,
    });
  }

  // 清空现有内容
  const statements = [...routerFile.getStatements()];
  statements.forEach((stmt) => stmt.remove());

  // 生成导入语句
  const importStatements: string[] = [];
  const useStatements: string[] = [];

  // 排序：按字母顺序，便于查找
  controllers.sort((a, b) => a.tableName.localeCompare(b.tableName));

  for (const ctrl of controllers) {
    const fileName = ctrl.fileName;
    const pascalName = ctrl.pascalName;
    const controllerName = `${ctrl.tableName}Controller`; // 变量名如 tenantController

    importStatements.push(`import { ${controllerName} } from "./${fileName}";`);
    useStatements.push(`    .use(${controllerName})`);
  }

  // 生成文件内容
  const content = `/**
 * 🤖 【路由挂载器 - 自动生成】
 * --------------------------------------------------------
 * 🛠️ 静态链式调用，保证 Eden Treaty 类型推断完美。
 * --------------------------------------------------------
 */
import type { Elysia } from "elysia";

${importStatements.join("\n")}

export const appRouter = (app: Elysia) =>
  app
${useStatements.join("\n")};
`;

  routerFile.replaceWithText(content);
  console.log(
    `\n✅ Generated app-router.ts with ${controllers.length} controllers`
  );

  // 清空收集器
  controllers.length = 0;
}
