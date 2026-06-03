/**
 * API 调用服务 - Day 2 滑杆版
 */

const API_BASE = '/api';

/**
 * 调用 AI 生成健康洞察
 * @param {Object} input - { voice_reflection_text, slider_input, wearable_data }
 * @returns {Object} { success, data, is_fallback }
 */
export async function fetchInsight(input) {
  try {
    const response = await fetch(`${API_BASE}/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API 调用失败:', error);
    return {
      success: true,
      data: getFrontendFallback(),
      is_fallback: true
    };
  }
}

/**
 * 前端兜底数据（网络完全不通时使用）- Day 2 版
 */
function getFrontendFallback() {
  return {
    one_sentence_summary: "你今天更像是身体已经很累，但脑子还没有完全下班。",
    emotion_weather: "阴天带紧绷",
    body_signals: ["肩颈紧", "腿部不适", "头部沉重"],
    behavior_clues: "今天之前半刷手机较多，可能让睡前更难从高唤起状态降下来。",
    data_clues: "步数偏低、压力值偏高，加上昨晚睡眠不足，今天更适合低唤起收尾。",
    insight: "你的滑杆显示压力偏高、活动偏少，语音里也提到疲惫和肩颈紧。今晚的问题不一定是不想睡，更像是身体已经疲惫，但注意力还在屏幕和白天的事情上。",
    tonight_action: "把手机屏幕扣上，做 90 秒缓慢呼吸，让肩颈先放一点。",
    sleep_closing_script: "今天已经到这里了。你不需要在今晚把所有事情想清楚，也不需要继续证明自己做得够多。先把手机轻轻扣上，让肩颈慢慢放下一点，让腿部也有一点安静的时间。明天的事，明天再来找你。今晚只需要呼吸几次，然后允许自己休息。"
  };
}

/**
 * 调用 Gemini TTS 生成语音
 * @param {string} text - 要朗读的文本
 * @returns {string|null} audio blob URL，失败返回 null
 */
export async function fetchTTS(text) {
  try {
    const response = await fetch(`${API_BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error('TTS 调用失败:', error);
    return null;
  }
}

/**
 * 健康检查
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return await response.json();
  } catch {
    return { status: 'offline' };
  }
}
