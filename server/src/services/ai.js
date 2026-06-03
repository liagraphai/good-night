import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { FALLBACK_MOCK } from './fallback.js';
import { buildPrompt } from './prompt.js';

dotenv.config();

const TIMEOUT_MS = 30000; // 30秒超时

/**
 * 输出 JSON Schema — 由 Gemini responseSchema 强制保证格式
 * Prompt 不再需要操心 JSON 结构，只管创意内容
 */
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    one_sentence_summary: {
      type: Type.STRING,
      description: '一句有画面感的话总结今晚整体体感，15-30字'
    },
    emotion_weather: {
      type: Type.STRING,
      description: '用具体画面描述情绪天气，8-20字'
    },
    body_signals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1-5个身体信号关键词'
    },
    behavior_clues: {
      type: Type.STRING,
      description: '2-3句话描述行为如何影响了当前状态，有具体场景，50-100字'
    },
    data_clues: {
      type: Type.STRING,
      description: '2-3句话把数据翻译成生活故事，有比喻和细节，50-100字'
    },
    insight: {
      type: Type.STRING,
      description: '3-5句话串联所有线索的核心洞察，有因果逻辑和具体细节，80-150字'
    },
    tonight_action: {
      type: Type.STRING,
      description: '一个具体小动作，包含姿势、感受和时长描述，30-60字'
    },
    sleep_closing_script: {
      type: Type.STRING,
      description: '30-60秒睡前收尾语，有画面感和节奏感，150-250字'
    }
  },
  required: [
    'one_sentence_summary', 'emotion_weather', 'body_signals',
    'behavior_clues', 'data_clues', 'insight',
    'tonight_action', 'sleep_closing_script'
  ]
};

/**
 * 生成健康洞察（核心函数）
 *
 * MODE=mock → 返回 fallback mock 数据
 * MODE=ai  → 调用 Gemini API
 */
export async function generateInsight(input) {
  const mode = process.env.MODE || 'mock';

  if (mode === 'mock') {
    await delay(1000);
    return {
      success: true,
      data: FALLBACK_MOCK,
      is_fallback: true
    };
  }

  // MODE=ai: 调用 Gemini API
  try {
    const result = await callGeminiWithTimeout(input);
    return {
      success: true,
      data: result,
      is_fallback: false
    };
  } catch (error) {
    console.error('⚠️ AI 调用失败，使用 fallback:', error.message);
    return {
      success: true,
      data: FALLBACK_MOCK,
      is_fallback: true
    };
  }
}

/**
 * 调用 Gemini API（带超时）
 */
async function callGeminiWithTimeout(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API Key 未配置');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = buildPrompt(input);

  // 带超时的请求
  const response = await Promise.race([
    ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA
      }
    }),
    timeoutPromise(TIMEOUT_MS)
  ]);

  const text = response.text;

  // responseSchema 已保证输出合法 JSON，直接解析
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (e) {
    // 防御性：万一解析失败，尝试提取
    return parseAIResponse(text);
  }
}

/**
 * 防御性解析（正常情况下不会走到这里）
 */
function parseAIResponse(text) {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1].trim()); } catch (e) { /* */ }
  }

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch (e) { /* */ }
  }

  throw new Error('无法从 AI 响应中解析出有效 JSON');
}

/**
 * 超时 Promise
 */
function timeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`请求超时 (${ms}ms)`)), ms);
  });
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
