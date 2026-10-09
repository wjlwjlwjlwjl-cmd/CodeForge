import { useCallback, useEffect, useState } from 'react';
import Layout from './components/Layout.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import { useQuestion } from './hooks/useQuestion.js';
import { useJudge } from './hooks/useJudge.js';
import { usePreferences } from './hooks/usePreferences.js';

// 从 URL query 解析题目 id（如 ?id=802）
function parseIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id == null || id.trim() === '') return null;
  return id.trim();
}

export default function App() {
  const [currentId, setCurrentId] = useState(parseIdFromQuery);
  const {
    theme,
    monacoTheme,
    toggleTheme,
    editorFontSize,
    setEditorFontSize,
    zoom,
    splitRatio,
    setSplitRatio,
    vimMode,
    setVimMode,
  } = usePreferences();

  // 切换题目：更新 state，并把 ?id= 同步到地址栏（不新增历史记录）
  const handleSwitchQuestion = useCallback((newId) => {
    setCurrentId(String(newId));
    const url = new URL(window.location.href);
    url.searchParams.set('id', newId);
    window.history.replaceState(null, '', url);
  }, []);

  const {
    data: question,
    loading: questionLoading,
    error: questionError,
    notice: questionNotice,
    clearNotice,
    retry,
    switching,
    goPrev,
    goNext,
  } = useQuestion(currentId, { onSwitch: handleSwitchQuestion });

  const { result, judging, submitError, submit } = useJudge(currentId);

  // 将主题同步到 <html> 元素，确保 body、overscroll 区域、浏览器原生滚动条
  // 都能取到正确的暗/亮色 CSS 变量（:root 变量在 html 层面切换）
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // 边界提示 toast：3 秒后自动消失
  useEffect(() => {
    if (!questionNotice) return;
    const t = setTimeout(() => clearNotice?.(), 3000);
    return () => clearTimeout(t);
  }, [questionNotice, clearNotice]);

  return (
    <div className="app" data-theme={theme} style={{ zoom: zoom }}>
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-brand">
            <img className="app-logo" src="/code.png" alt="" aria-hidden="true" />
            <span className="app-brand-name">Code Forge</span>
          </div>

          {currentId != null && (
            <div className="question-nav">
              <button
                type="button"
                className="nav-btn"
                onClick={goPrev}
                disabled={switching}
                title="上一题"
                aria-label="上一题"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                  stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
                  strokeLinejoin="round">
                  <polyline points="15 5 8 12 15 19" />
                </svg>
              </button>
              <button
                type="button"
                className="nav-btn"
                onClick={goNext}
                disabled={switching}
                title="下一题"
                aria-label="下一题"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                  stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
                  strokeLinejoin="round">
                  <polyline points="9 5 16 12 9 19" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="app-header-actions">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      {/* 边界提示：屏幕中央弹出的灰底 toast */}
      {questionNotice && (
        <div className="toast" role="status" aria-live="polite">
          {questionNotice}
        </div>
      )}

      {currentId == null ? (
        <div className="panel-center">
          <div className="error-text">缺少题目 ID，请在 URL 后加 ?id= 指定题目（如 ?id=802）</div>
        </div>
      ) : (
        <Layout
          question={question}
          questionId={currentId}
          questionLoading={questionLoading}
          questionError={questionError}
          onRetry={retry}
          monacoTheme={monacoTheme}
          editorFontSize={editorFontSize}
          onEditorFontSizeChange={setEditorFontSize}
          vimMode={vimMode}
          onVimModeChange={setVimMode}
          judging={judging}
          result={result}
          submitError={submitError}
          onSubmit={submit}
          splitRatio={splitRatio}
          onSplitRatioChange={setSplitRatio}
        />
      )}
    </div>
  );
}
