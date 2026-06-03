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
import { insightRouter } from './routes/insight.js';
import { ttsRouter } from './routes/tts.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', insightRouter);
app.use('/api', ttsRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: process.env.MODE || 'mock' });
});

app.listen(PORT, () => {
  console.log(`🌙 晚安体感后端已启动: http://localhost:${PORT}`);
  console.log(`📡 模式: ${process.env.MODE || 'mock'}`);
});
