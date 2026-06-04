/**
 * 结果页 - Day 2 步骤 6
 * 玻璃态分色卡片 + 错开入场动画
 */
export default function ResultPage({ result, loading, onSleep, onBack }) {
  if (loading) {
    return (
      <div className="page result-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">正在生成今晚洞察...</p>
          <p className="loading-hint">大约需要几秒钟</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="page result-page">
        <p>暂无结果</p>
        <button className="btn-back" onClick={onBack}>返回重试</button>
      </div>
    );
  }

  return (
    <div className="page result-page">
      <div className="page-header">
        <h2>今晚洞察</h2>
      </div>

      <div className="page-content">
        {/* 整体体感一句话 */}
        {result.one_sentence_summary && (
          <div className="summary-banner">
            <p className="summary-text">{result.one_sentence_summary}</p>
          </div>
        )}

        {/* 核心洞察 */}
        <div className="insight-main">
          <p className="insight-text">{result.insight}</p>
        </div>

        {/* 卡片组 — 分色 + 错开入场 */}
        <div className="result-cards">
          <div className="result-card card-emotion" style={{ animationDelay: '0.1s' }}>
            <h4>🌤 情绪天气</h4>
            <p>{result.emotion_weather}</p>
          </div>

          <div className="result-card card-body" style={{ animationDelay: '0.2s' }}>
            <h4>🫀 身体信号</h4>
            <div className="body-signals">
              {result.body_signals?.map((signal, i) => (
                <span key={i} className="signal-tag">{signal}</span>
              ))}
            </div>
          </div>

          {result.behavior_clues && (
            <div className="result-card card-behavior" style={{ animationDelay: '0.3s' }}>
              <h4>📱 行为线索</h4>
              <p>{result.behavior_clues}</p>
            </div>
          )}

          <div className="result-card card-data" style={{ animationDelay: '0.4s' }}>
            <h4>📊 数据线索</h4>
            <p>{result.data_clues}</p>
          </div>

          <div className="result-card card-action" style={{ animationDelay: '0.5s' }}>
            <h4>🌙 今晚微行动</h4>
            <p>{result.tonight_action}</p>
          </div>
        </div>
      </div>

      <div className="page-footer">
        <button className="btn-primary btn-sleep" onClick={onSleep}>
          🌙 进入睡眠模式
        </button>
      </div>
    </div>
  );
}
