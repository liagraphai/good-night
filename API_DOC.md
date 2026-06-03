# 晚安体感 - API 接口文档（给 B 前端对接用）

## 基础信息

| 项目 | 值 |
|------|-----|
| 后端地址 | `http://localhost:3001` |
| 前端地址 | `http://localhost:5173`（Vite 默认） |
| 代理配置 | 前端已配置 `/api` 代理到后端，B 直接调 `/api/insight` 即可 |

---

## 接口：生成健康洞察

### `POST /api/insight`

#### 请求体

```json
{
  "text_input": "今天下午开会很烦，晚上胃有点胀，肩颈也紧。",
  "emotion_tags": ["烦躁", "压力大"],
  "body_tags": ["胃不舒服", "肩颈紧", "身体很累"],
  "behavior_tags": ["久坐", "刷手机很久", "晚饭太晚"],
  "sleep_state_tags": ["脑子停不下来", "躺到床还在刷", "想快速结束今天"],
  "wearable_data": {
    "steps": 3200,
    "stress": 78,
    "heart_rate": 86,
    "last_sleep_hours": 5.8
  }
}
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `text_input` | string | 二选一 | 用户自然语言输入 |
| `emotion_tags` | string[] | 二选一 | 情绪标签 |
| `body_tags` | string[] | 否 | 身体感受标签 |
| `behavior_tags` | string[] | 否 | 今日行为标签 |
| `sleep_state_tags` | string[] | 否 | 睡前状态标签 |
| `wearable_data` | object | 否 | 可穿戴模拟数据 |

> `text_input` 和 `emotion_tags` 至少填一个，否则返回 400。

#### 成功响应

```json
{
  "success": true,
  "data": {
    "emotion_weather": "阴天转多云",
    "body_signals": ["胃部不适", "肩颈紧", "身体疲惫"],
    "data_clues": "今天步数偏低、压力值偏高，加上昨晚睡眠不足，身体可能已经在提醒你需要低刺激休息。",
    "insight": "你今天更像是身体已经很累，但脑子还没有下班。刷手机可能不是单纯想娱乐，而是在延迟结束这一天。",
    "tonight_action": "把手机屏幕扣上，跟随 90 秒呼吸，把注意力从屏幕拉回身体。",
    "sleep_closing_script": "今天已经到这里了。你不需要在今晚把所有事情想清楚，也不需要继续证明自己做得够多。先让肩膀慢慢放下来，让胃部也有一点安静的时间。明天的事，明天再来找你。今晚只需要完成一件小事：放下手机，呼吸几次，然后允许自己休息。"
  },
  "is_fallback": true
}
```

#### 返回字段说明（给 B 展示用）

| 字段 | 展示位置 | 说明 |
|------|----------|------|
| `emotion_weather` | 结果页 - 情绪天气卡片 | 短语，不超过 10 字 |
| `body_signals` | 结果页 - 身体信号卡片 | 数组，2-3 个身体信号 |
| `data_clues` | 结果页 - 数据线索卡片 | 一句话解释数据 |
| `insight` | 结果页顶部 - 核心洞察 | 2-3 句话，最重要 |
| `tonight_action` | 结果页 - 今晚微行动卡片 | 1 个低负担动作 |
| `sleep_closing_script` | **黑屏页** - 播放/展示 | 30-60 秒收尾语 |

> ⚠️ `is_fallback: true` 表示这是兜底数据（AI 失败或 mock 模式），前端不需要区别展示。

#### 错误响应

```json
{
  "success": false,
  "error": "请至少输入一句话或选择一个标签"
}
```

---

## 接口：健康检查

### `GET /api/health`

```json
{
  "status": "ok",
  "mode": "mock"
}
```

---

## 前端调用示例

```javascript
// 已封装好，直接 import 使用
import { fetchInsight } from './services/api';

const result = await fetchInsight({
  text_input: "今天很累",
  emotion_tags: ["烦躁"],
  body_tags: ["肩颈紧"],
  behavior_tags: ["久坐"],
  sleep_state_tags: ["脑子停不下来"],
  wearable_data: { steps: 3200, stress: 78, heart_rate: 86, last_sleep_hours: 5.8 }
});

// result.data 就是 AI 返回的 6 个字段
```

---

## 注意事项

1. **Day 1（今天）**：后端是 mock 模式，固定返回 Demo 数据，有 1 秒模拟延迟。
2. **Day 2**：切换 `.env` 中 `MODE=ai` 后接真实 Gemini API。
3. **黑屏页**：不要再调 API，直接用结果页返回的 `sleep_closing_script`。
4. **兜底**：即使网络完全断开，前端 `fetchInsight()` 也会返回 fallback 数据，不会出现空页面。
