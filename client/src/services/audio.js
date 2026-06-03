/**
 * 音频管理模块 - 程序化生成疗愈环境音
 *
 * 使用 Web Audio API 生成不同风格的环境音：
 * - 不需要任何外部音频文件
 * - 每个页面有独特的音色和氛围
 * - 越往后越安静，渐进式引导入睡
 */

let audioCtx = null;
let currentNodes = []; // 当前播放的音频节点
let masterGain = null;
let currentPage = null;
let isInitialized = false;
let fadeInterval = null;

/**
 * 页面音频配置
 * volume: 主音量 (0-1)
 * generator: 生成对应环境音的函数
 */
const PAGE_CONFIG = {
  home: {
    volume: 0.25,
    label: '柔和风铃'
  },
  textInput: {
    volume: 0.18,
    label: '轻柔白噪音'
  },
  sliders: {
    volume: 0.15,
    label: '温暖低频'
  },
  data: {
    volume: 0.12,
    label: '缓慢脉冲'
  },
  result: {
    volume: 0.1,
    label: '极轻pad'
  },
  sleep: {
    volume: 0.06,
    label: '深沉低频'
  }
};

/**
 * 初始化音频上下文
 * 可在页面加载时调用（suspended状态），用户交互后会自动 resume
 */
export function initAudio() {
  if (isInitialized) {
    // 已初始化但可能 suspended，尝试 resume
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return;
  }

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioCtx.destination);
  isInitialized = true;

  // 如果 suspended，交互后自动恢复
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/**
 * 切换到指定页面的音频
 */
export function switchPage(pageName) {
  if (!isInitialized || !audioCtx) return;
  if (currentPage === pageName) return;

  const config = PAGE_CONFIG[pageName];
  if (!config) return;

  // 淡出当前音频
  fadeOut(() => {
    // 停止当前所有节点
    stopCurrentNodes();

    // 生成新页面的环境音
    currentPage = pageName;
    generateAmbient(pageName);

    // 淡入新音频
    fadeIn(config.volume);
  });
}

/**
 * 临时降低音量（用于 TTS 播放时）
 */
export function duck() {
  if (!masterGain) return;
  masterGain.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 0.5);
}

// 钵音计数器，每次音高略低，渐进安静
let bowlCount = 0;
let reverbBuffer = null; // 缓存 reverb impulse

/**
 * 创建混响 impulse response（程序化生成）
 */
function createReverbImpulse(ctx) {
  if (reverbBuffer) return reverbBuffer;

  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 3; // 3秒混响尾巴
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // 指数衰减的白噪音 = 自然混响
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }

  reverbBuffer = buffer;
  return buffer;
}

/**
 * 播放钵音（singing bowl sound）+ reverb 混响
 * 融入背景音乐中，每次音高递降更安静
 */
export function playBowlSound() {
  if (!audioCtx) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    playBowlWithContext(ctx, ctx.destination);
    return;
  }
  const bowlGain = audioCtx.createGain();
  bowlGain.gain.value = 1.0;
  bowlGain.connect(audioCtx.destination);
  playBowlWithContext(audioCtx, bowlGain);
}

