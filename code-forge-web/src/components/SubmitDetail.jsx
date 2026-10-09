import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useSubmitDetail } from '../hooks/useSubmitDetail.js';
import { PASS_STATUS, PROGRAM_TYPES, PROGRAM_LANG } from '../config.js';

// 提交时间：ISO 字符串 → 2026-10-09 18:18:03
function formatTime(t) {
  if (!t) return '—';
  return String(t).replace('T', ' ').slice(0, 19);
}

// 执行用时：仅「通过」展示，其余为 N/A
function formatRunTime(pass, runTime) {
  if (pass === 4 && runTime != null) return `${runTime} ms`;
  return 'N/A';
}

// 只读 + 高亮代码块：高度随代码内容自动撑开
function CodeBlock({ code, language, theme, fontSize }) {
  const [height, setHeight] = useState(120);

  const handleMount = (editor) => {
    const update = () => setHeight(editor.getContentHeight());
    update();
    // 内容尺寸变化（如字体切换）时同步高度
    const sub = editor.onDidContentSizeChange(update);
    editor.__heightSub = sub;
  };

  return (
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
  );
}

// 提交详情：状态作标题 + 提交时间 + 语言/执行用时，最下方为只读高亮代码块
export default function SubmitDetail({ submitId, monacoTheme, editorFontSize }) {
  const { data, loading, error, reload } = useSubmitDetail(submitId);

  if (loading) {
    return <div className="panel-center">加载中…</div>;
  }

  if (error) {
    return (
      <div className="panel-center">
        <div className="error-text">{error}</div>
        <button type="button" onClick={reload}>重试</button>
      </div>
    );
  }

  if (!data) {
    return <div className="panel-center">暂无提交信息</div>;
  }

  const status = PASS_STATUS[data.pass] || { text: '未知', kind: 'muted' };
  const language = PROGRAM_TYPES[data.programType] ?? '—';
  const monacoLang = PROGRAM_LANG[data.programType] ?? 'plaintext';

  return (
    <div className="submit-detail">
      {/* 结果状态作标题，下方提交时间，再下方语言与执行用时 */}
      <div className="detail-header">
        <h2 className={`detail-status status-${status.kind}`}>{status.text}</h2>
        <div className="detail-time">{formatTime(data.createTime)}</div>
        <div className="detail-meta">
          <span className="detail-meta-item">
            <span className="detail-label">语言</span>
            <span className="detail-value">{language}</span>
          </span>
          <span className="detail-meta-item">
            <span className="detail-label">执行用时</span>
            <span className="detail-value">{formatRunTime(data.pass, data.runTime)}</span>
          </span>
        </div>
      </div>

      {/* 用户代码：只读 + 高亮，圆角块，高度随代码撑开 */}
      <div className="detail-code-block">
        <CodeBlock
          code={data.userCode || ''}
          language={monacoLang}
          theme={monacoTheme}
          fontSize={editorFontSize}
        />
      </div>
    </div>
  );
}