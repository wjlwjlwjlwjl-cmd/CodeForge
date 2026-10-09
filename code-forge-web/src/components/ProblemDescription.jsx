import { useEffect, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import SubmitHistory from './SubmitHistory.jsx';
import SubmitDetail from './SubmitDetail.jsx';

// 「题目描述」标签页内容：标题 + 限制 + markdown 题面
function QuestionDetailView({ question, loading, error, onRetry }) {
  if (loading) {
    return <div className="panel-center">加载中…</div>;
  }

  if (error && !question) {
    return (
      <div className="panel-center">
        <div className="error-text">{error}</div>
        <button type="button" onClick={onRetry}>重试</button>
      </div>
    );
  }

  if (!question) {
    return <div className="panel-center">暂无题目数据</div>;
  }

  return (
    <div className="problem-description">
      <h1 className="question-title">{question.title}</h1>

      {/* 切换/加载失败时的错误提示（保留已展示的题面） */}
      {error && <div className="question-inline-error">{error}</div>}

      {/* 可选：展示难度/时间/空间限制。后端字段：difficulty / timeLimit / spaceLimit */}
      {(question.timeLimit != null || question.spaceLimit != null) && (
        <div className="question-meta">
          {question.timeLimit != null && (
            <span className="meta-item">时间限制：{question.timeLimit} ms</span>
          )}
          {question.spaceLimit != null && (
            <span className="meta-item">空间限制：{question.spaceLimit} KB</span>
          )}
        </div>
      )}
      <MarkdownRenderer content={question.content} />
    </div>
  );
}

// 左侧面板：顶部标签栏（题目描述 / 提交记录）+ 内容区
//   标签栏底色 = 区域空隙底色（--bg）
//   内容区底色 = 编辑器底色（--editor-surface）
// 查看提交详情时，标签栏下方多出一行「← 全部提交记录」返回按钮（用一道细线隔开）
export default function ProblemDescription({
  question,
  loading,
  error,
  onRetry,
  questionId,
  monacoTheme,
  editorFontSize,
}) {
  const [tab, setTab] = useState('description');
  // 当前查看的提交详情 { submitId }
  const [detail, setDetail] = useState(null);

  // 切换题目时，提交详情属于上一题，退回题目描述
  useEffect(() => {
    setTab((t) => (t === 'detail' ? 'description' : t));
    setDetail(null);
  }, [questionId]);

  const handleSelectSubmit = (item) => {
    setDetail({ submitId: item.submitId });
    setTab('detail');
  };

  return (
    <div className="question-panel">
      <div className="question-tabs">
        <button
          type="button"
          className={`question-tab${tab === 'description' ? ' active' : ''}`}
          onClick={() => setTab('description')}
        >
          题目描述
        </button>
        <button
          type="button"
          className={`question-tab${tab === 'history' ? ' active' : ''}`}
          onClick={() => setTab('history')}
        >
          提交记录
        </button>
      </div>

      {/* 提交详情：返回提交记录的一行（顶栏下方，细线隔开） */}
      {tab === 'detail' && (
        <div className="detail-back-row">
          <button
            type="button"
            className="detail-back"
            onClick={() => setTab('history')}
          >
            ← 全部提交记录
          </button>
        </div>
      )}

      <div className="question-tab-content">
        {tab === 'description' && (
          <QuestionDetailView
            question={question}
            loading={loading}
            error={error}
            onRetry={onRetry}
          />
        )}

        {tab === 'history' && (
          <SubmitHistory
            questionId={questionId}
            active
            onSelect={handleSelectSubmit}
          />
        )}

        {tab === 'detail' && detail && (
          <SubmitDetail
            submitId={detail.submitId}
            monacoTheme={monacoTheme}
            editorFontSize={editorFontSize}
          />
        )}
      </div>
    </div>
  );
}