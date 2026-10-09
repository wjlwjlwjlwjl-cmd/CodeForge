import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { initVimMode } from 'monaco-vim';
import { LANGUAGES } from '../config.js';
import JudgeResultPanel from './JudgeResultPanel.jsx';

const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 32;
const FONT_SIZE_STEP = 1;

// 提交冷却：两次提交至少间隔（秒）
const SUBMIT_COOLDOWN_SEC = 4;

// 右侧：语言下拉 + Monaco 编辑器 + 提交按钮 + 判题结果
export default function CodeEditor({
  defaultCode,
  monacoTheme,
  editorFontSize,
  onEditorFontSizeChange,
  vimMode,
  onVimModeChange,
  judging,
  result,
  submitError,
  onSubmit,
}) {
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(defaultCode || '');
  const editorRef = useRef(null);
  const vimStatusRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);
  // 提交冷却剩余秒数
  const [cooldown, setCooldown] = useState(0);

  // 冷却倒计时（每秒减一）
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // 题目切换时重置冷却
  useEffect(() => {
    setCooldown(0);
  }, [defaultCode]);

  // 当题目切换（defaultCode 变化）时回填编辑器
  useEffect(() => {
    setCode(defaultCode || '');
  }, [defaultCode]);

  // 启用/禁用 Vim 模式（编辑器挂载完成后，根据开关初始化或销毁）
  useEffect(() => {
    if (!vimMode || !editorReady) return;
    const editor = editorRef.current;
    const statusNode = vimStatusRef.current;
    if (!editor || !statusNode) {
      console.warn('[vim] 编辑器或状态栏节点未就绪，跳过初始化');
      return;
    }
    let vim;
    try {
      vim = initVimMode(editor, statusNode);
      console.info('[vim] Vim 模式已启用');
    } catch (err) {
      console.error('[vim] 初始化失败:', err);
      return;
    }
    // 让编辑器获得焦点，确保 Vim 能立即接管键盘输入
    editor.focus();
    return () => {
      try {
        vim.dispose();
      } catch (err) {
        console.error('[vim] 销毁失败:', err);
      }
    };
  }, [vimMode, editorReady]);

  const fontSize = editorFontSize;

  const handleSubmit = () => {
    // 判题中或冷却中不允许提交
    if (judging || cooldown > 0) return;
    onSubmit(code);
    setCooldown(SUBMIT_COOLDOWN_SEC);
  };

  const handleResetCode = () => {
    setCode(defaultCode || '');
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    setEditorReady(true);
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
          className={`vim-toggle${vimMode ? ' active' : ''}`}
          onClick={() => onVimModeChange(!vimMode)}
          title={vimMode ? '关闭 Vim 模式' : '开启 Vim 模式'}
        >
          Vim
        </button>

        <button
          type="button"
          className="submit-btn"
          onClick={handleSubmit}
          disabled={judging || cooldown > 0}
        >
          {judging
            ? '判题中…'
            : cooldown > 0
              ? `提交 (${cooldown}s)`
              : '提交'}
        </button>
      </div>

      <div className="editor-container">
        <Editor
          height="100%"
          language={language}
          theme={monacoTheme}
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorMount}
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

      {vimMode && <div ref={vimStatusRef} className="vim-status-bar" />}

      <JudgeResultPanel result={result} judging={judging} error={submitError} />
    </div>
  );
}
