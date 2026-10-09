import { useEffect, useMemo } from 'react';
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
  const id = useMemo(parseIdFromQuery, []);
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

  const { data: question, loading: questionLoading, error: questionError, retry } = useQuestion(id);
  const { result, judging, submitError, submit } = useJudge(id);

  // 将主题同步到 <html> 元素，确保 body、overscroll 区域、浏览器原生滚动条
  // 都能取到正确的暗/亮色 CSS 变量（:root 变量在 html 层面切换）
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="app" data-theme={theme} style={{ zoom: zoom }}>
      <header className="app-header">
        <div className="app-brand">Code Forge</div>
        <div className="app-header-actions">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      {id == null ? (
        <div className="panel-center">
          <div className="error-text">缺少题目 ID，请在 URL 后加 ?id= 指定题目（如 ?id=802）</div>
        </div>
      ) : (
        <Layout
          question={question}
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
