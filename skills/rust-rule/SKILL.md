---
name: rust-rule
description: 使用rust 需要记住的一些规则
---




## 禁止

- 不要写重复代码

```rust
#[tauri::command]
fn get_default_save_dir() -> Result<String, String> {
    aha::utils::get_default_save_dir().ok_or_else(|| "无法获取 home 目录".to_string())
}

fn get_save_dir() -> Result<String, String> {
    aha::utils::get_default_save_dir().ok_or_else(|| "无法获取 home 目录".to_string())
}
```


## 榜样

```rust
#[tauri::command]
#[tauri::command]
fn get_save_dir() -> Result<String, String> {
    aha::utils::get_default_save_dir().ok_or_else(|| "无法获取 home 目录".to_string())
}
```
