import { useState, useRef, useEffect, useCallback } from 'react';
import { duck, unduck, startClosingAccompaniment } from '../services/audio';
import { fetchTTS } from '../services/api';

/**
 * 黑屏睡眠模式页 - 步骤 6
 *
 * 流程：
 * 1. 进入页面 → 立刻播放雨声 + 开始加载 TTS
 * 2. TTS 加载完成 → 语音开始播放（雨声继续）
 * 3. 文字跟随音频 currentTime 实时同步显示（加权映射）
 * 4. 语音结束 → 雨声渐隐
 *
 * 雨声使用独立的 AudioContext，不受全局环境音系统影响
 */
export default function SleepPage({ script, onExit }) {
  const [phase, setPhase] = useState('loading');
  const [displayedText, setDisplayedText] = useState('');
  const [isTypewriterDone, setIsTypewriterDone] = useState(false);

  const audioRef = useRef(null);
  const stopAccompaniment = useRef(null);
  const rafRef = useRef(null);
  const hasStarted = useRef(false);
  const typewriterTimer = useRef(null);
  const timeMapRef = useRef(null);

  // 独立的雨声 AudioContext 和节点引用
  const rainCtxRef = useRef(null);
  const rainNodesRef = useRef(null);

  /**
   * 启动雨声（独立 AudioContext，不受全局音频系统干扰）
   */
  const startRain = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    rainCtxRef.current = ctx;

    const now = ctx.currentTime;

    // 白噪音 buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    // 主雨声层：中频带通
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;

    const bandFilter = ctx.createBiquadFilter();
    bandFilter.type = 'bandpass';
    bandFilter.frequency.value = 2500;
    bandFilter.Q.value = 0.15;

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0, now);
    rainGain.gain.linearRampToValueAtTime(0.22, now + 1.5); // 1.5秒渐入

    rainSource.connect(bandFilter);
    bandFilter.connect(rainGain);
    rainGain.connect(ctx.destination);
    rainSource.start(now);

    // 第二层：高频细雨滴
    const dripsSource = ctx.createBufferSource();
    dripsSource.buffer = buffer;
    dripsSource.loop = true;

    const highFilter = ctx.createBiquadFilter();
    highFilter.type = 'highpass';
    highFilter.frequency.value = 5000;
    highFilter.Q.value = 0.3;

    const dripsGain = ctx.createGain();
    dripsGain.gain.setValueAtTime(0, now);
    dripsGain.gain.linearRampToValueAtTime(0.05, now + 2);

    dripsSource.connect(highFilter);
    highFilter.connect(dripsGain);
    dripsGain.connect(ctx.destination);
    dripsSource.start(now);

    // 缓慢呼吸 LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(rainGain.gain);
    lfo.start(now);

    rainNodesRef.current = { rainSource, dripsSource, lfo, rainGain, dripsGain, ctx };
  };

  /**
   * 停止雨声（3秒渐隐）
   */
  const stopRain = () => {
    const nodes = rainNodesRef.current;
    if (!nodes) return;

    const { rainSource, dripsSource, lfo, rainGain, dripsGain, ctx } = nodes;
    const now = ctx.currentTime;

    rainGain.gain.linearRampToValueAtTime(0, now + 3);
    dripsGain.gain.linearRampToValueAtTime(0, now + 3);

    setTimeout(() => {
      try { rainSource.stop(); } catch (e) { /* */ }
      try { dripsSource.stop(); } catch (e) { /* */ }
      try { lfo.stop(); } catch (e) { /* */ }
      ctx.close();
    }, 3500);

    rainNodesRef.current = null;
    rainCtxRef.current = null;
  };

  /**
   * 构建加权时间映射
   */
  const buildTimeMap = useCallback((text) => {
    const weights = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      let w;
      if ('。！？…'.includes(char)) w = 6;
      else if ('，、；：'.includes(char)) w = 4;
      else if (char === '\n') w = 5;
      else if (char === ' ') w = 1.5;
      else w = 1;
      weights.push(w);
    }

    const cumulative = [];
    let total = 0;
    for (let i = 0; i < weights.length; i++) {
      total += weights[i];
      cumulative.push(total);
    }
    for (let i = 0; i < cumulative.length; i++) {
      cumulative[i] /= total;
    }
    return cumulative;
  }, []);

  /**
   * 根据播放进度(0~1)查找应显示的字符数
   */
  const getCharIndexAtProgress = useCallback((progress, cumWeights) => {
    let lo = 0, hi = cumWeights.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumWeights[mid] < progress) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  }, []);

  // 进入页面：立刻播雨声 + 加载 TTS
  useEffect(() => {
    if (!script || hasStarted.current) return;
    hasStarted.current = true;

    timeMapRef.current = buildTimeMap(script);

    // 立刻播放雨声
    startRain();

    // 同时加载 TTS
    fetchTTS(script).then(audioUrl => {
      if (!audioUrl) {
        stopRain();
        setPhase('error');
        startFallbackTypewriter();
        return;
      }
      playAudioWithText(audioUrl);
    }).catch(() => {
      stopRain();
      setPhase('error');
      startFallbackTypewriter();
    });

    return () => {
      stopRain();
      stopAccompaniment.current?.();
      cancelAnimationFrame(rafRef.current);
      clearTimeout(typewriterTimer.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [script]);

  /**
   * 音频播放时间驱动文字同步
   */
  const syncTextWithAudio = useCallback((audio) => {
    if (!script || !timeMapRef.current) return;

    const cumWeights = timeMapRef.current;
    let lastIndex = 0;

    const tick = () => {
      if (!audio || audio.paused || audio.ended) return;

      const progress = Math.min(audio.currentTime / (audio.duration * 0.95), 1);
      const charIndex = Math.min(getCharIndexAtProgress(progress, cumWeights), script.length);

      if (charIndex !== lastIndex) {
        lastIndex = charIndex;
        setDisplayedText(script.slice(0, charIndex));
      }

      if (charIndex >= script.length) {
        setIsTypewriterDone(true);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [script, getCharIndexAtProgress]);

  /**
   * TTS 就绪：播放语音（雨声继续），语音结束后雨声才停
   */
  const playAudioWithText = (url) => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => {
      setPhase('playing');
      duck();
      stopAccompaniment.current = startClosingAccompaniment();
      syncTextWithAudio(audio);
    };

    audio.onended = () => {
      setPhase('done');
      unduck();
      cancelAnimationFrame(rafRef.current);
      // 语音播完，雨声才淡出
      stopRain();
      stopAccompaniment.current?.();
      stopAccompaniment.current = null;
      setDisplayedText(script);
      setIsTypewriterDone(true);
    };

    audio.onerror = () => {
      setPhase('error');
      unduck();
      cancelAnimationFrame(rafRef.current);
      stopRain();
      stopAccompaniment.current?.();
      stopAccompaniment.current = null;
      startFallbackTypewriter();
    };

    audio.play().catch(() => {
      setPhase('error');
      stopRain();
      startFallbackTypewriter();
    });
  };

  /**
   * TTS 失败降级打字机
   */
  const startFallbackTypewriter = () => {
    if (!script) return;
    let currentIndex = 0;

    const typeNext = () => {
      if (currentIndex >= script.length) {
        setIsTypewriterDone(true);
        setDisplayedText(script);
        return;
      }

      currentIndex++;
      setDisplayedText(script.slice(0, currentIndex));

      const char = script[currentIndex - 1];
      let delay;
      if ('。！？…'.includes(char)) delay = 500;
      else if ('，、；：'.includes(char)) delay = 300;
      else if (char === '\n') delay = 400;
      else delay = 80;

      typewriterTimer.current = setTimeout(typeNext, delay);
    };

    typewriterTimer.current = setTimeout(typeNext, 500);
  };

  return (
    <div className="page sleep-page">
      <div className="sleep-content">
        {phase === 'loading' && (
          <p className="sleep-loading-hint">✨ 正在为你准备晚安语音...</p>
        )}

        {displayedText && (
          <p className="sleep-script">
            {displayedText}
            {!isTypewriterDone && <span className="typewriter-cursor">|</span>}
          </p>
        )}

        {phase === 'done' && (
          <p className="sleep-done-hint">🌙 晚安</p>
        )}

        <button className="btn-exit" onClick={onExit}>
          今晚就到这里
        </button>
      </div>
    </div>
  );
}
