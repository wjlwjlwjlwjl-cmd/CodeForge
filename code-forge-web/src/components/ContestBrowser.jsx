import { useEffect, useRef, useState } from 'react';
import { useExamList, useExamQuestions } from '../hooks/useExam.js';
import { DIFFICULTY } from '../config.js';
import { formatDateTime } from '../utils/format.js';

// 竞赛浏览器（抽屉，从左侧滑出）
//   一级：竞赛列表            GET /exam/list?pageNum=
//   二级：某竞赛的题目列表     GET /exam/listQuestion?examId=&pageNum=
//   点击题目 → 打开代码编辑页
export default function ContestBrowser({ open, onClose, onSelectQuestion }) {
  // 当前展开的竞赛（null = 显示竞赛列表）
  const [active, setActive] = useState(null);

  // 关闭时回到竞赛列表
  useEffect(() => {
    if (!open) setActive(null);
  }, [open]);

  // Esc 关闭
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="library-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="contest-drawer" role="dialog" aria-label="竞赛">
        <div className="library-header">
          <span className="library-title-text">
            {active ? (
              <>
                <button
                  type="button"
                  className="contest-back"
                  onClick={() => setActive(null)}
                  title="返回竞赛列表"
                >
                  ←
                </button>
                <span className="contest-head-title">{active.title}</span>
              </>
            ) : (
              '竞赛'
            )}
          </span>
          <button
            type="button"
            className="library-close"
            onClick={onClose}
            title="关闭"
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
              strokeLinejoin="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        {active ? (
          <ExamQuestionPane
            exam={active}
            onSelectQuestion={onSelectQuestion}
          />
        ) : (
          <ExamListPane onPick={setActive} />
        )}
      </aside>
    </>
  );
}

/* ---------------- 一级：竞赛列表 ---------------- */
function ExamListPane({ onPick }) {
  const { items, total, loading, error, hasMore, loadMore } = useExamList();
  const listRef = useRef(null);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) loadMore();
  };

  // 内容不足一屏时自动续加载
  useEffect(() => {
    if (error || loading || !hasMore) return;
    const el = listRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 4) loadMore();
  }, [items, hasMore, loading, error, loadMore]);

  return (
    <>
      <div className="contest-subline">
        共 {total || items.length} 场竞赛
      </div>
      <div className="library-list" ref={listRef} onScroll={handleScroll}>
        {items.map((e, i) => (
          <button
            type="button"
            key={e.examId ?? i}
            className="contest-row"
            onClick={() => onPick(e)}
            title={e.title}
          >
            <div className="contest-row-main">
              <div className="contest-row-head">
                <span className="contest-row-title">{e.title}</span>
                <span className={`contest-status status-${statusKind(e.status)}`}>
                  {statusLabel(e.status)}
                </span>
              </div>
              <div className="contest-row-time">
                {formatDateTime(e.startTime)} ~ {formatDateTime(e.endTime)}
              </div>
            </div>
            <span className="contest-row-arrow" aria-hidden="true">›</span>
          </button>
        ))}

        {loading && <div className="library-status">加载中…</div>}
        {!loading && error && <div className="library-status library-error">{error}</div>}
        {!loading && !error && !hasMore && items.length > 0 && (
          <div className="library-status">没有更多了</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="library-status">暂无竞赛</div>
        )}
      </div>
    </>
  );
}

/* ---------------- 二级：竞赛题目 ---------------- */
function ExamQuestionPane({ exam, onSelectQuestion }) {
  const { items, total, loading, error, hasMore, loadMore } = useExamQuestions(
    exam?.examId
  );
  const listRef = useRef(null);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) loadMore();
  };

  useEffect(() => {
    if (error || loading || !hasMore) return;
    const el = listRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 4) loadMore();
  }, [items, hasMore, loading, error, loadMore]);

  return (
    <>
      <div className="contest-subline">
        共 {total || items.length} 题 · {formatDateTime(exam.startTime)} 起
      </div>
      <div className="library-list" ref={listRef} onScroll={handleScroll}>
        {items.map((q, i) => {
          const diff = DIFFICULTY[q.difficulty] || { text: '—', kind: 'muted' };
          return (
            <button
              type="button"
              key={q.id ?? i}
              className="library-item"
              onClick={() => onSelectQuestion?.(q.id)}
              title={q.title}
            >
              <span className="library-index">{i + 1}</span>
              <span className="library-item-title">{q.title}</span>
              <span className={`library-diff diff-${diff.kind}`}>{diff.text}</span>
            </button>
          );
        })}

        {loading && <div className="library-status">加载中…</div>}
        {!loading && error && <div className="library-status library-error">{error}</div>}
        {!loading && !error && !hasMore && items.length > 0 && (
          <div className="library-status">没有更多了</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="library-status">该竞赛暂无题目</div>
        )}
      </div>
    </>
  );
}

// 竞赛状态：0 未开始 / 1 进行中 / 2 已结束
function statusLabel(status) {
  if (status === 0) return '未开始';
  if (status === 1) return '进行中';
  if (status === 2) return '已结束';
  return '未知';
}

function statusKind(status) {
  if (status === 1) return 'success';
  if (status === 0) return 'warning';
  return 'muted';
}
