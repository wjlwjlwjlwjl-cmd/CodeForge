import { useEffect, useRef } from 'react';
import { useQuestionList } from '../hooks/useQuestionList.js';
import { DIFFICULTY } from '../config.js';

// 题库抽屉：从左侧滑出，宽度占屏幕 1/3，纵向铺满
//   展示 序号（从 1 开始）、题目标题、难度（1-简单绿 / 2-中等黄 / 3-困难红）
//   无限列表，滚动接近底部时按需加载下一页
export default function QuestionLibrary({ open, currentId, onClose, onSelect }) {
  const listRef = useRef(null);
  const { items, total, loading, error, hasMore, loadMore } = useQuestionList(open);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    // 距底部不足 120px 时加载下一页
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
      loadMore();
    }
  };

  // 内容不足一屏（无滚动条）时自动继续加载，直到填满或加载完
  useEffect(() => {
    if (!open || error || loading || !hasMore) return;
    const el = listRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 4) {
      loadMore();
    }
  }, [items, hasMore, loading, error, open, loadMore]);

  if (!open) return null;

  return (
    <>
      <div className="library-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="library-drawer" role="dialog" aria-label="题库">
        <div className="library-header">
          <span className="library-title-text">
            题库
            {total > 0 && <span className="library-count">共 {total} 题</span>}
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

        <div className="library-list" ref={listRef} onScroll={handleScroll}>
          {items.map((q, i) => {
            const diff = DIFFICULTY[q.difficulty] || { text: '—', kind: 'muted' };
            const active = currentId != null && String(q.id) === String(currentId);
            return (
              <button
                type="button"
                key={q.id ?? i}
                className={`library-item${active ? ' active' : ''}`}
                onClick={() => onSelect?.(q)}
                title={q.title}
              >
                <span className="library-index">{i + 1}</span>
                <span className="library-item-title">{q.title}</span>
                <span className={`library-diff diff-${diff.kind}`}>{diff.text}</span>
              </button>
            );
          })}

          {loading && <div className="library-status">加载中…</div>}
          {!loading && error && (
            <div className="library-status library-error">
              {error}
              <button type="button" className="library-retry" onClick={loadMore}>
                重试
              </button>
            </div>
          )}
          {!loading && !error && !hasMore && items.length > 0 && (
            <div className="library-status">没有更多了</div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="library-status">暂无题目</div>
          )}
        </div>
      </aside>
    </>
  );
}