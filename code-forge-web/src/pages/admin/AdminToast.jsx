import { useEffect, useState } from 'react';

// B 端统一的操作反馈：屏幕中央弹出的提示，形态与 C 端「已经是最后一题了」
// 那个 toast 一致，但多了一个能看出成功 / 失败的小图标。
//
// 不引状态管理库：模块级的队列 + 订阅即可（和 api/avatarStore.js 一个路子）。
// 任何地方 import { toast } 直接调；<AdminToaster /> 由 AdminApp 挂在最外层渲染，
// 所以弹窗开着的时候提示也浮在最上面。
//
//   toast.success('已删除题目「两数之和」')   → 绿勾，2.6s 后自动消失
//   toast.error('竞赛已经开始，不能进行编辑操作') → 红叉，4s 后自动消失
//   toast.info('请先点选要添加的题目')        → 灰点，2.6s
//
// 点一下提示可以立刻关掉（不强制等它自己消失）。
let seq = 0;
let items = [];
const listeners = new Set();
const timers = new Map();

function emit() {
  const snapshot = items;
  listeners.forEach((fn) => fn(snapshot));
}

function dismiss(id) {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
  const next = items.filter((x) => x.id !== id);
  if (next.length === items.length) return;
  items = next;
  emit();
}

function push(kind, text, ms) {
  const id = (seq += 1);
  items = [...items, { id, kind, text: String(text ?? '') }];
  emit();
  // 失败信息多留一会儿（要看清楚后端到底说了什么）
  const life = ms ?? (kind === 'error' ? 4000 : 2600);
  timers.set(
    id,
    setTimeout(() => {
      timers.delete(id);
      dismiss(id);
    }, life)
  );
  return id;
}

export const toast = {
  success: (text) => push('success', text),
  error: (text) => push('error', text),
  info: (text) => push('info', text),
  dismiss,
};

export function useAdminToasts() {
  const [list, setList] = useState(items);
  useEffect(() => {
    listeners.add(setList);
    return () => listeners.delete(setList);
  }, []);
  return list;
}

const ICONS = {
  // 对勾
  success: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  // 叉
  error: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  // 感叹号
  info: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 8h.01M11 12h1v5h1" />
    </svg>
  ),
};

export function AdminToaster() {
  const list = useAdminToasts();
  if (!list.length) return null;
  return (
    <div className="admin-toaster" role="status" aria-live="polite">
      {list.map((t) => (
        <div
          key={t.id}
          className={`admin-toast is-${t.kind}`}
          onClick={() => toast.dismiss(t.id)}
          title="点一下关闭"
        >
          <span className="admin-toast-icon">
            {ICONS[t.kind] || ICONS.info}
          </span>
          <span className="admin-toast-text">{t.text}</span>
        </div>
      ))}
    </div>
  );
}
