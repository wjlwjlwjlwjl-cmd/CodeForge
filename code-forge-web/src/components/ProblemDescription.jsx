import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import SubmitHistory from './SubmitHistory.jsx';

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
//   标签栏底色 = 左侧面板底色（--panel-bg）
//   内容区底色 = 编辑器底色（--editor-surface）
export default function ProblemDescription({
  question,
  loading,
  error,
  onRetry,
  questionId,
}) {
  const [tab, setTab] = useState('description');

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

      <div className="question-tab-content">
        {tab === 'description' ? (
          <QuestionDetailView
            question={question}
            loading={loading}
            error={error}
            onRetry={onRetry}
          />
        ) : (
          <SubmitHistory questionId={questionId} active={tab === 'history'} />
        )}
      </div>
    </div>
  );
}