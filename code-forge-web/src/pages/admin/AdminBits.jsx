// B 端通用小部件：状态点、空态、提示条、确认弹窗、图标
// 刻意做得很薄，避免变成一套「组件库」

// 状态：小圆点 + 文字（不用淡色胶囊）
//   kind: 'ok' | 'bad' | 'neutral'
export function StatusDot({ kind = 'neutral', children }) {
  return <span className={`admin-status is-${kind}`}>{children}</span>;
}

export function EmptyState({ children }) {
  return <div className="admin-empty">{children}</div>;
}

export function Notice({ kind = '', children, onClose }) {
  return (
    <div className={`admin-notice${kind ? ` ${kind}` : ''}`}>
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          className="admin-btn link spacer"
          onClick={onClose}
        >
          关闭
        </button>
      )}
    </div>
  );
}

// 确认弹窗：复用 C 端已有的 .dialog 样式（主题变量是全局的）
export function ConfirmDialog({
  title,
  body,
  confirmText = '确定',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel?.();
      }}
    >
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-title">{title}</div>
        <div className="dialog-body">{body}</div>
        <div className="dialog-actions">
          <button
            type="button"
            className="dialog-ok"
            onClick={onCancel}
            disabled={busy}
          >
            取消
          </button>
          <button
            type="button"
            className={`admin-btn${danger ? ' danger' : ' primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? '处理中…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 图标（16px 线性图标，沿用 C 端描边风格） ---------------- */
const PATHS = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5S15 16.7 15 20" />
      <path d="M17 7.5h4M17 11h4M19 14.5v3" />
    </>
  ),
  admins: (
    <>
      <path d="M12 3l7 3v5.5c0 4-3 7.2-7 8.5-4-1.3-7-4.5-7-8.5V6z" />
      <path d="M9.2 12l2 2 3.6-3.8" />
    </>
  ),
  questions: (
    <>
      <path d="M5 3h9l4 4v14H5z" />
      <path d="M14 3v4h4" />
      <path d="M8.5 12h7M8.5 16h5" />
    </>
  ),
  exams: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v4M9 20h6" />
    </>
  ),
  collapse: <path d="M14 6l-6 6 6 6" />,
};

export function AdminIcon({ name }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      className="admin-nav-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}
