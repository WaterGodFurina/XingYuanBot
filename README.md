# 🌟 XingYuanBot（星缘机器人）

一个基于 Node.js 的轻量级 QQ 机器人框架，支持 NapCat / LLOneBot 协议端连接，内置灵活的权限管理系统和插件扩展机制。

## ✨ 功能特性

- 📡 支持 NapCat、LLOneBot 协议端连接
- 🔐 多级权限管理（大主人 / 小主人 / 管理员 / 普通成员）
- 🔌 插件化架构，轻松扩展功能
- 💾 基于 Redis 的数据存储(暂不支持)

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Redis 数据库（不需要，待开发中）
- NapCat / LLOneBot 协议端

### 安装步骤

克隆仓库
```
git clone https://gitee.com/starry-language/xing-yuan-bot.git
cd XingYuanBot
```
### 安装依赖
```
pnpm install
```
### 配置与启动

- 复制  config.yaml.example  为  config.yaml  并填入你的 QQ 号进行权限配置。

### 运行主程序：
```
node index.js
```
### 端口设计

- 3001 ws反向
- 3000 http服务端
- 3002 http服务端

### 端口介绍
- 3001 由ws链接XingYuan-Bot
- 3000 该端口为发送消息设计
- 3002 调用三个群管功能进行设计

### 📅 开发计划 (Roadmap)

- 基础消息监听与回复
- 权限管理系统
- Redis / SQLite 数据持久化支持
- 更多实用插件(签到、群管等)

### 已优化点
- 优化了重启逻辑
- 添加了禁言、踢人、解禁功能
- 优化了菜单卡片
