# 晚安体感 A Day 2：Prompt v2 与 B/C 协作备注

用途：给 **C 工程/AI** 接入新版大模型接口使用，同时给 **B 前端/UI** 明确结果页和黑屏页需要展示哪些字段。

---

## 1. Prompt v2

```text
你是“晚安体感”的睡前 AI 健康洞察助手。

你的任务不是医疗诊断，也不是心理咨询，而是在用户睡前，根据用户的语音复盘、体感滑杆和可穿戴数据，生成一份简短、温和、生活化的睡前健康洞察，并引导用户进入睡眠状态。

请特别注意：
1. 不要使用诊断性语言，不说“你患有”“你可能得了某病”。
2. 不要给药物建议。
3. 输出要短，适合睡前阅读，总字数控制在 300 字以内。
4. 重点解释“情绪 - 身体 - 行为 - 数据”之间的关系。
5. 不要输出空泛鸡汤，要具体、温和、可执行。
6. 最后只给 1 个今晚可以完成的小动作。
7. 收尾语要适合 30-60 秒语音播放。
8. 如果语音输入为空，也要根据滑杆和数据生成洞察。

用户输入如下：

【语音复盘】
{{voice_reflection_text}}

【情绪滑杆，0代表左端，100代表右端】
- 平静 0 - 激动 100：{{calm_excited}}
- 悲伤 0 - 开心 100：{{sad_happy}}
- 轻松 0 - 压力大 100：{{relaxed_stressed}}

【身体滑杆，0代表左端，100代表右端】
- 头部清爽 0 - 胀痛/沉重 100：{{head_clear_heavy}}
- 肩颈放松 0 - 紧绷 100：{{neck_relaxed_tense}}
- 手脚温暖有力 0 - 冰冷/疲软 100：{{limbs_warm_weak}}

【行为滑杆，0代表左端，100代表右端】
- 久坐 0 - 运动 100：{{sedentary_active}}
- 刷手机 0 - 社交互动 100：{{phone_social}}
- 节奏混乱 0 - 有节奏 100：{{chaotic_rhythmic}}

【可穿戴数据】
{{wearable_data}}

请根据以下规则理解滑杆：
- 0-30：明显偏向左端状态
- 31-69：中间状态或轻微倾向
- 70-100：明显偏向右端状态
- 不要机械复述数值，要把数值转化成生活化洞察
- 如果语音内容和滑杆冲突，优先温和指出“你可能身体上更累/情绪上更紧”，不要质疑用户

请严格返回 JSON，格式如下：

{
  "one_sentence_summary": "用一句话总结今晚的整体体感",
  "emotion_weather": "用一个短语描述今天的情绪天气",
  "body_signals": ["身体信号1", "身体信号2", "身体信号3"],
  "behavior_clues": "用一句话总结今日行为和睡前状态的关系",
  "data_clues": "用一句话解释可穿戴数据透露的生活化线索",
  "insight": "用2-3句话总结情绪、身体、行为和数据之间的关系",
  "tonight_action": "今晚只做一个低负担小动作",
  "sleep_closing_script": "一段30-60秒睡前收尾语，语气温和，帮助用户放下今天"
}
```

---

## 2. 新版输入字段

```json
{
  "voice_reflection_text": "今天下午开会很烦，晚上胃有点胀，肩颈也紧。回家后刷了很久手机，感觉明明很累，但脑子停不下来。",
  "slider_input": {
    "emotion": {
      "calm_excited": 72,
      "sad_happy": 38,
      "relaxed_stressed": 81
    },
    "body": {
      "head_clear_heavy": 64,
      "neck_relaxed_tense": 82,
      "limbs_warm_weak": 58
    },
    "behavior": {
      "sedentary_active": 24,
      "phone_social": 18,
      "chaotic_rhythmic": 31
    }
  },
  "wearable_data": {
    "steps": 3200,
    "stress": 78,
    "heart_rate": 86,
    "last_sleep_hours": 5.8
  }
}
```

---

## 3. 输出字段说明

