import * as path from "node:path";
import {
  type ClassDeclaration,
  Node,
  type ObjectLiteralExpression,
  Scope,
  type SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
} from "ts-morph";

const GEN_TAG = "@generated";
const DOC_BLOCK = `/** [Auto-Generated] Do not edit this tag to keep updates. ${GEN_TAG} */`;

/**
 * 🛠️ 路径标准化：强制将 Windows 反斜杠转换为正斜杠
 */
export function normalizePath(p: string): string {
  return p.split(path.sep).join("/");
}

/**
 * 🛠️ 确保 Import 存在
 */
export function ensureImport(
  file: SourceFile,
  moduleSpecifier: string,
  namedImports: string[],
  isTypeOnly = false
) {
  // 🔥 核心修复：规范化路径，防止生成 ..\..\
  const normalizedSpecifier = normalizePath(moduleSpecifier);

  let decl = file.getImportDeclaration(
    (d) => d.getModuleSpecifierValue() === normalizedSpecifier
  );
  if (!decl) {
    decl = file.addImportDeclaration({
      moduleSpecifier: normalizedSpecifier,
    });
  }

  const existingNamed = decl.getNamedImports().map((n) => n.getName());
  for (const name of namedImports) {
    if (!existingNamed.includes(name)) {
      decl.addNamedImport({ name, isTypeOnly });
    }
  }
}

/**
 * 🔥 [核心修复] 检查节点是否包含 @generated 标记
 * 自动向上查找：如果节点是 VariableDeclaration，自动去查 VariableStatement
 */
function checkIsGenerated(node: Node): boolean {
  let targetNode = node;

  // 关键：对于 export const x = ...，注释在 Statement 上，不在 Declaration 上
  if (Node.isVariableDeclaration(node)) {
    const stmt = node.getVariableStatement();
    if (stmt) {
      targetNode = stmt;
    }
  }

  // 🔥 对于 PropertyAssignment，注释可能在 Name 上
  if (Node.isPropertyAssignment(node)) {
    const nameNode = node.getNameNode();
    if (nameNode) {
      // 检查 Name 节点上的注释
      const ranges = nameNode.getLeadingCommentRanges();
      for (const range of ranges) {
        const text = range.getText();
        if (text.includes(GEN_TAG)) {
          return true;
        }
      }
    }
  }

  // 1. 优先尝试标准 JSDoc 获取
  // @ts-expect-error
  if (typeof targetNode.getJsDocs === "function") {
    // @ts-expect-error
    const docs = targetNode.getJsDocs();
    if (docs.some((d: any) => d.getInnerText().includes(GEN_TAG))) {
      return true;
    }
  }

  // 2. 兜底：检查 LeadingTrivia (前置杂项文本，包含非标准注释)
  const ranges = targetNode.getLeadingCommentRanges();
  for (const range of ranges) {
    if (range.getText().includes(GEN_TAG)) {
      return true;
    }
  }

  return false;
}

/**
 * 🛠️ 智能更新对象属性
 */
export function upsertObjectProperty(
  objLiteral: ObjectLiteralExpression,
  key: string,
  value: string
) {
  const prop = objLiteral.getProperty(key);

  // 1. 新增
  if (!prop) {
    objLiteral.addPropertyAssignment({
      name: key,
      initializer: value,
      leadingTrivia: (w) => w.writeLine(DOC_BLOCK),
    });
    console.log(`     ➕ Property: ${key}`);
    return;
  }

  // 2. 检查标记
  if (prop.isKind(SyntaxKind.PropertyAssignment)) {
    if (checkIsGenerated(prop)) {
      // 格式化对比：去除所有空格换行，防止格式化差异导致的误更新
      const cleanOld = prop.getInitializer()?.getText().replace(/\s+/g, "");
      const cleanNew = value.replace(/\s+/g, "");

      if (cleanOld !== cleanNew) {
        prop.setInitializer(value);
        console.log(`     🔄 Updated: ${key}`);
      }
    } else {
      console.log(`     🛡️ Skipped (Custom): ${key}`);
    }
  }
}

