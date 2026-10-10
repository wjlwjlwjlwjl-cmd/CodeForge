import { useSubmitDetail } from '../hooks/useSubmitDetail.js';
import { PASS_STATUS, PROGRAM_TYPES, PROGRAM_LANG } from '../config.js';
import CodeBlock from './CodeBlock.jsx';
import { formatDateTime, formatRunTime } from '../utils/format.js';

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
        <div className="detail-time">{formatDateTime(data.createTime)}</div>
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