function playBowlWithContext(ctx, destination) {
  const now = ctx.currentTime;

  // 每次钵音音高递降：528 → 440 → 396 → 352 → 330
  const baseFreqs = [528, 440, 396, 352, 330];
  const freq = baseFreqs[Math.min(bowlCount, baseFreqs.length - 1)];
  bowlCount++;

  // 创建 reverb 节点
  const convolver = ctx.createConvolver();
  convolver.buffer = createReverbImpulse(ctx);

  // dry/wet 混合：干声 + 湿声（混响）
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 0.6;
  wetGain.gain.value = 0.4; // 40% 混响

  dryGain.connect(destination);
  convolver.connect(wetGain);
  wetGain.connect(destination);

  // 基频
  const fundamental = ctx.createOscillator();
  const fundGain = ctx.createGain();
  fundamental.type = 'sine';
  fundamental.frequency.value = freq;
  fundGain.gain.setValueAtTime(0.28, now);
  fundGain.gain.exponentialRampToValueAtTime(0.001, now + 5); // 更长的衰减
  fundamental.connect(fundGain);
  fundGain.connect(dryGain);
  fundGain.connect(convolver);

  // 泛音1
  const harmonic1 = ctx.createOscillator();
  const h1Gain = ctx.createGain();
  harmonic1.type = 'sine';
  harmonic1.frequency.value = freq * 1.5;
  h1Gain.gain.setValueAtTime(0.1, now);
  h1Gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
  harmonic1.connect(h1Gain);
  h1Gain.connect(dryGain);
  h1Gain.connect(convolver);

  // 泛音2 — 轻柔高频
  const harmonic2 = ctx.createOscillator();
  const h2Gain = ctx.createGain();
  harmonic2.type = 'sine';
  harmonic2.frequency.value = freq * 2;
  h2Gain.gain.setValueAtTime(0.04, now);
  h2Gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
  harmonic2.connect(h2Gain);
  h2Gain.connect(dryGain);
  h2Gain.connect(convolver);

  fundamental.start(now);
  harmonic1.start(now);
  harmonic2.start(now);
  fundamental.stop(now + 5);
  harmonic1.stop(now + 3.5);
  harmonic2.stop(now + 2.5);
}

/**
 * 重置钵音计数（页面重置时调用）
 */
export function resetBowlCount() {
  bowlCount = 0;
}

/**
 * 拉杆滑动音效 — 极轻柔，音高随拉杆值缓慢变化
 * 像风铃在远处被轻轻拨动
 */
export function playSliderTone(value) {
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  // 映射 0-100 → 频率 200Hz-600Hz（范围更窄，更柔和）
  const freq = 200 + (value / 100) * 400;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;

  // 极轻，缓慢衰减
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.04, now + 0.05); // 很轻的起音
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6); // 慢衰减

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.7);
}

// 页面跳转琶音计数器 — 每次用不同的调式
let transitionCount = 0;

/**
 * 播放页面跳转过渡音效 — 每次不同调的琶音 + 更慢的 delay
 */
export function playTransitionSound() {
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  // 创建 reverb
  const convolver = audioCtx.createConvolver();
  convolver.buffer = createReverbImpulse(audioCtx);
  const wetGain = audioCtx.createGain();
  wetGain.gain.value = 0.4;
  convolver.connect(wetGain);
  wetGain.connect(audioCtx.destination);

  // 每次不同的音阶组合（逐渐下行，越来越安静）
  const arpeggios = [
    [261.63, 329.63, 392, 523.25],   // C大调上行 C4-E4-G4-C5
    [293.66, 349.23, 440, 523.25],   // D小调 D4-F4-A4-C5
    [246.94, 311.13, 369.99, 493.88],// B小调 B3-Eb4-F#4-B4
    [220, 261.63, 329.63, 440],      // Am A3-C4-E4-A4（更低沉）
    [196, 246.94, 293.66, 392],      // G调 G3-B3-D4-G4（最低沉）
  ];

  const notes = arpeggios[transitionCount % arpeggios.length];
  transitionCount++;

  // 每个音间隔 250ms（更慢更有仪式感）
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const startTime = now + i * 0.25;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15 - i * 0.02, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.5); // 更长的尾巴

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.connect(convolver);
    osc.start(startTime);
    osc.stop(startTime + 2.5);
  });
}

/**
 * 播放收尾语伴奏音色 — 轻柔持续和弦，伴随 TTS 播放
 * 返回 stop 函数用于结束时调用
 */
