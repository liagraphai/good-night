import { useState, useEffect } from 'react';
import { initAudio, switchPage } from '../services/audio';

/**
 * 首页 - 打开即显示轻触提示，轻触后音乐+元素缓慢出现
 *
 * 元素出现节奏非常慢，给用户充分感受音乐氛围的时间
 */
export default function HomePage({ onStart }) {
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [visibleStep, setVisibleStep] = useState(0);

  // 轻触屏幕解锁音频并开始播放
  const handleUnlock = () => {
    if (audioUnlocked) return;
    initAudio();
    switchPage('home');
    setAudioUnlocked(true);
  };

  // 音频解锁后，元素非常缓慢地浮现
  useEffect(() => {
    if (!audioUnlocked) return;
    if (visibleStep >= 4) return;

    // 第一个元素等 5s（让音乐先铺开），之后每个 5s
    const delays = [5000, 5000, 5000, 4000];
    const timer = setTimeout(() => {
      setVisibleStep(prev => prev + 1);
    }, delays[visibleStep]);

    return () => clearTimeout(timer);
  }, [audioUnlocked, visibleStep]);

  return (
    <div className="page home-page" onClick={!audioUnlocked ? handleUnlock : undefined}>
      {!audioUnlocked && (
        <div className="home-tap-hint">
          <p className="tap-text">轻触屏幕</p>
          <p className="tap-sub">开启今晚的旅程</p>
        </div>
      )}

      {audioUnlocked && (
        <div className="home-content">
          {visibleStep >= 1 && (
            <h1 className="app-title home-float-in">晚安体感</h1>
          )}

          {visibleStep >= 2 && (
            <p className="app-subtitle home-float-in">睡前 1 分钟，整理今天的身心状态</p>
          )}

          {visibleStep >= 3 && (
            <button className="btn-primary btn-start home-float-in" onClick={onStart}>
              开始今晚体感
            </button>
          )}

          {visibleStep >= 4 && (
            <p className="home-hint home-float-in">
              用最少的输入，把今天翻译成一份简短洞察
            </p>
          )}
        </div>
      )}
    </div>
  );
}
