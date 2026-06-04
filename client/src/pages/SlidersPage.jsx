import { useState, useEffect, useRef } from 'react';
import { SLIDER_CONFIG } from '../services/demoData';
import { playSliderTone, playTransitionSound } from '../services/audio';

/**
 * 滑杆输入页 - 逐组出现版
 *
 * 三组滑杆（情绪、身体、行为）逐个蹦出来，
 * 用户调完每组点对号确认后出下一组。
 */
export default function SlidersPage({ value, onChange, onNext, onBack }) {
  const [sliders, setSliders] = useState(value || {
    emotion: { calm_excited: 50, sad_happy: 50, relaxed_stressed: 50 },
    body: { head_clear_heavy: 50, neck_relaxed_tense: 50, limbs_warm_weak: 50 },
    behavior: { sedentary_active: 50, phone_social: 50, chaotic_rhythmic: 50 }
  });

  const [visibleGroup, setVisibleGroup] = useState(0);
  const groups = Object.entries(SLIDER_CONFIG); // [['emotion', {...}], ['body', {...}], ['behavior', {...}]]
  const allGroupsVisible = visibleGroup >= groups.length;

  // 第一组延迟出现（不用钵音，安静浮现）
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleGroup(1);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 检测当前组是否有调整（任意滑杆不等于50）
  const isGroupTouched = (groupKey) => {
    const groupValues = sliders[groupKey];
    if (!groupValues) return false;
    return Object.values(groupValues).some(v => v !== 50);
  };

  // 点击对号确认当前组，出下一组（用过渡琶音代替钵音）
  const handleConfirmGroup = () => {
    if (visibleGroup >= groups.length) return;
    playTransitionSound();
    setVisibleGroup(prev => prev + 1);
  };

  // 跳过当前组
  const handleSkipGroup = () => {
    if (visibleGroup >= groups.length) return;
    setVisibleGroup(prev => prev + 1);
  };

  // 节流：滑杆音效每 150ms 最多触发一次
  const lastToneTime = useRef(0);

  const handleSliderChange = (group, key, val) => {
    const numVal = Number(val);
    setSliders(prev => ({
      ...prev,
      [group]: { ...prev[group], [key]: numVal }
    }));

    // 节流播放音效
    const now = Date.now();
    if (now - lastToneTime.current > 150) {
      playSliderTone(numVal);
      lastToneTime.current = now;
    }
  };

  const handleNext = () => {
    onChange(sliders);
    onNext();
  };

  // 根据数值给出简短实时提示
  const getHint = (val, left, right) => {
    if (val <= 30) return `偏${left}`;
    if (val >= 70) return `偏${right}`;
    return '中间';
  };

  return (
    <div className="page sliders-page">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}>← 返回</button>
        <h2>滑动选择状态</h2>
      </div>

      <div className="page-content">
        <p className="page-hint">拖动滑杆到符合你当前的位置</p>

        {groups.map(([groupKey, group], index) => (
          index < visibleGroup && (
            <div
              key={groupKey}
              className="slider-group guide-card-animated"
              style={{ '--group-color': group.color }}
            >
              <div className="slider-group-header">
                <h3 className="slider-group-title" style={{ color: group.color }}>
                  {group.label}
                </h3>
                {/* 当前最后一组显示确认/跳过 */}
                {index === visibleGroup - 1 && !allGroupsVisible && (
                  isGroupTouched(groupKey) ? (
                    <button className="input-check" onClick={handleConfirmGroup} title="确认，下一组">
                      ✓
                    </button>
                  ) : (
                    <button className="btn-skip-card" onClick={handleSkipGroup}>
                      跳过 →
                    </button>
                  )
                )}
                {/* 已确认的组显示静态对号 */}
                {index < visibleGroup - 1 && isGroupTouched(groupKey) && (
                  <span className="input-check-static">✓</span>
                )}
              </div>
              {group.sliders.map(slider => {
                const val = sliders[groupKey]?.[slider.key] ?? 50;
                return (
                  <div key={slider.key} className="slider-item">
                    <div className="slider-labels">
                      <span className="slider-left">{slider.left}</span>
                      <span className="slider-hint">{getHint(val, slider.left, slider.right)}</span>
                      <span className="slider-right">{slider.right}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={val}
                      onChange={(e) => handleSliderChange(groupKey, slider.key, e.target.value)}
                      className="slider-range"
                      style={{ '--slider-fill': `${val}%` }}
                    />
                  </div>
                );
              })}
            </div>
          )
        ))}

      </div>

      {allGroupsVisible && (
        <div className="page-footer guide-card-animated">
          <button className="btn-primary" onClick={handleNext}>
            继续
          </button>
        </div>
      )}
    </div>
  );
}
