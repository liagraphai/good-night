/**
 * 结果页 - Day 2 步骤 6
 * 新增：整体体感一句话 + 行为线索卡片
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
        {/* 整体体感一句话（Day 2 新增） */}
        {result.one_sentence_summary && (
          <div className="summary-banner">
            <p className="summary-text">{result.one_sentence_summary}</p>
          </div>
        )}

        {/* 核心洞察 */}
        <div className="insight-main">
          <p className="insight-text">{result.insight}</p>
        </div>

        {/* 卡片组 */}
        <div className="result-cards">
          <div className="result-card card-emotion">
            <h4>🌤 情绪天气</h4>
            <p>{result.emotion_weather}</p>
          </div>

          <div className="result-card card-body">
            <h4>🫀 身体信号</h4>
            <div className="body-signals">
              {result.body_signals?.map((signal, i) => (
                <span key={i} className="signal-tag">{signal}</span>
              ))}
            </div>
          </div>

          {/* 行为线索（Day 2 新增） */}
          {result.behavior_clues && (
            <div className="result-card card-behavior">
              <h4>📱 行为线索</h4>
              <p>{result.behavior_clues}</p>
            </div>
          )}

          <div className="result-card card-data">
            <h4>📊 数据线索</h4>
            <p>{result.data_clues}</p>
          </div>

          <div className="result-card card-action">
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
