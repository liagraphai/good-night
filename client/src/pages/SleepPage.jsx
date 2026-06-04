import { useState, useRef, useEffect } from 'react';
import { duck, unduck, startClosingAccompaniment, startLoadingMusic } from '../services/audio';
import { fetchTTS } from '../services/api';

/**
 * 黑屏睡眠模式页 - 步骤 6
 *
 * 使用 Gemini TTS API 生成轻柔自然的语音。
 * TTS 加载期间播放一段疗愈过渡音乐，生成后自动停止。
 * 文字以打字机方式逐字输出，标点处有呼吸停顿，像睡前讲故事。
 */
export default function SleepPage({ script, onExit }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const stopAccompaniment = useRef(null);
  const stopLoadingMusic = useRef(null);
  const audioUrlRef = useRef(null);

  // 打字机效果状态
  const [displayedText, setDisplayedText] = useState('');
  const [isTypewriterDone, setIsTypewriterDone] = useState(false);
  const typewriterTimer = useRef(null);

  // 打字机效果：逐字输出 + 标点感知停顿
  useEffect(() => {
    if (!script) return;

    let cancelled = false;
    let currentIndex = 0;

    const typeNext = () => {
      if (cancelled || currentIndex >= script.length) {
        if (!cancelled) setIsTypewriterDone(true);
        return;
      }

      currentIndex++;
      setDisplayedText(script.slice(0, currentIndex));

      // 根据当前字符决定下一次延迟
      const char = script[currentIndex - 1];
      let delay;

      if ('。！？…'.includes(char)) {
        delay = 600; // 句末长停顿
      } else if ('，、；：'.includes(char)) {
        delay = 350; // 逗号中停顿
      } else if (char === '\n') {
        delay = 500; // 换行停顿
      } else {
        delay = 80;  // 普通字符节奏
      }

      typewriterTimer.current = setTimeout(typeNext, delay);
    };

    // 初始 1.5s 静默，让用户沉浸暗屏氛围
    typewriterTimer.current = setTimeout(typeNext, 1500);

    return () => {
      cancelled = true;
      clearTimeout(typewriterTimer.current);
    };
  }, [script]);

  // 跳过打字机，立即展示全文
  const handleSkipTypewriter = () => {
    clearTimeout(typewriterTimer.current);
    setDisplayedText(script || '');
    setIsTypewriterDone(true);
  };

  const handlePlay = async () => {
    if (!script) return;

    // 正在播放 → 暂停
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      unduck();
      stopAccompaniment.current?.();
      stopAccompaniment.current = null;
      return;
    }

    // 如果已经有缓存的音频，直接播放
    if (audioUrlRef.current) {
      playAudio(audioUrlRef.current);
      return;
    }

    // 首次：TTS 加载中播放疗愈过渡音乐
    setIsLoading(true);
    stopLoadingMusic.current = startLoadingMusic();

    const audioUrl = await fetchTTS(script);

    // TTS 完成，停止过渡音乐
    stopLoadingMusic.current?.();
    stopLoadingMusic.current = null;
    setIsLoading(false);

    if (!audioUrl) {
      fallbackBrowserTTS();
      return;
    }

    audioUrlRef.current = audioUrl;
    playAudio(audioUrl);
  };

  const playAudio = (url) => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => {
      setIsPlaying(true);
      duck();
      stopAccompaniment.current = startClosingAccompaniment();
    };

    audio.onended = () => {
      setIsPlaying(false);
      unduck();
      stopAccompaniment.current?.();
      stopAccompaniment.current = null;
    };

    audio.onerror = () => {
      setIsPlaying(false);
      unduck();
      stopAccompaniment.current?.();
      stopAccompaniment.current = null;
    };

    audio.play();
  };

  // 浏览器 TTS 兜底
  const fallbackBrowserTTS = () => {
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.7;
    utterance.pitch = 0.8;
    utterance.volume = 0.5;

    utterance.onstart = () => {
      setIsPlaying(true);
      duck();
      stopAccompaniment.current = startClosingAccompaniment();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      unduck();
      stopAccompaniment.current?.();
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      unduck();
      stopAccompaniment.current?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="page sleep-page">
      <div className="sleep-content">
        <p className="sleep-script">
          {displayedText}
          {!isTypewriterDone && <span className="typewriter-cursor">|</span>}
        </p>

        {!isTypewriterDone && (
          <button className="btn-skip-typewriter" onClick={handleSkipTypewriter}>
            跳过
          </button>
        )}

        {isTypewriterDone && (
          <div className="sleep-controls sleep-controls-fade-in">
            <button
              className={`btn-speak ${isPlaying ? 'speaking' : ''} ${isLoading ? 'loading' : ''}`}
              onClick={handlePlay}
              disabled={isLoading}
            >
              {isLoading ? '✨ 正在为你准备语音...' : isPlaying ? '⏸ 暂停' : '▶ 播放收尾语'}
            </button>
          </div>
        )}

        <button className="btn-exit" onClick={onExit}>
          今晚就到这里
        </button>
      </div>
    </div>
  );
}
