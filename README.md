# 🌙 晚安体感

> 睡前 AI 健康洞察助手 MVP

通过语音、标签和可穿戴数据，在睡前生成一份 1 分钟身心健康洞察，并引导用户进入睡眠模式。

## 快速启动

```bash
# 1. 安装所有依赖
npm run install:all

# 2. 同时启动前后端
npm run dev
```

或者分别启动：

```bash
# 后端（端口 3001）
cd server && npm run dev

# 前端（端口 5173）
cd client && npm run dev
```

启动后访问：http://localhost:5173

## 项目结构

```
goodnight-feelings/
├── client/              # React 前端（Vite）
│   ├── src/
│   │   ├── pages/       # 6 个页面组件
│   │   ├── services/    # API 调用、localStorage、Demo 数据
│   │   ├── App.jsx      # 主应用（页面路由 + 状态管理）
│   │   └── App.css      # 暗色低刺激样式
│   └── index.html
├── server/              # Node.js 后端（Express）
│   ├── src/
│   │   ├── routes/      # API 路由
│   │   ├── services/    # AI 服务、Prompt、Fallback
│   │   └── index.js     # 入口
│   └── .env             # 环境变量（MODE=mock/ai）
├── shared/              # 共享数据结构
│   └── types.js         # 输入输出 Schema、标签、Mock 数据
├── API_DOC.md           # 给 B 的接口文档
└── README.md
```

## 当前状态

- [x] 项目骨架搭建完成
- [x] Mock API 可用（POST /api/insight）
- [x] 前端 6 页面骨架完成
- [x] 数据结构定义完成
- [x] Gemini AI 接口占位（Day 2 接入）
- [x] localStorage 存储
- [x] 前后端双层 Fallback 兜底
- [ ] 真实 AI 调用（Day 2）
- [ ] TTS 语音播放优化（Day 2）
- [ ] UI 细节打磨（Day 3）

## 环境变量

复制 `server/.env.example` 为 `server/.env`，配置：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `GEMINI_API_KEY` | Gemini API Key | 需填入 |
| `PORT` | 后端端口 | 3001 |
| `MODE` | mock / ai | mock |

## 技术栈

- **前端**：React + Vite
- **后端**：Node.js + Express
- **AI**：Google Gemini API
- **存储**：localStorage
- **TTS**：Web Speech API
