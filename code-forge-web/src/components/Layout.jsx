import { useCallback, useRef, useState } from 'react';
import ProblemDescription from './ProblemDescription.jsx';
import CodeEditor from './CodeEditor.jsx';

// Islands 布局：每个面板是独立「小岛」（圆角 + 间隙 + 背景底色），
// 中间通过可拖拽分割条调整左右宽度比例，比例持久化到 localStorage。
export default function Layout({
  question,
  questionId,
  questionLoading,
  questionError,
  onRetry,
  monacoTheme,
  editorFontSize,
  onEditorFontSizeChange,
  vimMode,
  onVimModeChange,
  judging,
  result,
  submitError,
  onSubmit,
  splitRatio,
  onSplitRatioChange,
}) {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragMove = useCallback(
    (e) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
      const ratio = Math.min(0.8, Math.max(0.2, x / rect.width));
      onSplitRatioChange(ratio);
    },
    [dragging, onSplitRatioChange]
  );

  const handleDragEnd = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div
      className={`layout ${dragging ? 'is-dragging' : ''}`}
      ref={containerRef}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      <div className="island island-left" style={{ flexBasis: `${splitRatio * 100}%` }}>
        <ProblemDescription
          question={question}
          questionId={questionId}
          loading={questionLoading}
          error={questionError}
          onRetry={onRetry}
          monacoTheme={monacoTheme}
          editorFontSize={editorFontSize}
        />
      </div>

      <div className="splitter" onMouseDown={handleDragStart}>
        <div className="splitter-handle" />
      </div>

      <div className="island island-right">
        <CodeEditor
          defaultCode={question?.defaultCode || ''}
          monacoTheme={monacoTheme}
          editorFontSize={editorFontSize}
          onEditorFontSizeChange={onEditorFontSizeChange}
          vimMode={vimMode}
          onVimModeChange={onVimModeChange}
          judging={judging}
          result={result}
          submitError={submitError}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
