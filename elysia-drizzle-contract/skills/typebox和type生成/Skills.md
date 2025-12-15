---
name: 根据schema生成统一格式的typebox
description: 根据统一dirzzle-orm的schema文件生成固定格式的typebox类型文件
---

# 根据schema生成统一格式的typebox

## Instructions

寻找schema文件，根据schema文件生成固定结构typebox类型文件
- 关键字：Insert、UpdateBase、Select、Create、Update、Entity、Patch、BusinessQuery
- 统一返回同名的schema和type ，[实体名字]TModel
- 根据api接口组合不同实体生成需要的elysia接口schema

每个实体一个model文件，使用drizzle-typebox库，生成Insert、UpdateBase、Select基础类型定义，
在这些基础之上生成Create、Update、Entity、Patch。业务查询使用BusinessQuery根据业务需求组合不同实体的model生成api接口需要的请求schema，
记住不要接口返回schema。最后统一使用[实体名字]TModel统一导处schema和type

## 依赖
- drizzle-typebox
- dirzzle-orm 的实体
- elysia

## Examples
广告实体示例：[链接文字](./Examples.md)
