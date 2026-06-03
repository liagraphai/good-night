/**
 * 晚安体感 - 核心数据结构定义（Day 2：滑杆版）
 * B 前端和 C 后端共用，保证字段名一致
 */

// ============ 输入结构 ============

/**
 * 用户输入数据结构（Day 2）
 * 前端 POST /api/insight 时提交此结构
 *
 * 变更：Day 1 标签数组 → Day 2 滑杆数值（0-100）
 */
export const INPUT_EXAMPLE = {
  voice_reflection_text: "今天下午开会很烦，晚上胃有点胀，肩颈也紧。回家后刷了很久手机，感觉脑子很累，但脑子又停不下来。",
  slider_input: {
    emotion: {
      calm_excited: 72,       // 平静 0 - 激动 100
      sad_happy: 38,          // 悲伤 0 - 开心 100
      relaxed_stressed: 81    // 轻松 0 - 压力大 100
    },
    body: {
      head_clear_heavy: 64,   // 头部清爽 0 - 胀痛/沉重 100
      neck_relaxed_tense: 82, // 肩颈放松 0 - 紧绷 100
      limbs_warm_weak: 58     // 四肢温暖有力 0 - 冰冷/疲软 100
    },
    behavior: {
      sedentary_active: 24,   // 久坐 0 - 运动 100
      phone_social: 18,       // 刷手机 0 - 社交互动 100
      chaotic_rhythmic: 31    // 节奏混乱 0 - 有节奏 100
    }
  },
  wearable_data: {
    steps: 3200,
    stress: 78,
    heart_rate: 86,
    last_sleep_hours: 5.8
  }
};

// ============ 输出结构 ============

/**
 * AI 输出数据结构（Day 2）
 * 后端返回此结构给前端展示
 *
 * 新增字段：one_sentence_summary, behavior_clues
 */
export const OUTPUT_EXAMPLE = {
  one_sentence_summary: "你今天更像是身体已经很累，但脑子还没有完全下班。",
  emotion_weather: "阴天带紧绷",
  body_signals: ["肩颈紧", "腿部不适", "头部沉重"],
  behavior_clues: "今天之前半刷手机较多，可能让睡前更难从高唤起状态降下来。",
  data_clues: "步数偏低、压力值偏高，加上昨晚睡眠不足，今天更适合低唤起收尾。",
  insight: "你的滑杆显示压力偏高、活动偏少，语音里也提到疲惫和肩颈紧。今晚的问题不一定是「不想睡」，更像是身体已经疲惫，但注意力还在屏幕和白天的事情上。",
  tonight_action: "把手机屏幕扣上，做 90 秒缓慢呼吸，让肩颈先放一点。",
  sleep_closing_script: "今天已经到这里了。你不需要在今晚把所有事情想清楚，也不需要继续证明自己做得够多。先把手机轻轻扣上，让肩颈慢慢放下一点，让腿部也有一点安静的时间。明天的事，明天再来找你。今晚只需要呼吸几次，然后允许自己休息。"
};

// ============ 滑杆配置 ============

/**
 * 9 个滑杆定义 - B 用来渲染滑杆 UI，C 用来构建 Prompt
 */
export const SLIDER_CONFIG = {
  emotion: {
    label: "情绪状态",
    color: "blue-purple",
    sliders: [
      { key: "calm_excited", left: "平静", right: "激动" },
      { key: "sad_happy", left: "悲伤", right: "开心" },
      { key: "relaxed_stressed", left: "轻松", right: "压力大" }
    ]
  },
  body: {
    label: "身体感受",
    color: "teal-orange",
    sliders: [
      { key: "head_clear_heavy", left: "头部清爽", right: "胀痛/沉重" },
      { key: "neck_relaxed_tense", left: "肩颈放松", right: "紧绷" },
      { key: "limbs_warm_weak", left: "温暖有力", right: "冰冷/疲软" }
    ]
  },
  behavior: {
    label: "今日行为",
    color: "warm-yellow",
    sliders: [
      { key: "sedentary_active", left: "久坐", right: "运动" },
      { key: "phone_social", left: "刷手机", right: "社交互动" },
      { key: "chaotic_rhythmic", left: "节奏混乱", right: "有节奏" }
    ]
  }
};

// ============ 模拟可穿戴数据 ============

/**
 * 默认可穿戴数据（Demo 用）
 */
export const DEFAULT_WEARABLE_DATA = {
  steps: 3200,
  stress: 78,
  heart_rate: 86,
  last_sleep_hours: 5.8
};

// ============ Fallback Mock ============

/**
 * AI 失败/超时时的兜底数据（Day 2 新版）
 * 数据来源：A 的 Day 2 Demo 测试用例中的 expected_output_direction
 */
export const FALLBACK_MOCK = {
  one_sentence_summary: "你今天更像是身体已经很累，但脑子还没有完全下班。",
  emotion_weather: "阴天带紧绷",
  body_signals: ["肩颈紧", "腿部不适", "头部沉重"],
  behavior_clues: "今天之前半刷手机较多，可能让睡前更难从高唤起状态降下来。",
  data_clues: "步数偏低、压力值偏高，加上昨晚睡眠不足，今天更适合低唤起收尾。",
  insight: "你的滑杆显示压力偏高、活动偏少，语音里也提到疲惫和肩颈紧。今晚的问题不一定是「不想睡」，更像是身体已经疲惫，但注意力还在屏幕和白天的事情上。",
  tonight_action: "把手机屏幕扣上，做 90 秒缓慢呼吸，让肩颈先放一点。",
  sleep_closing_script: "今天已经到这里了。你不需要在今晚把所有事情想清楚，也不需要继续证明自己做得够多。先把手机轻轻扣上，让肩颈慢慢放下一点，让腿部也有一点安静的时间。明天的事，明天再来找你。今晚只需要呼吸几次，然后允许自己休息。"
};
