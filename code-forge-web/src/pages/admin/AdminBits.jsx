// B 端通用小部件：状态点、空态、提示条、确认弹窗、图标、SysUserVO 字段表
// 刻意做得很薄，避免变成一套「组件库」

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatDateTime } from '../../utils/format.js';

/* ---------------- SysUserVO 字段表 ---------------- */
//
// 全后台统一用这套字段展示管理员信息，字段和顺序都跟后端 SysUserVO 对齐：
//   userId / userAccount / nickName / createBy / updateBy / createTime / updateTime
// 注意：
//   · VO 里没有自增主键 id，也【没有角色字段】，所以不展示「角色」，不臆造；
//   · createBy / updateBy 存的是用户 ID（跟 userId 同一个 ID 空间），不是名字，
//     所以标签写「创建人 ID / 更新人 ID」而不是「创建人 / 更新人」。
export const SYS_USER_FIELDS = [
  ['用户 ID', 'userId', 'num'],
  ['账号', 'userAccount', 'num'],
  ['昵称', 'nickName', 'text'],
  ['创建人 ID', 'createBy', 'num'],
  ['更新人 ID', 'updateBy', 'num'],
  ['创建时间', 'createTime', 'time'],
  ['更新时间', 'updateTime', 'time'],
];

// 按类型把值渲染成展示文本（空值统一「—」）
export function sysUserText(user, key, kind) {
  const raw = user?.[key];
  if (kind === 'time') return formatDateTime(raw);
  if (raw === null || raw === undefined || raw === '') return '—';
  return String(raw);
}

// 表格单元格的 class（时间列次要色，ID 列等宽 + 省略保护）
export function sysUserCellClass(kind) {
  if (kind === 'time') return 'col-num col-muted';
  if (kind === 'num') return 'col-num cell-ellipsis';
  return undefined;
}

// 字段列表（概览的「当前管理员」卡片、详情弹窗共用）
export function SysUserFields({ user }) {
  return (
    <dl className="admin-kv">
      {SYS_USER_FIELDS.map(([label, key, kind]) => (
        <Fragment key={key}>
          <dt>{label}</dt>
          <dd className={kind === 'num' ? 'admin-num' : undefined}>
            {sysUserText(user, key, kind)}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

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
          onClick={() => onClose()}
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

/* ---------------- 彩色小标签（圆点 + 彩色文字） ---------------- */
//
// 难度（简单绿 / 中等黄 / 困难红）和竞赛时间状态（进行中绿 / 未开始黄 / 已结束灰）
// 都用它，颜色取自 C 端同一套变量，但样式写在 B 端自己的 admin.css 里
// （B 端不引 C 端样式表）。
export function ColorTag({ kind, children }) {
  return <span className={`admin-color-tag is-${kind}`}>{children}</span>;
}

export const DIFFICULTY_LEVELS = {
  1: { text: '简单', kind: 'easy' },
  2: { text: '中等', kind: 'medium' },
  3: { text: '困难', kind: 'hard' },
};

export function DifficultyTag({ level }) {
  const d = DIFFICULTY_LEVELS[level];
  if (!d) return <span className="admin-muted">—</span>;
  return <ColorTag kind={d.kind}>{d.text}</ColorTag>;
}

/* ---------------- 行内「⋯」更多操作菜单 ---------------- */
//
// 表格行里按钮塞不下时用：菜单用 position: fixed 定位，
// 因为列表区是 overflow:auto（absolute 会被裁掉，靠底部的行看不到菜单）。
export function RowMenu({ items, label = '⋯' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const openedAtRef = useRef(0);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    // 列表滚动时菜单会飘走，直接关掉（capture 才能抓到内层滚动容器）。
    // 开菜单后 250ms 内的滚动忽略：浏览器有时会先把按钮滚进视口再派发 click，
    // 那一下 scroll 会紧接着 click 到达，否则菜单刚开就被自己关掉。
    const onScroll = () => {
      if (Date.now() - openedAtRef.current < 250) return;
      close();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  // 位置在渲染后按真实尺寸算：下面放不下就往上翻，并夹在视口内
  // （列表区 overflow:auto 很矮，靠底部的行必须往上翻，否则菜单出屏）
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const btn = btnRef.current?.getBoundingClientRect();
    const menu = listRef.current?.getBoundingClientRect();
    if (!btn || !menu) return;
    const gap = 4;
    const pad = 8;
    const vh = window.innerHeight;
    let top = btn.bottom + gap;
    if (top + menu.height > vh - pad) top = btn.top - menu.height - gap;
    top = Math.min(Math.max(pad, top), Math.max(pad, vh - menu.height - pad));
    setPos({ top, right: Math.max(pad, window.innerWidth - btn.right) });
  }, [open, items.length]);

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    openedAtRef.current = Date.now();
    setOpen(true);
  };

  return (
    <span className="admin-menu" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="admin-btn admin-menu-btn"
        onClick={toggle}
        title="更多操作"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div
          ref={listRef}
          className="admin-menu-list"
          role="menu"
          style={{
            top: pos?.top ?? 0,
            right: pos?.right ?? 0,
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              className={`admin-menu-item${it.danger ? ' is-danger' : ''}`}
              onClick={() => {
                close();
                it.onClick?.();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </span>
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
