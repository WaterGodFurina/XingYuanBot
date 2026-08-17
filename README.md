# 🌟 XingYuanBot（星缘机器人）

一个基于 Node.js 的轻量级 QQ 机器人框架，支持 NapCat / LLOneBot 协议端连接，内置灵活的权限管理系统和插件扩展机制。

## 反馈方式
- 私聊反馈
- 电子邮箱：m1536_adjs318inp@aka.yeah.net
- QQ反馈：3381673433

- 公开反馈
- QQ群反馈：1026165109
- Issues中进行反馈

## ✨ 功能特性

- 📡 支持 NapCat、LLOneBot 协议端连接
- 🔐 多级权限管理（大主人 / 小主人 / 管理员 / 普通成员）
- 🔌 插件化架构，轻松扩展功能，插件直接放xy-plugins下，先写rule.json，再写index.js或者script.py（随便选，只要能够作为启动或者入口文件即可），最好还是按照插件启动，文件里面的要求填写
这是一个rule.json的配置示例：
```
{
  "name": "系统指令",
  "type": "command",
  "prefix": ["#", "/"],
  "keywords": ["退出", "重启", "状态", "帮助", "权限"],
  "entry": "index.js"
}
```
- 💾 基于 Redis 的数据存储(暂不支持)

## 🚀 快速开始

### 环境要求

- 暂时只支持windows系统
- Node.js 18+
- Redis 数据库（不需要，待开发中，仅作为后续选择）
- NapCat / LLOneBot 协议端
- python 3X（仅运行环境要求）

### 安装步骤

克隆仓库
```
国内用户使用这个
git clone https://gitee.com/starry-language/XingYuanBot.git
cd XingYuanBot

国外用户使用这个
git clone https://github.com/xingyuanbianyu/XingYuanBot.git
cd XingYuanBot

GitCode用户使用这个
git clone https://gitcode.com/xingyuan3739/XingYuanBot.git
cd XingYuanBot
```
### 安装依赖
```
pnpm install
```
### 配置与启动

- 进入  xy-config/config  目录，复制  config.yaml.example  为  config.yaml ，并填入你的 QQ 号。
将QQ替换为你的QQ号，其他的可以暂时不设置
大致如下，需要以下内容
```
"你要设置成大主人的QQ号": true
"你要设置成小主人的QQ号": false
"你要设置成管理员的QQ号": null
```
以上配置只是示例，可以随便填一串数字，但不要填空

### 运行主程序：
```
# 方式一：标准启动（推荐）
node app.js

# 方式二：带自动重启守护（需 Python 环境）
python script.py
```
这是使用pnpm进行启动
```
pnpm app或者pnpm run app
则执行node app
pnpm py或者pnpm run py
则执行python script.py
```
### 端口设计

- 3001 ws反向
- 3000 http服务端
- 3002 http服务端

### 端口介绍
- 3001 用于ws链接XingYuan-Bot
- 3000 该端口为发送消息设计
- 3002：群管专用接口（处理禁言、踢人等指令）

### 📅 开发计划 (Roadmap)

- 基础消息监听与回复
- 权限管理系统
- Redis / SQLite 数据持久化支持
- 更多实用插件(签到、群管等)

### 已优化点
- 优化了重启逻辑
```
优化了重启指令的执行逻辑，并且启动一个脚本杀掉占用端口进程，并且重开一个窗口终端，该脚本为根目录里面的script.py文件，需要python环境
```
- 添加了禁言、踢人、解禁功能
```
尚未上传完整代码，请勿使用
```
- 优化了菜单卡片
```
优化了帮助菜单，从静态卡片变成了动态卡片，只需要修改menu.json文件
```
- 待上传的优化
