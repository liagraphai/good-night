import { useState, useEffect, useCallback } from 'react';
import { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { loadEmittersPlugin } from '@tsparticles/plugin-emitters';
import { loadTrailPlugin } from '@tsparticles/plugin-trail';
import HomePage from './pages/HomePage';
import TextInputPage from './pages/TextInputPage';
import SlidersPage from './pages/SlidersPage';
import DataPage from './pages/DataPage';
import ResultPage from './pages/ResultPage';
import SleepPage from './pages/SleepPage';
import StarrySky from './components/StarrySky';
import { fetchInsight } from './services/api';
import { saveSession, loadSession, clearSession } from './services/storage';
import { DEFAULT_WEARABLE_DATA } from './services/demoData';
import { switchPage, playTransitionSound } from './services/audio';
import './App.css';

// 粒子引擎初始化回调（必须稳定引用）
const particlesInit = async (engine) => {
  await loadSlim(engine);
  await loadEmittersPlugin(engine);
  await loadTrailPlugin(engine);
};

/**
 * 晚安体感 - 主应用（Day 2 滑杆版）
 *
 * 页面流程：
 * home -> textInput -> sliders -> data -> result -> sleep
 */

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [voiceText, setVoiceText] = useState('');
  const [sliderInput, setSliderInput] = useState({
    emotion: { calm_excited: 50, sad_happy: 50, relaxed_stressed: 50 },
    body: { head_clear_heavy: 50, neck_relaxed_tense: 50, limbs_warm_weak: 50 },
    behavior: { sedentary_active: 50, phone_social: 50, chaotic_rhythmic: 50 }
  });
  const [wearableData, setWearableData] = useState(DEFAULT_WEARABLE_DATA);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  // 尝试恢复上次会话
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.result) {
      setVoiceText(saved.voiceText || '');
      setSliderInput(saved.sliderInput || sliderInput);
      setWearableData(saved.wearableData || DEFAULT_WEARABLE_DATA);
      setResult(saved.result);
      setCurrentPage('result');
    }
  }, []);

  // 页面切换时切换背景音乐
  useEffect(() => {
    if (audioStarted) {
      switchPage(currentPage);
    }
  }, [currentPage, audioStarted]);

  // 从首页进入（音频已在首页激活）
  const handleStartWithAudio = () => {
    setAudioStarted(true);
    goTo('textInput');
  };

  // 生成洞察 - Day 2 格式
  const handleGenerate = async () => {
    setCurrentPage('result');
    setLoading(true);

    const input = {
      voice_reflection_text: voiceText,
      slider_input: sliderInput,
      wearable_data: wearableData
    };

    const response = await fetchInsight(input);

    if (response.success && response.data) {
      setResult(response.data);
      saveSession({
        voiceText,
        sliderInput,
        wearableData,
        result: response.data
      });
    }

    setLoading(false);
  };

  // 一键重置
  const handleReset = () => {
    setCurrentPage('home');
    setVoiceText('');
    setSliderInput({
      emotion: { calm_excited: 50, sad_happy: 50, relaxed_stressed: 50 },
      body: { head_clear_heavy: 50, neck_relaxed_tense: 50, limbs_warm_weak: 50 },
      behavior: { sedentary_active: 50, phone_social: 50, chaotic_rhythmic: 50 }
    });
    setWearableData(DEFAULT_WEARABLE_DATA);
    setResult(null);
    clearSession();
  };

  // 页面跳转 + 播放过渡音效
  const goTo = (page) => {
    playTransitionSound();
    setCurrentPage(page);
  };

  // 进度指示器页面列表
  const FLOW_PAGES = ['textInput', 'sliders', 'data', 'result'];
  const pageIndex = FLOW_PAGES.indexOf(currentPage);

  return (
    <ParticlesProvider init={particlesInit}>
      <div className={`app page-${currentPage}`}>
        <StarrySky />

        {/* 氛围装饰层 */}
        {currentPage !== 'sleep' && (
          <div className="ambient-decor" aria-hidden="true">
            <div className="ambient-orb" />
            <div className="ambient-orb" />
            <div className="ambient-orb" />
            <div className="ambient-nebula" />
          </div>
        )}

        {/* 进度指示器 */}
        {pageIndex >= 0 && (
          <div className="progress-indicator">
            {FLOW_PAGES.map((_, i) => (
              <span
                key={i}
                className={`progress-dot ${i < pageIndex ? 'completed' : ''} ${i === pageIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        {currentPage !== 'home' && currentPage !== 'sleep' && (
          <button className="btn-reset" onClick={handleReset} title="重置Demo">
            🔄
          </button>
        )}

        {currentPage === 'home' && (
          <HomePage onStart={handleStartWithAudio} />
        )}

        {currentPage === 'textInput' && (
          <TextInputPage
            value={voiceText}
            onChange={setVoiceText}
            onNext={() => goTo('sliders')}
            onBack={() => goTo('home')}
          />
        )}

        {currentPage === 'sliders' && (
          <SlidersPage
            value={sliderInput}
            onChange={setSliderInput}
            onNext={() => goTo('data')}
            onBack={() => goTo('textInput')}
          />
        )}

        {currentPage === 'data' && (
          <DataPage
            value={wearableData}
            onChange={setWearableData}
            onNext={handleGenerate}
            onBack={() => goTo('sliders')}
          />
        )}

        {currentPage === 'result' && (
          <ResultPage
            result={result}
            loading={loading}
            onSleep={() => goTo('sleep')}
            onBack={() => goTo('data')}
          />
        )}

        {currentPage === 'sleep' && (
          <SleepPage
            script={result?.sleep_closing_script}
            onExit={handleReset}
          />
        )}
      </div>
    </ParticlesProvider>
  );
}
