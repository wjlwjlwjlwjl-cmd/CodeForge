import MarkdownRenderer from './MarkdownRenderer.jsx';

// 左侧题面：标题 + 内容（content 已是 markdown，含示例）
export default function ProblemDescription({ question, loading, error, onRetry }) {
  if (loading) {
    return <div className="panel-center">加载中…</div>;
  }

  if (error) {
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
