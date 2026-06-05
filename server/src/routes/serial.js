/**
 * M5Stack 串口通信 API 路由
 *
 * GET  /api/device/status   — 设备连接状态
 * GET  /api/device/sensor   — 最新传感器数据
 * GET  /api/device/wearable — 转换为 wearable_data 格式（替代 mock）
 * POST /api/device/command  — 向设备发送指令
 */

import { Router } from 'express';
import { serialService } from '../services/serial.js';
import { handleGoodnightTrigger } from '../services/hardware-flow.js';

export const serialRouter = Router();

// 设备状态
serialRouter.get('/device/status', (req, res) => {
  res.json(serialService.getStatus());
});

// 最新传感器原始数据
serialRouter.get('/device/sensor', (req, res) => {
  const data = serialService.getLatest();
  if (!data) {
    return res.status(503).json({ error: '暂无传感器数据', connected: serialService.connected });
  }
  res.json(data);
});

// 转换为 wearable 格式（供 insight API 使用）
serialRouter.get('/device/wearable', (req, res) => {
  const wearable = serialService.toWearableData();
  if (!wearable) {
    return res.status(503).json({ error: '设备未就绪', connected: serialService.connected });
  }
  res.json(wearable);
});

// 向设备发送指令
serialRouter.post('/device/command', (req, res) => {
  const { action, text } = req.body;

  if (!action) {
    return res.status(400).json({ error: '缺少 action 字段' });
  }

  let success = false;
  switch (action) {
    case 'show_insight':
      success = serialService.showInsight(text || '');
      break;
    case 'goodnight_mode':
      success = serialService.goodnightMode(text);
      break;
    case 'reset':
      success = serialService.resetDevice();
      break;
    default:
      success = serialService.send({ type: 'cmd', action, text });
  }

  res.json({ success, action });
});

// 手动触发晚安流程（模拟按键，方便测试/前端调用）
serialRouter.post('/device/goodnight', async (req, res) => {
  try {
    const result = await handleGoodnightTrigger();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
