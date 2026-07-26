# 68HUB Web Server Edition

**OpenCode Go 用量统计面板 —— 纯 Web 部署版本**

> 基于 [68hub (evanfu0110/68hub)](https://github.com/evanfu0110/68hub) 改造，移除 Electron 桌面端依赖，改为 Linux Web 服务部署。

---

## 功能

| 页面 | 说明 |
|------|------|
| 📊 **用量总览** | 账户数量、剩余配额、总 Token 消耗一目了然；5h/7d/30d 配额进度条，Top 3 模型 Input/Output 环形图 |
| 📈 **Token 统计** | 模型 Token 消耗排名（堆叠柱状图）+ 各模型每日趋势（多系列折线图），支持按账户和时间范围筛选 |
| 📅 **每日趋势** | 每日费用与请求量折线图，支持按账户和时间范围筛选 |
| 📋 **使用记录** | 完整的使用记录日志，支持分页和账户筛选 |
| ⚙️ **设置** | 多账户管理（新增/测试/同步/回填/删除），自动同步开关与间隔设置 |
| 🌐 **中英双语** | 可切换中文/English |
| 🌙 **暗色模式** | 浅色/深色/跟随系统 |

## 快速开始

### 方式一：Docker 部署（推荐）

```bash
# 克隆仓库
git clone https://github.com/1chenmm/68hub-web.git
cd 68hub-web

# 构建并启动
docker compose up -d --build

# 访问 http://localhost:8788
```

首次启动后，在"设置"页面添加你的 OpenCode Go 账户（填入 auth cookie），然后点击"同步"开始拉取数据。

### 方式二：直接部署（需要 Node.js 20+）

```bash
# 安装依赖
pnpm install

# 构建前端 + 编译后端
pnpm build

# 启动服务
pnpm start

# 或指定监听地址和端口
68BACKEND_LISTEN_HOST=0.0.0.0 68BACKEND_LISTEN_PORT=8788 pnpm start
```

### 方式三：开发模式

```bash
# 安装依赖
pnpm install

# 启动前端 Vite + 后端（热重载）
pnpm dev
```

## Systemd 服务

```bash
# 部署到指定目录
sudo mkdir -p /opt/68hub
sudo cp -r * /opt/68hub/
cd /opt/68hub && pnpm install && pnpm build

# 安装服务
sudo cp 68hub.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now 68hub
```

## 配置

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `68BACKEND_DATA` | 数据目录（SQLite 存储位置） | `./data` |
| `68BACKEND_LISTEN_HOST` | 监听地址 | `0.0.0.0` |
| `68BACKEND_LISTEN_PORT` | 监听端口 | `8788` |
| `VITE_API_BASE` | 前端 API 地址（开发时需填写后端地址，如 `http://127.0.0.1:8788`） | 空（同源） |

### 从配置文件导入账户

在数据目录放置 `config.json` 可自动导入账户（仅首次启动时）：

```json
{
  "opencode_accounts": [
    {
      "name": "My Account",
      "workspace_id": "Default",
      "auth_cookie": "auth=your_auth_cookie_here"
    }
  ]
}
```

## 技术栈

| 前端 | 后端 | 部署 |
|------|------|------|
| React 18 | Hono + better-sqlite3 | Docker / systemd |
| Vite 5 + Tailwind 4 | TypeScript | Node.js 20+ |
| daisyUI 5 + Recharts | zod | Linux |

## 致谢

- [68hub](https://github.com/evanfu0110/68hub) — 桌面版原始项目
- [OpenCode](https://opencode.ai) — API 提供商

## License

MIT
