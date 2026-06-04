import { DEFAULT_WEARABLE_DATA, WEARABLE_LABELS } from '../services/demoData';

/**
 * 数据页 - 步骤 4
 * 展示模拟可穿戴数据（玻璃态卡片 + 入场动画）
 */
export default function DataPage({ value, onChange, onNext, onBack }) {
  const data = value || DEFAULT_WEARABLE_DATA;

  const handleNext = () => {
    onChange(data);
    onNext();
  };

  return (
    <div className="page data-page">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}>← 返回</button>
        <h2>今晚数据</h2>
      </div>

      <div className="page-content">
        <p className="page-hint">以下是你今天的身体数据（模拟）</p>

        <div className="data-cards">
          {Object.entries(data).map(([key, val], index) => {
            const meta = WEARABLE_LABELS[key];
            if (!meta) return null;
            return (
              <div
                key={key}
                className="data-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="data-icon">{meta.icon}</span>
                <span className="data-label">{meta.label}</span>
                <span className="data-value">
                  {val} <small>{meta.unit}</small>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="page-footer">
        <button className="btn-primary btn-generate" onClick={handleNext}>
          ✨ 生成今晚洞察
        </button>
      </div>
    </div>
  );
}
