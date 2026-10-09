import { useSubmitHistory } from '../hooks/useSubmitHistory.js';
import { PASS_STATUS, PROGRAM_TYPES } from '../config.js';

// 提交时间：后端返回 ISO 字符串（如 2026-10-09T18:18:03）→ 2026-10-09 18:18:03
function formatTime(t) {
  if (!t) return '—';
  return String(t).replace('T', ' ').slice(0, 19);
}

// 执行用时：仅「通过」展示，其余为 N/A
function formatRunTime(pass, runTime) {
  if (pass === 4 && runTime != null) return `${runTime} ms`;
  return 'N/A';
}

// 空提交记录占位图标（收件箱 / 空盒子）
function EmptyIcon() {
  return (
    <svg
      className="history-empty-icon"
      viewBox="0 0 64 64"
      width="72"
      height="72"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 36 16 14h32l8 22v12a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V36Z" />
      <path d="M8 36h14l4 7h12l4-7h14" />
    </svg>
  );
}

// 左侧「提交记录」标签页内容
export default function SubmitHistory({ questionId, active, onSelect }) {
  const { list, total, loading, error, reload } = useSubmitHistory(questionId, active);

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

  if (!list.length) {
    return (
      <div className="history-empty">
        <EmptyIcon />
        <p className="history-empty-text">暂无提交记录</p>
      </div>
    );
  }

  return (
    <div className="submit-history">
      <div className="history-head">
        <span>序号</span>
        <span>结果状态</span>
        <span>提交时间</span>
        <span>语言</span>
        <span>执行用时</span>
      </div>

      {list.map((item, i) => {
        const status = PASS_STATUS[item.pass] || { text: '未知', kind: 'muted' };
        // 序号：列表按时间倒序（最新在最上），因此顶部序号最大 → total - i
        const seq = total - i;
        return (
          <div
            className="history-row"
            key={item.submitId ?? `${i}`}
            role="button"
            tabIndex={0}
            title="查看提交详情"
            onClick={() => onSelect?.(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.(item);
              }
            }}
          >
            <span className="history-index">{seq}</span>
            <span className={`history-status status-${status.kind}`}>
              {status.text}
            </span>
            <span className="history-time">{formatTime(item.createTime)}</span>
            <span className="history-lang">
              {PROGRAM_TYPES[item.programType] ?? '—'}
            </span>
            <span className="history-runtime">
              {formatRunTime(item.pass, item.runTime)}
            </span>
          </div>
        );
      })}
    </div>
  );
}