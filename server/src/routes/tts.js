import { Router } from 'express';
import { generateSpeech } from '../services/tts.js';

export const ttsRouter = Router();

/**
 * POST /api/tts
 * 请求体：{ text: string }
 * 返回：音频文件
 */
ttsRouter.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: '请提供要朗读的文本'
      });
    }

    const { buffer, contentType } = await generateSpeech(text);

    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length
    });
    res.send(buffer);
  } catch (error) {
    console.error('❌ /api/tts 错误:', error.message);
    res.status(500).json({
      success: false,
      error: 'TTS 服务暂时不可用'
    });
  }
});
