import type { Project } from "ts-morph";
import type { GenContext, Task } from "../core/types";

// 全局收集所有契约信息
const contracts: Array<{ fileName: string; pascalName: string }> = [];

export const IndexTask: Task = {
  name: "Generating Index",
  run(project: Project, ctx: GenContext) {
    if (!ctx.config.stages.has("contract")) return;

    // 收集契约信息（不修改 ctx.artifacts）
    contracts.push({
      fileName: `${ctx.tableName}.contract`,
      pascalName: ctx.pascalName,
    });
  },
};

/**
 * 在所有契约生成完成后调用，生成 index.ts
 */
export function generateIndexFile(project: Project, indexFilePath: string) {
  let indexFile = project.getSourceFile(indexFilePath);
  if (!indexFile) {
    indexFile = project.createSourceFile(indexFilePath, "", {
      overwrite: true,
    });
  }

  // 清空现有内容 - 先获取所有语句再移除
  const statements = [...indexFile.getStatements()];
  statements.forEach((stmt) => stmt.remove());

  // 生成 export * 语句
  const exportStatements: string[] = [];

  for (const contract of contracts) {
    const fileName = contract.fileName;
    exportStatements.push(`export * from "./${fileName}";`);
  }

  // 生成文件内容
  const content = `// Auto-generated index file for all contracts
${exportStatements.join("\n")}
`;

  indexFile.replaceWithText(content);
  console.log(`\n✅ Generated index.ts with ${contracts.length} contracts`);

  // 清空收集器
  contracts.length = 0;
}