/**
 * 🛠️ 智能更新类方法
 */
export function upsertMethod(
  classDec: ClassDeclaration,
  name: string,
  body: string,
  params: { name: string; type: string }[] = [],
  returnType?: string
) {
  const method = classDec.getMethod(name);

  if (!method) {
    const m = classDec.addMethod({
      name,
      parameters: params,
      returnType,
      isAsync: true,
      scope: Scope.Public,
      statements: body,
    });
    // addJsDoc 不需要 /** */ 包裹
    m.addJsDoc(DOC_BLOCK.replace("/**", "").replace("*/", "").trim());
    console.log(`     ➕ Method: ${name}`);
    return;
  }

  if (checkIsGenerated(method)) {
    method.setBodyText(body);
    // 更新参数
    method.getParameters().forEach((p) => p.remove());
    params.forEach((p) => method.addParameter(p));
    if (returnType) method.setReturnType(returnType);
    console.log(`     🔄 Updated: ${name}`);
  } else {
    console.log(`     🛡️ Skipped (Custom): ${name}`);
  }
}

/**
 * 工具方法：提取节点前置 JSDoc 纯文本（保留用于 pipeline 中的表级 JSDoc 解析）
 * @param node 任意节点（通常是 VariableDeclaration）
 * @returns 纯净的 JSDoc 文本
 */
export function getLeadingJSDocText(node: Node): string {
  // 对于 VariableDeclaration，注释通常在 VariableStatement 上
  let targetNode = node;
  if (Node.isVariableDeclaration(node)) {
    const stmt = node.getVariableStatement();
    if (stmt) targetNode = stmt;
  }

  // 使用 getLeadingCommentRanges 获取紧邻节点的注释
  const ranges = targetNode.getLeadingCommentRanges();

  // 从后往前找，找到最后一个 JSDoc 块（/** ... */）
  for (let i = ranges.length - 1;i >= 0;i--) {
    const range = ranges[i];
    const text = range.getText();

    // 检查是否是 JSDoc 格式 (/** ... */)
    if (text.startsWith("/**")) {
      // 去除注释标记，提取纯文本
      return text
        .replace(/^\/\*\*+/, "")
        .replace(/\*+\/$/, "")
        .replace(/^\s*\*\s*/gm, "")
        .trim();
    }
  }

  return "";
}





/**
 * 🛠️ 智能更新导出常量 (export const Xxx = ...)
 */
export function upsertExportedConst(file: SourceFile,
  name: string,
  initializer: string,
) {
  const varDec = file.getVariableDeclaration(name)

  if (!varDec) {

    // 🔥 核心修复：计算插入位置
    // 找到最后一个 Import 语句的位置，插入到它后面
    const lastImport = file.getImportDeclarations().at(-1);
    // getChildIndex 获取的是节点在当前 SourceFile 子节点列表中的索引
    const insertIndex = lastImport ? lastImport.getChildIndex() + 1 : 0;

    const stmt = file.insertVariableStatement(insertIndex, {
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [{ name, initializer }],
    })

    // 添加 JSDoc 到 Statement 层级
    stmt.addJsDoc(DOC_BLOCK.replace("/**", "").replace("*/", "").trim());
    console.log(`     ➕ Const: ${name}`);
    return;
  }

  // 2. 检查更新
  if (checkIsGenerated(varDec)) {
    // 简单文本对比
    const currentInit = varDec.getInitializer()?.getText().replace(/\s+/g, "");
    const newInit = initializer.replace(/\s+/g, "");

    if (currentInit !== newInit) {
      varDec.setInitializer(initializer);
      console.log(`     🔄 Updated Const: ${name}`);
    }
  } else {
    console.log(`     🛡️ Skipped Const (Custom): ${name}`);
  }
}