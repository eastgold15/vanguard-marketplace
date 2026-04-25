---
name: neverthrow
description: 利用 neverthrow 库实现类型安全的错误处理，通过 Result 和 ResultAsync 模式替代传统的 try-catch，构建健壮且可预测的代码流
---

# neverthrow 错误处理专家
永运不使用try catch，使用neverthrow库处理错误的错误


## When to use
- 当需要抛出错误的时候使用neverthrow库

#### 1. 核心概念
- **拒绝异常**：不使用 `throw` 和 `try-catch`，防止程序崩溃并强制处理错误。
- **两种状态**：
  - `Ok<T>`：代表操作成功，包含结果数据。
  - `Err<E>`：代表操作失败，包含错误信息。
- **异步支持**：`ResultAsync` 包装了 `Promise<Result<T, E>>`，允许在不 `await` 的情况下链式调用。

#### 2. 同步操作 (Result)
用于处理不涉及异步操作的逻辑。

| 方法 | 用途 | 代码示例 |
| :--- | :--- | :--- |
| **`ok(value)` / `err(error)`** | 创建 Result 实例 | `return ok({ id: 1, name: 'John' });` |
| **`.map(fn)`** | 只有成功时才执行转换 | `.map(user => user.name)` |
| **`.mapErr(fn)`** | 只有失败时才转换错误 | `.mapErr(err => 'Network Error')` |
| **`.andThen(fn)`** | 链式调用下一个可能失败的函数 | `.andThen(sendEmail)` |
| **`.orElse(fn)`** | 错误恢复机制 | `.orElse(() => ok(defaultUser))` |
| **`.match(success, failure)`** | 模式匹配，最终消费 Result | `.match(data => console.log(data), err => alert(err))` |

#### 3. 异步操作 (ResultAsync)
用于处理 Promise 或异步任务（如 API 调用）。

| 方法 | 用途 | 代码示例 |
| :--- | :--- | :--- |
| **`okAsync(value)` / `errAsync(error)`** | 创建异步 Result 实例 | `return okAsync(fetchData());` |
| **`ResultAsync.fromPromise(promise, handler)`** | 包装普通 Promise | `ResultAsync.fromPromise(apiCall(), mapError)` |
| **`.andThen(asyncFn)`** | 链式调用异步函数 | `.andThen(db.save)` |
| **`.unwrapOr(default)`** | 解包结果或使用默认值 | `const data = await resultAsync.unwrapOr([]);` |

#### 4. 高级组合
- **`Result.combine([...])`**：
  - 类似于 `Promise.all`。
  - 所有结果都为 `Ok` 时返回 `Ok` 数组；任意一个为 `Err` 则立即返回该错误（短路）。
- **`Result.combineWithAllErrors([...])`**：
  - 收集所有错误，不进行短路，适合表单验证等场景。
- **`safeTry`**：
  - 使用生成器函数（Generator）语法，允许在同步或异步代码中使用 `yield*` 来“暂停”并自动处理错误，减少样板代码。

#### 5. 最佳实践
1.  **安装依赖**：`bun install neverthrow`
2.  **错误映射**：在边界处（如数据库调用、API 请求）使用 `fromThrowable` 或 `fromPromise` 将未知错误映射为已知的业务错误类型。

**适用场景**：复杂的业务逻辑流水线、需要精确类型推断的 TypeScript 项目、希望消除运行时异常的 Node.js 或前端应用。