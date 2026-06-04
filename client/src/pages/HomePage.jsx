import { useState, useEffect } from 'react';
import { initAudio, switchPage } from '../services/audio';

/**
 * 首页 - 高级视觉版
 * 月牙装饰 + 浮动光球 + 分层排版 + 缓慢浮现
 */
export default function HomePage({ onStart }) {
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [visibleStep, setVisibleStep] = useState(0);

  const handleUnlock = () => {
    if (audioUnlocked) return;
    initAudio();
    switchPage('home');
    setAudioUnlocked(true);
  };

  useEffect(() => {
    if (!audioUnlocked) return;
    if (visibleStep >= 4) return;
    const delays = [5000, 5000, 5000, 4000];
    const timer = setTimeout(() => {
      setVisibleStep(prev => prev + 1);
    }, delays[visibleStep]);
    return () => clearTimeout(timer);
  }, [audioUnlocked, visibleStep]);

  return (
    <div className="page home-page" onClick={!audioUnlocked ? handleUnlock : undefined}>
      {/* 装饰层 */}
      <div className="home-nebula" aria-hidden="true" />
      <div className="home-orb home-orb-1" aria-hidden="true" />
      <div className="home-orb home-orb-2" aria-hidden="true" />
      <div className="home-orb home-orb-3" aria-hidden="true" />

      {!audioUnlocked && (
        <div className="home-tap-hint">
          <div className="home-moon-icon">
            <svg viewBox="0 0 64 64" width="48" height="48">
              <defs>
                <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c4b5fd"/>
                  <stop offset="100%" stopColor="#8b9cf8"/>
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="24" fill="none" stroke="url(#moonGrad)" strokeWidth="1.5" opacity="0.5"/>
              <path d="M38 12 A22 22 0 0 1 38 52 A18 18 0 0 0 38 12" fill="url(#moonGrad)" opacity="0.75"/>
            </svg>
          </div>
          <p className="tap-text">轻触屏幕</p>
          <p className="tap-sub">开启今晚的旅程</p>
        </div>
      )}

      {audioUnlocked && (
        <div className="home-content">
          {visibleStep >= 1 && (
            <div className="home-title-group home-float-in">
              <div className="home-moon-large">
                <svg viewBox="0 0 80 80" width="64" height="64">
                  <defs>
                    <linearGradient id="moonGradLg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e9d5ff"/>
                      <stop offset="100%" stopColor="#8b9cf8"/>
                    </linearGradient>
                  </defs>
                  <circle cx="40" cy="40" r="30" fill="none" stroke="url(#moonGradLg)" strokeWidth="1" opacity="0.35"/>
                  <path d="M46 14 A28 28 0 0 1 46 66 A22 22 0 0 0 46 14" fill="url(#moonGradLg)" opacity="0.65"/>
                </svg>
              </div>
              <h1 className="app-title">晚安体感</h1>
            </div>
          )}

          {visibleStep >= 2 && (
            <p className="app-subtitle home-float-in">
              睡前 1 分钟，整理今天的身心状态
            </p>
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