| 字段 | B 前端展示用途 | C 工程处理要求 |
|---|---|---|
| `one_sentence_summary` | 结果页顶部“今晚体感一句话” | 必须短，适合做主标题下方说明 |
| `emotion_weather` | 情绪天气卡片 | 短语，不要超过 10 个字 |
| `body_signals` | 身体信号列表 | 数组，建议 2-3 个 |
| `behavior_clues` | 行为线索卡片 | 一句话解释久坐、刷手机、节奏等与睡前状态的关系 |
| `data_clues` | 数据线索卡片 | 生活化解释数据，不做医疗判断 |
| `insight` | 核心洞察卡片 | 2-3 句话，关联情绪、身体、行为、数据 |
| `tonight_action` | 今晚微行动卡片 | 只给 1 个动作，低负担、可立即执行 |
| `sleep_closing_script` | 黑屏睡眠模式文本/TTS | 不在黑屏页二次请求 AI，直接读取该字段 |

---

## 4. 交给 B 前端/UI 怎么做

1. 结果页新增 `one_sentence_summary`，放在顶部作为“今晚 AI 发现”。
2. 结果页保留短卡片结构，重点展示：
   - 情绪天气：`emotion_weather`
   - 身体信号：`body_signals`
   - 行为线索：`behavior_clues`
   - 数据线索：`data_clues`
   - 今晚微行动：`tonight_action`
3. `insight` 可以作为结果页主洞察文字，建议控制在 2-3 行展示。
4. 黑屏页读取 `sleep_closing_script`，不展示其它复杂卡片。
5. 滑杆页提交字段名必须和新版输入结构一致，方便 C 直接接入。

---

## 5. 交给 C 工程/AI 怎么做

1. 接口仍建议使用：

```text
POST /api/insight
```

2. 请求体从 Day 1 标签数组改为新版 `slider_input`。
3. 滑杆值直接按 0-100 传给模型，不要在前置逻辑里强行转标签。
4. 需要做 JSON 解析和兜底：
   - AI 返回合法 JSON：直接传给前端。
   - AI 返回非 JSON：尝试提取 JSON。
   - 字段缺失、超时或解析失败：返回新版 fallback mock。
5. AI 输出必须避免医疗诊断、药物建议和过度心理咨询。
6. 用户语音为空时，也要根据滑杆和可穿戴数据生成洞察。

---

## 6. 新版 fallback mock

```json
{
  "one_sentence_summary": "你今晚更像是身体已经很累，但脑子还没有完全下班。",
  "emotion_weather": "阴天偏紧绷",
  "body_signals": ["肩颈紧", "胃部不适", "头部沉重"],
  "behavior_clues": "今天久坐和刷手机偏多，可能让睡前更难从高刺激状态降下来。",
  "data_clues": "步数偏低、压力值偏高，加上昨晚睡眠不足，今晚更适合低刺激收尾。",
  "insight": "你的滑杆显示压力偏高、活动偏少，语音里也提到胃胀和肩颈紧。今晚的问题不一定是“不想睡”，更像是身体已经疲惫，但注意力还停在屏幕和白天的事情上。",
  "tonight_action": "把手机屏幕扣下，做 90 秒缓慢呼吸，让肩颈先松一点。",
  "sleep_closing_script": "今天已经到这里了。你不需要在今晚把所有事情想清楚，也不需要继续证明自己做得够多。先把手机轻轻扣下，让肩颈慢慢松一点，让胃部也有一点安静的时间。明天的事，明天再接住。今晚只需要呼吸几次，然后允许自己休息。"
}
```

---

## 7. B/C 联调检查清单

- 前端是否提交 `voice_reflection_text`、`slider_input`、`wearable_data`。
- `slider_input` 是否保留 emotion/body/behavior 三层结构。
- C 返回字段是否包含新版 8 个字段。
- 结果页是否能展示 `one_sentence_summary` 和 `behavior_clues`。
- 黑屏页是否直接读取 `sleep_closing_script`。
- AI 超时或解析失败时是否能返回新版 fallback mock。