export function startClosingAccompaniment() {
  if (!audioCtx) return () => {};

  const now = audioCtx.currentTime;
  const nodes = [];

  // 极轻柔的 Am7 和弦：A3, C4, E4, G4
  const freqs = [220, 261.63, 329.63, 392];
  const accGain = audioCtx.createGain();
  accGain.gain.setValueAtTime(0, now);
  accGain.gain.linearRampToValueAtTime(0.06, now + 2); // 缓慢淡入
  accGain.connect(audioCtx.destination);

  freqs.forEach(freq => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(accGain);
    osc.start(now);
    nodes.push(osc);
  });

  // 加一层极轻的呼吸感 LFO（音量微微起伏）
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.12; // 非常慢的呼吸节奏
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain);
  lfoGain.connect(accGain.gain);
  lfo.start(now);
  nodes.push(lfo);

  // 返回停止函数
  return () => {
    const stopTime = audioCtx.currentTime;
    accGain.gain.linearRampToValueAtTime(0, stopTime + 2); // 缓慢淡出
    setTimeout(() => {
      nodes.forEach(node => {
        try { node.stop(); } catch (e) { /* */ }
      });
    }, 2200);
  };
}

/**
 * TTS 加载期间的疗愈过渡音乐 — 极缓慢的小雨
 * 低频滤波噪音 + 非常慢的 LFO 起伏
 * 返回 stop 函数
 */
export function startLoadingMusic() {
  if (!audioCtx) return () => {};

  const now = audioCtx.currentTime;

  // 白噪音 buffer
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }

  // 主雨声：低中频，像雨落在窗外远处
  const rainSource = audioCtx.createBufferSource();
  rainSource.buffer = buffer;
  rainSource.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 0.2; // 更宽频带，更自然

  const rainGain = audioCtx.createGain();
  rainGain.gain.setValueAtTime(0, now);
  rainGain.gain.linearRampToValueAtTime(0.07, now + 3); // 更慢渐入

  // LFO：非常缓慢的起伏（12秒一个周期）
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.08; // 12秒周期
  lfoGain.gain.value = 0.025;
  lfo.connect(lfoGain);
  lfoGain.connect(rainGain.gain);
  lfo.start(now);

  rainSource.connect(filter);
  filter.connect(rainGain);
  rainGain.connect(audioCtx.destination);
  rainSource.start(now);

  return () => {
    const stopTime = audioCtx.currentTime;
    rainGain.gain.linearRampToValueAtTime(0, stopTime + 2.5);
    setTimeout(() => {
      try { rainSource.stop(); } catch (e) { /* */ }
      try { lfo.stop(); } catch (e) { /* */ }
    }, 2800);
  };
}

/**
 * 恢复音量
 */
export function unduck() {
  if (!masterGain || !currentPage) return;
  const config = PAGE_CONFIG[currentPage];
  if (config) {
    masterGain.gain.linearRampToValueAtTime(config.volume, audioCtx.currentTime + 1);
  }
}

/**
 * 暂停所有音频
 */
export function pause() {
  if (audioCtx && audioCtx.state === 'running') {
    audioCtx.suspend();
  }
}

/**
 * 恢复音频
 */
export function resume() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// === 内部函数 ===

function fadeOut(callback) {
  if (!masterGain) {
    callback?.();
    return;
  }
  masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
  setTimeout(callback, 800);
}

function fadeIn(targetVolume) {
  if (!masterGain) return;
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(targetVolume, audioCtx.currentTime + 1.5);
}

function stopCurrentNodes() {
  currentNodes.forEach(node => {
    try { node.stop?.(); } catch (e) { /* 已停止 */ }
    try { node.disconnect?.(); } catch (e) { /* 已断开 */ }
  });
  currentNodes = [];
}

/**
 * 根据页面名称生成对应的环境音
 */
