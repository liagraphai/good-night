/**
 * Demo 数据 - Day 2 滑杆版
 * 用于一键填充演示数据 & 滑杆配置
 */

// 滑杆配置 - B 用来渲染滑杆 UI
export const SLIDER_CONFIG = {
  emotion: {
    label: "情绪状态",
    color: "#7c5cbf",
    sliders: [
      { key: "calm_excited", left: "平静", right: "激动" },
      { key: "sad_happy", left: "悲伤", right: "开心" },
      { key: "relaxed_stressed", left: "轻松", right: "压力大" }
    ]
  },
  body: {
    label: "身体感受",
    color: "#2d9d8f",
    sliders: [
      { key: "head_clear_heavy", left: "头部清爽", right: "胀痛/沉重" },
      { key: "neck_relaxed_tense", left: "肩颈放松", right: "紧绷" },
      { key: "limbs_warm_weak", left: "温暖有力", right: "冰冷/疲软" }
    ]
  },
  behavior: {
    label: "今日行为",
    color: "#d4845a",
    sliders: [
      { key: "sedentary_active", left: "久坐", right: "运动" },
      { key: "phone_social", left: "刷手机", right: "社交互动" },
      { key: "chaotic_rhythmic", left: "节奏混乱", right: "有节奏" }
    ]
  }
};

// Demo 默认滑杆值（小林案例）
export const DEMO_SLIDER_INPUT = {
  emotion: { calm_excited: 72, sad_happy: 38, relaxed_stressed: 81 },
  body: { head_clear_heavy: 64, neck_relaxed_tense: 82, limbs_warm_weak: 58 },
  behavior: { sedentary_active: 24, phone_social: 18, chaotic_rhythmic: 31 }
};

// Demo 默认语音文本
export const DEMO_VOICE_TEXT = "今天下午开会很烦，晚上胃有点胀，肩颈也紧。回家后刷了很久手机，感觉脑子很累，但脑子又停不下来。";

// Demo 默认可穿戴数据
export const DEFAULT_WEARABLE_DATA = {
  steps: 3200,
  stress: 78,
  heart_rate: 86,
  last_sleep_hours: 5.8
};

// 可穿戴数据字段说明
export const WEARABLE_LABELS = {
  steps: { label: "今日步数", unit: "步", icon: "👟" },
  stress: { label: "压力值", unit: "", icon: "😰" },
  heart_rate: { label: "当前心率", unit: "bpm", icon: "❤️" },
  last_sleep_hours: { label: "昨晚睡眠", unit: "小时", icon: "😴" }
};
