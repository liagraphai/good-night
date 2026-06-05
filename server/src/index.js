import dotenv from 'dotenv';
dotenv.config();

// 代理支持：如果配了 HTTPS_PROXY，用 undici ProxyAgent 覆盖全局 fetch
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrl) {
  const { ProxyAgent, setGlobalDispatcher } = await import('undici');
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
  console.log(`🌐 代理已启用: ${proxyUrl}`);
}

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { insightRouter } from './routes/insight.js';
import { ttsRouter } from './routes/tts.js';
import { serialRouter } from './routes/serial.js';
import { serialService } from './services/serial.js';
import { initHardwareFlow } from './services/hardware-flow.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api', insightRouter);
app.use('/api', ttsRouter);
app.use('/api', serialRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.MODE || 'mock',
    device: serialService.connected ? 'connected' : 'disconnected',
  });
});

// 生产环境：提供 React 静态文件
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));

  // SPA fallback：非 API 路由返回 index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🌙 晚安体感后端已启动: http://localhost:${PORT}`);
  console.log(`📡 模式: ${process.env.MODE || 'mock'}`);

  // 启动串口服务（非阻塞，连不上会自动重试）
  serialService.start();

  // 初始化硬件触发 AI 流程（按键→AI→屏幕显示）
  initHardwareFlow();
});