function generateAmbient(pageName) {
  switch (pageName) {
    case 'home':
      generateChimes();
      break;
    case 'textInput':
      generateWhiteNoise();
      break;
    case 'sliders':
      generateWarmDrone();
      break;
    case 'data':
      generateSlowPulse();
      break;
    case 'result':
      generateSoftPad();
      break;
    case 'sleep':
      generateDeepSleep();
      break;
  }
}

/**
 * 首页 - 柔和风铃音：随机音高的正弦波短音，稀疏触发
 */
function generateChimes() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6

  function playChime() {
    if (currentPage !== 'home') return;

    const freq = notes[Math.floor(Math.random() * notes.length)];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 3);

    // 随机间隔 1.5-4 秒
    const nextDelay = 1500 + Math.random() * 2500;
    setTimeout(playChime, nextDelay);
  }

  // 加一层柔和的低频垫底
  const pad = audioCtx.createOscillator();
  const padGain = audioCtx.createGain();
  pad.type = 'sine';
  pad.frequency.value = 261.63; // C4
  padGain.gain.value = 0.1;
  pad.connect(padGain);
  padGain.connect(masterGain);
  pad.start();
  currentNodes.push(pad);

  playChime();
}

/**
 * 语音输入页 - 轻柔过滤白噪音
 */
function generateWhiteNoise() {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // 低通滤波 → 柔和的沙沙声
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.5;

  source.connect(filter);
  filter.connect(masterGain);
  source.start();
  currentNodes.push(source);
}

/**
 * 滑杆页 - 温暖的低频 drone
 */
function generateWarmDrone() {
  // 两个略微失谐的低频正弦波，产生缓慢的拍频
  const freqs = [110, 110.5]; // A2 + 微失谐

  freqs.forEach(freq => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.4;
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    currentNodes.push(osc);
  });

  // 加一层高八度的极轻泛音
  const harmonic = audioCtx.createOscillator();
  const hGain = audioCtx.createGain();
  harmonic.type = 'sine';
  harmonic.frequency.value = 330; // E4
  hGain.gain.value = 0.08;
  harmonic.connect(hGain);
  hGain.connect(masterGain);
  harmonic.start();
  currentNodes.push(harmonic);
}

/**
 * 数据页 - 缓慢脉冲：低频在 LFO 调制下缓慢起伏
 */
function generateSlowPulse() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 174.61; // F3

  lfo.type = 'sine';
  lfo.frequency.value = 0.15; // 非常慢的起伏
  lfoGain.gain.value = 0.3;

  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  gain.gain.value = 0.3;

  osc.connect(gain);
  gain.connect(masterGain);
  lfo.start();
  osc.start();
  currentNodes.push(osc, lfo);
}

/**
 * 结果页 - 极轻的和弦 pad
 */
function generateSoftPad() {
  // C大调和弦 C-E-G，非常轻
  const freqs = [261.63, 329.63, 392.00]; // C4, E4, G4

  freqs.forEach(freq => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    currentNodes.push(osc);
  });
}

/**
 * 睡眠页 - 极深的低频，接近无声
 */
function generateDeepSleep() {
  // 舒缓的 Cmaj7 和弦垫底：C3, E3, G3, B3
  // 极轻的持续音，像远处的安宁钟声在回荡
  const freqs = [130.81, 164.81, 196, 246.94];
  freqs.forEach(freq => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    currentNodes.push(osc);
  });

  // 极缓慢的呼吸感 LFO（15秒一个周期）
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.067; // ~15秒
  lfoGain.gain.value = 0.04;
  lfo.connect(lfoGain);
  lfoGain.connect(masterGain.gain);
  lfo.start();
  currentNodes.push(lfo);

  // 轻柔的高频泛音闪烁（像星光）
  const shimmer = audioCtx.createOscillator();
  const shimmerGain = audioCtx.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.value = 523.25; // C5
  shimmerGain.gain.value = 0.02;
  shimmer.connect(shimmerGain);
  shimmerGain.connect(masterGain);
  shimmer.start();
  currentNodes.push(shimmer);
}
