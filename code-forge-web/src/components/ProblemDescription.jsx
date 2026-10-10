import { useEffect, useRef, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import SubmitHistory from './SubmitHistory.jsx';
import SubmitDetail from './SubmitDetail.jsx';
import JudgeResultView from './JudgeResultView.jsx';

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

      {error && <div className="question-inline-error">{error}</div>}

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

// 左侧面板标签栏：
//   固定：题目描述、提交记录
//   动态：提交详情 / 判题结果（各带关闭按钮）
// 顶栏底色 = 左侧面板底色（--panel-bg）；内容区 = 编辑器底色（--editor-surface）
export default function ProblemDescription({
  question,
  loading,
  error,
  onRetry,
  questionId,
  monacoTheme,
  editorFontSize,
  result,
  submitError,
}) {
  const [tab, setTab] = useState('description');
  // 当前查看的提交详情 { submitId }
  const [detail, setDetail] = useState(null);

  // 记住打开动态标签前的标签，关闭后回到那里
  const prevTabRef = useRef('description');
  const tabRef = useRef(tab);
  tabRef.current = tab;

  // 服务端推送判题结果（或提交失败）时，自动切到「判题结果」标签
  useEffect(() => {
    if (!result && !submitError) return;
    const cur = tabRef.current;
    if (cur !== 'detail' && cur !== 'result') prevTabRef.current = cur;
    setTab('result');
  }, [result, submitError]);

  // 切换题目时，动态标签属于上一题，退回题目描述
  useEffect(() => {
    setTab((t) => (t === 'detail' || t === 'result' ? 'description' : t));
    setDetail(null);
  }, [questionId]);

  const openDetail = (item) => {
    prevTabRef.current = 'history';
    setDetail({ submitId: item.submitId });
    setTab('detail');
  };

  const closeTab = () => {
    setTab(prevTabRef.current || 'description');
  };

  const showBackRow = tab === 'detail' || tab === 'result';

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

        {tab === 'detail' && (
          <div className="question-tab active question-tab-closable">
            <span>提交详情</span>
            <button
              type="button"
              className="tab-close"
              onClick={closeTab}
              title="关闭"
              aria-label="关闭"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none"
                stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
                strokeLinejoin="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {tab === 'result' && (
          <div className="question-tab active question-tab-closable">
            <span>判题结果</span>
            <button
              type="button"
              className="tab-close"
              onClick={closeTab}
              title="关闭"
              aria-label="关闭"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none"
                stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
                strokeLinejoin="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 提交详情 / 判题结果页的「全部提交记录」返回行 */}
      {showBackRow && (
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
            onSelect={openDetail}
          />
        )}

        {tab === 'detail' && detail && (
          <SubmitDetail
            submitId={detail.submitId}
            monacoTheme={monacoTheme}
            editorFontSize={editorFontSize}
          />
        )}

        {tab === 'result' && (
          <JudgeResultView
            result={result}
            submitError={submitError}
            monacoTheme={monacoTheme}
            editorFontSize={editorFontSize}
          />
        )}
      </div>
    </div>
  );
}