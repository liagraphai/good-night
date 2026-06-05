/**
 * 硬件触发 AI 流程
 *
 * 当用户按下 M5StopWatch 按键时：
 * 1. 收集当前传感器数据（噪音、活动量等）
 * 2. 构造 insight 请求（使用传感器数据作为 wearable_data）
 * 3. 调用 AI 生成洞察
 * 4. 将结果推送回设备屏幕显示
 * 5. 进入晚安模式
 */

import { serialService } from './serial.js';
import { generateInsight } from './ai.js';

// 默认滑杆输入（硬件触发时没有滑杆，使用中间值 + 传感器推断）
function buildSliderFromSensor(sensorData) {
  const noise = sensorData?.noise || 50;
  const activity = sensorData?.activity || 1.0;

  // 根据环境噪音推断压力（噪音越高越难放松）
  const stressFromNoise = Math.min(100, Math.round(noise * 1.2));

  // 根据活动量推断运动水平（>1.5G 说明在动）
  const activityLevel = Math.min(100, Math.round((activity - 0.8) * 80));

  return {
    emotion: {
      calm_excited: Math.max(10, 50 - stressFromNoise / 3),  // 噪音高→更激动
      sad_happy: 50,  // 中性
      relaxed_stressed: stressFromNoise,  // 噪音→压力
    },
    body: {
      head_clear_heavy: 50,
      neck_relaxed_tense: 50,
      limbs_warm_weak: 50,
    },
    behavior: {
      sedentary_active: activityLevel,
      phone_social: 50,
      chaotic_rhythmic: 50,
    },
  };
}

// 获取当前时间描述
function getTimeContext() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  let timeDesc = `现在是${hour}:${minute < 10 ? '0' + minute : minute}`;
  if (hour >= 23 || hour < 1) timeDesc += '，已经很晚了';
  else if (hour >= 21) timeDesc += '，是该准备睡觉的时间';
  else if (hour >= 18) timeDesc += '，还算早';

  return timeDesc;
}

/**
 * 处理硬件按键触发的晚安流程
 */
async function handleGoodnightTrigger() {
  console.log('🌙 [硬件流程] 晚安按钮被按下，开始 AI 洞察生成...');

  // 1. 收集传感器数据
  const sensorData = serialService.getLatest();
  const wearableData = serialService.toWearableData();

  // 2. 构造请求
  const sliderInput = buildSliderFromSensor(sensorData);
  const voiceText = `用户在${getTimeContext()}按下了晚安按钮，准备入睡。` +
    (sensorData ? `当前环境噪音水平${sensorData.noise?.toFixed(0) || '未知'}/100。` : '');

  console.log('📊 [硬件流程] 传感器数据:', JSON.stringify(wearableData));

  // 3. 通知设备正在生成
  serialService.send({
    type: 'cmd',
    action: 'show_insight',
    text: 'Generating insight...',
  });

  try {
    // 4. 调用 AI
    const result = await generateInsight({
      voice_reflection_text: voiceText,
      slider_input: sliderInput,
      wearable_data: wearableData || {},
    });

    if (result.success && result.data) {
      const insight = result.data;
      console.log('✨ [硬件流程] AI 洞察生成成功');
      console.log(`   摘要: ${insight.one_sentence_summary}`);
      console.log(`   行动: ${insight.tonight_action}`);

      // 5. 推送到设备屏幕
      // 先显示摘要
      serialService.send({
        type: 'cmd',
        action: 'show_insight',
        text: insight.one_sentence_summary,
      });

      // 3秒后进入晚安模式，显示行动建议
      setTimeout(() => {
        serialService.goodnightMode(insight.tonight_action);
      }, 3000);

      return result;
    } else {
      console.error('⚠️  [硬件流程] AI 返回失败:', result.error);
      serialService.send({
        type: 'cmd',
        action: 'show_insight',
        text: 'Good Night. Rest well.',
      });
      return result;
    }
  } catch (err) {
    console.error('❌ [硬件流程] AI 调用异常:', err.message);
    serialService.send({
      type: 'cmd',
      action: 'goodnight_mode',
      text: 'Sweet dreams...',
    });
    return { success: false, error: err.message };
  }
}

/**
 * 初始化硬件流程监听
 */
export function initHardwareFlow() {
  // 监听设备按键事件
  serialService.on('device-event', (evt) => {
    if (evt.action === 'goodnight_trigger') {
      handleGoodnightTrigger();
    }
  });

  // 监听设备就绪
  serialService.on('ready', (info) => {
    console.log(`🎮 [硬件流程] 设备就绪，等待晚安按钮...`);
    // 发送欢迎信息到屏幕
    setTimeout(() => {
      serialService.send({
        type: 'cmd',
        action: 'show_insight',
        text: 'Ready. Press A for goodnight.',
      });
    }, 1000);
  });

  console.log('🔗 [硬件流程] 已注册按键监听');
}

export { handleGoodnightTrigger };
