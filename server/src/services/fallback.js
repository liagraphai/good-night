/**
 * Fallback Mock 数据（Day 2 新版）
 *
 * 当 AI 超时、失败、返回非 JSON 时使用
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
