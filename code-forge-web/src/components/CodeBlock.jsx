import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

// 复制到剪贴板（优先 Clipboard API，不可用时回退 execCommand）
async function copyText(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 继续走回退方案
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// 只读 + 高亮代码块：高度随代码内容自动撑开
// 右上角两个图标（仿 LeetCode）：复制到编辑区（左）、复制到剪贴板（右）
export default function CodeBlock({
  code,
  language,
  theme,
  fontSize,
  onCopyToEditor,
}) {
  const [height, setHeight] = useState(120);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleMount = (editor) => {
    const update = () => setHeight(editor.getContentHeight());
    update();
    editor.onDidContentSizeChange(update);
  };

  const handleCopyToEditor = () => {
    if (!onCopyToEditor) return;
    onCopyToEditor(code || '');
  };

  const handleCopyToClipboard = async () => {
    const ok = await copyText(code);
    if (!ok) return;
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="code-block">
      <div className="code-block-actions">
        {onCopyToEditor && (
          <button
            type="button"
            className="code-block-action"
            onClick={handleCopyToEditor}
            title="复制到代码编辑区"
            aria-label="复制到代码编辑区"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
              stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M12 3v10" />
              <polyline points="8 9 12 13 16 9" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
        )}

        <button
          type="button"
          className={`code-block-action${copied ? ' copied' : ''}`}
          onClick={handleCopyToClipboard}
          title={copied ? '已复制' : '复制到剪贴板'}
          aria-label={copied ? '已复制' : '复制到剪贴板'}
        >
          {copied ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              strokeLinejoin="round">
              <polyline points="4 12.5 9.5 18 20 6.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
              stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
              strokeLinejoin="round">
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>

      <Editor
        height={height}
        language={language}
        theme={theme}
        value={code}
        onMount={handleMount}
        options={{
          readOnly: true,
          domReadOnly: true,
          minimap: { enabled: false },
          fontSize,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          wordWrap: 'off',
          overviewRulerLanes: 0,
          renderLineHighlight: 'none',
          contextmenu: false,
          folding: false,
          glyphMargin: false,
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'auto',
            handleMouseWheel: false,
            alwaysConsumeMouseWheel: false,
          },
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
