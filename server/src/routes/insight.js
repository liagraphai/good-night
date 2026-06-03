import { Router } from 'express';
import { generateInsight } from '../services/ai.js';

export const insightRouter = Router();

/**
 * POST /api/insight（Day 2 版本）
 *
 * 请求体：
 * {
 *   voice_reflection_text: string,        // 语音转文字，可为空
 *   slider_input: {
 *     emotion: { calm_excited, sad_happy, relaxed_stressed },
 *     body: { head_clear_heavy, neck_relaxed_tense, limbs_warm_weak },
 *     behavior: { sedentary_active, phone_social, chaotic_rhythmic }
 *   },
 *   wearable_data: { steps, stress, heart_rate, last_sleep_hours }
 * }
 *
 * 返回：
 * {
 *   success: boolean,
 *   data: {
 *     one_sentence_summary, emotion_weather, body_signals,
 *     behavior_clues, data_clues, insight,
 *     tonight_action, sleep_closing_script
 *   },
 *   is_fallback: boolean
 * }
 */
insightRouter.post('/insight', async (req, res) => {
  try {
    const {
      voice_reflection_text,
      slider_input,
      wearable_data
    } = req.body;

    // 基础校验：滑杆数据必须存在（语音可为空）
    if (!slider_input || !slider_input.emotion || !slider_input.body || !slider_input.behavior) {
      return res.status(400).json({
        success: false,
        error: '请至少完成滑杆输入（emotion / body / behavior）'
      });
    }

    const result = await generateInsight({
      voice_reflection_text: voice_reflection_text || '',
      slider_input,
      wearable_data: wearable_data || {}
    });

    res.json(result);
  } catch (error) {
    console.error('❌ /api/insight 错误:', error.message);
    res.status(500).json({
      success: false,
      error: '服务暂时不可用，请重试'
    });
  }
});
