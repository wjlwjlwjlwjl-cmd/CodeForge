import { useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { LANGUAGES } from '../config.js';
import JudgeResultPanel from './JudgeResultPanel.jsx';

const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 32;
const FONT_SIZE_STEP = 1;

// 右侧：语言下拉 + Monaco 编辑器 + 提交按钮 + 判题结果
export default function CodeEditor({
  defaultCode,
  monacoTheme,
  editorFontSize,
  onEditorFontSizeChange,
  judging,
  result,
  submitError,
  onSubmit,
}) {
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(defaultCode || '');

  // 当题目切换（defaultCode 变化）时回填编辑器
  useEffect(() => {
    setCode(defaultCode || '');
  }, [defaultCode]);

  const fontSize = editorFontSize;

  const handleSubmit = () => {
    onSubmit(code);
  };

  const handleResetCode = () => {
    setCode(defaultCode || '');
  };

  const changeFontSize = useCallback((delta) => {
    onEditorFontSizeChange((prev) =>
      Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, prev + delta))
    );
  }, [onEditorFontSizeChange]);

  return (
    <div className="code-editor">
      <div className="editor-toolbar">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="language-select"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value} disabled={!lang.enabled}>
              {lang.label}
              {!lang.enabled ? '（暂不支持）' : ''}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="reset-btn"
          onClick={handleResetCode}
          title="恢复默认代码"
        >
          恢复默认
        </button>

        <div className="font-size-control">
          <button
            type="button"
            onClick={() => changeFontSize(-FONT_SIZE_STEP)}
            disabled={fontSize <= FONT_SIZE_MIN}
            title="减小字号"
            aria-label="减小字号"
          >
            A-
          </button>
          <span className="font-size-value">{fontSize}</span>
          <button
            type="button"
            onClick={() => changeFontSize(FONT_SIZE_STEP)}
            disabled={fontSize >= FONT_SIZE_MAX}
            title="增大字号"
            aria-label="增大字号"
          >
            A+
          </button>
        </div>

        <button
          type="button"
          className="submit-btn"
          onClick={handleSubmit}
          disabled={judging}
        >
          {judging ? '判题中…' : '提交'}
        </button>
      </div>

      <div className="editor-container">
        <Editor
          height="100%"
          language={language}
          theme={monacoTheme}
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'off',
          }}
        />
      </div>

      <JudgeResultPanel result={result} judging={judging} error={submitError} />
    </div>
  );
}
