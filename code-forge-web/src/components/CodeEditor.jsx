import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import Editor from '@monaco-editor/react';
import { initVimMode } from 'monaco-vim';
import { LANGUAGES } from '../config.js';

const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 32;
const FONT_SIZE_STEP = 1;

// 提交最小间隔（与后端 CacheConstants.SUBMIT_INTERVAL_SEC 保持一致）。
// 注意：后端对过于频繁的提交是「静默忽略」并仍返回成功，
// 所以这个限制必须由前端自己拦截并提示。
const SUBMIT_COOLDOWN_MS = 4000;

// 提交过于频繁时的提示
const TOO_FREQUENT_MSG = '提交过于频繁，请稍后重试';

// 右侧：语言下拉 + Monaco 编辑器 + 提交按钮 + 判题结果
// 通过 ref 暴露 setCode（给「提交详情 / 判题结果」的代码块用：复制到编辑区）
const CodeEditor = forwardRef(function CodeEditor({
  defaultCode,
  monacoTheme,
  editorFontSize,
  onEditorFontSizeChange,
  vimMode,
  onVimModeChange,
  judging,
  onSubmit,
}, ref) {
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(defaultCode || '');
  const editorRef = useRef(null);
  const vimStatusRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);
  // 上次提交时间戳（用于前端拦截过于频繁的提交）
  const lastSubmitAtRef = useRef(0);
  // 报错弹窗文案（如「提交过于频繁，请稍后重试」）
  const [notice, setNotice] = useState('');

  // 题目切换时重置间隔限制
  useEffect(() => {
    lastSubmitAtRef.current = 0;
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

  // 用整段代码覆盖编辑区（复制到编辑区）
  useImperativeHandle(ref, () => ({
    setCode: (value) => setCode(value || ''),
  }), []);

  const handleSubmit = () => {
    // 判题中不允许重复提交
    if (judging) return;

    const elapsed = Date.now() - lastSubmitAtRef.current;
    if (lastSubmitAtRef.current && elapsed < SUBMIT_COOLDOWN_MS) {
      setNotice(TOO_FREQUENT_MSG);
      return;
    }

    lastSubmitAtRef.current = Date.now();
    onSubmit(code);
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
          className={`submit-btn${judging ? ' is-judging' : ''}`}
          onClick={handleSubmit}
          disabled={judging}
        >
          {judging ? '正在判题…' : '提交'}
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

      {/* 报错弹窗（例如提交过于频繁） */}
      {notice && (
        <div
          className="dialog-backdrop"
          onClick={() => setNotice('')}
          role="presentation"
        >
          <div
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-title">提交失败</div>
            <div className="dialog-body">{notice}</div>
            <div className="dialog-actions">
              <button
                type="button"
                className="dialog-ok"
                onClick={() => setNotice('')}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CodeEditor;
