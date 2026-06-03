import { useState, useEffect, useRef } from 'react';
import { playBowlSound, resetBowlCount } from '../services/audio';

/**
 * 语音/文字输入页 - 卡片逐个出现版
 *
 * 逻辑：每张卡片出现后等用户填写或说完，
 * 用户输入后才缓慢出现下一张卡片。
 */

const GUIDE_CARDS = [
  {
    icon: '📋',
    question: '今天发生了什么？哪件事最占精力？',
    placeholder: '比如：下午开了2小时的会，讨论项目方案...'
  },
  {
    icon: '💭',
    question: '情绪和身体有什么反应？',
    placeholder: '比如：有点烦躁，肩颈很紧，胃也不太舒服...'
  },
  {
    icon: '🌙',
    question: '今晚最想放下什么？',
    placeholder: '比如：不想再想明天的deadline了...'
  }
];

export default function TextInputPage({ value, onChange, onNext, onBack }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [answers, setAnswers] = useState(() => {
    if (value) {
      const parts = value.split('；');
      return [parts[0] || '', parts[1] || '', parts[2] || ''];
    }
    return ['', '', ''];
  });
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() =>
    'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  );
  const recognitionRef = useRef(null);
  const [activeInput, setActiveInput] = useState(null);

  // 进入页面时重置钵音音阶，从高到低递降
  useEffect(() => {
    resetBowlCount();
  }, []);

  // 第一张卡片延迟出现（先让背景音乐铺开）
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCount(1);
      playBowlSound();
    }, 4000); // 4秒后第一张卡片才出现
    return () => clearTimeout(timer);
  }, []);

  // 用户点击对号确认当前卡片，出下一张
  const handleConfirmCard = () => {
    if (visibleCount >= GUIDE_CARDS.length) return;
    playBowlSound();
    setVisibleCount(prev => prev + 1);
  };

  const handleNext = () => {
    const combined = answers.filter(a => a.trim()).join('；');
    onChange(combined);
    onNext();
  };

  const updateAnswer = (index, val) => {
    setAnswers(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };


  // 跳过当前卡片（不想填就出下一张）
  const handleSkipCard = () => {
    if (visibleCount < GUIDE_CARDS.length) {
      setVisibleCount(prev => prev + 1);
      playBowlSound();
      setCardReady(false);
    }
  };

  // 语音识别
  const toggleListening = (cardIndex) => {
    if (isListening) {
      stopListening();
    } else {
      setActiveInput(cardIndex);
      startListening(cardIndex);
    }
  };

  const startListening = (cardIndex) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = answers[cardIndex];

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      updateAnswer(cardIndex, finalTranscript + interim);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      setActiveInput(null);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setActiveInput(null);
  };

  const hasAnyInput = answers.some(a => a.trim());
  const allCardsVisible = visibleCount >= GUIDE_CARDS.length;

  return (
    <div className="page text-input-page">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}>← 返回</button>
        <h2>说说今天</h2>
      </div>

      <div className="page-content">
        <div className="guide-cards">
          {GUIDE_CARDS.map((card, index) => (
            index < visibleCount && (
              <div key={index} className="guide-card-wrapper guide-card-animated">
                <div className="guide-card">
                  <span className="guide-icon">{card.icon}</span>
                  <span className="guide-text">{card.question}</span>
                </div>
                <div className="guide-input-row">
                  <textarea
                    className={`guide-textarea ${answers[index].trim().length >= 2 ? 'completed' : ''}`}
                    placeholder={card.placeholder}
                    value={answers[index]}
                    onChange={(e) => updateAnswer(index, e.target.value)}
                    rows={2}
                    autoFocus={index === visibleCount - 1}
                  />
                  {/* 麦克风按钮始终显示 */}
                  {speechSupported && (
                    <button
                      className={`btn-mic ${isListening && activeInput === index ? 'listening' : ''}`}
                      onClick={() => toggleListening(index)}
                      title="语音输入"
                    >
                      {isListening && activeInput === index ? '⏹' : '🎙'}
                    </button>
                  )}
                  {/* 有内容后显示对号确认按钮 */}
                  {answers[index].trim().length >= 2 && index === visibleCount - 1 && !allCardsVisible && (
                    <button
                      className="input-check"
                      onClick={handleConfirmCard}
                      title="确认，下一个"
                    >
                      ✓
                    </button>
                  )}
                </div>
                {/* 当前最后一张卡片且未填写时显示跳过按钮 */}
                {index === visibleCount - 1 && !allCardsVisible && !answers[index].trim() && (
                  <button className="btn-skip-card" onClick={handleSkipCard}>
                    跳过这个 →
                  </button>
                )}
              </div>
            )
          ))}
        </div>

      </div>

      {allCardsVisible && (
        <div className="page-footer guide-card-animated">
          <button className="btn-primary" onClick={handleNext}>
            {hasAnyInput ? '继续' : '跳过，直接滑动选择状态'}
          </button>
        </div>
      )}
    </div>
  );
}
