import { useState } from 'react';
import { TAG_OPTIONS, DEMO_INPUT } from '../services/demoData';

/**
 * 标签勾选页 - 步骤 3
 * 四类标签：情绪、身体、行为、睡前状态
 */
export default function TagsPage({ value, onChange, onNext, onBack }) {
  const [selected, setSelected] = useState(value || {
    emotion_tags: [],
    body_tags: [],
    behavior_tags: [],
    sleep_state_tags: []
  });

  const toggleTag = (category, tag) => {
    setSelected(prev => {
      const current = prev[category] || [];
      const updated = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag];
      return { ...prev, [category]: updated };
    });
  };

  const handleNext = () => {
    onChange(selected);
    onNext();
  };

  const handleDemo = () => {
    setSelected({
      emotion_tags: DEMO_INPUT.emotion_tags,
      body_tags: DEMO_INPUT.body_tags,
      behavior_tags: DEMO_INPUT.behavior_tags,
      sleep_state_tags: DEMO_INPUT.sleep_state_tags
    });
  };

  return (
    <div className="page tags-page">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}>← 返回</button>
        <h2>点选状态</h2>
      </div>

      <div className="page-content">
        <p className="page-hint">勾选符合你当前的状态，可多选</p>

        {Object.entries(TAG_OPTIONS).map(([key, { label, options }]) => (
          <div key={key} className="tag-group">
            <h3 className="tag-group-title">{label}</h3>
            <div className="tag-list">
              {options.map(tag => (
                <button
                  key={tag}
                  className={`tag-btn ${(selected[key] || []).includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(key, tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button className="btn-demo" onClick={handleDemo}>
          📝 使用示例选择
        </button>
      </div>

      <div className="page-footer">
        <button className="btn-primary" onClick={handleNext}>
          继续
        </button>
      </div>
    </div>
  );
}
