import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addExamQuestions,
  fetchExamQuestionPage,
} from '../../api/admin.js';
import { useAdminPagedList } from '../../hooks/useAdminPagedList.js';
import { useAdminQuestionSource } from '../../hooks/useAdminQuestionSource.js';
import {
  DIFFICULTY_LEVELS,
  DifficultyTag,
  EmptyState,
} from './AdminBits.jsx';
import { toast } from './AdminToast.jsx';


// 「为竞赛添加题目」弹窗
//
//   GET  /question/list | /question/search/filter  → 可选题目（与题目管理同一套数据源）
//   GET  /exam/listQuestion?examId=                → 竞赛已有的题目（用来标记、避免重复）
//   POST /exam/b/question/add { examId, questions: [id, …] }
//
// 交互：不用手填题目 id —— 直接点列表里的行勾选，勾中的 id 攒在 picked 里（跨检索保留），
// 最后一次性提交。
//
// ⚠️ 后端只要发现提交的 id 里有一个已经在本场竞赛里，整批就失败（3209
//    「竞赛题目已存在」），所以打开时会先把竞赛已有的题目 id 拉全并标成不可选。
//    能不能加由后端按「时间」决定（与发布状态无关）：未开始可以，
//    进行中报 3210、已结束报 3207。
const SCROLL_EDGE = 60;
// 拉「竞赛已有题目」时最多翻多少页（每页 10 条），只为了标记去重
const EXISTING_MAX_SCAN_PAGES = 20;

export default function AdminExamAddQuestionsDialog({ exam, onClose, onAdded }) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState({ keyword: '', difficulty: null });
  // 已勾选：Map<questionId, title>（跨检索保留，换关键字不会丢）
  const [picked, setPicked] = useState(() => new Map());
  // 竞赛已有的题目 id（null = 还没拉回来）
  const [existing, setExisting] = useState(null);
  const [saving, setSaving] = useState(false);
  const cursorRef = useRef(0);
  const areaRef = useRef(null);

  const mode = search.keyword
    ? 'search'
    : search.difficulty != null
      ? 'local'
      : 'list';
  const fetchPage = useAdminQuestionSource(search, cursorRef);

  const {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    loadNext,
    reload,
  } = useAdminPagedList(
    fetchPage,
    `${mode}\u0000${search.keyword}\u0000${search.difficulty ?? ''}`
  );

  // 先把这场竞赛已有的题目 id 拉全（分页直到不满页），用于标记「已在竞赛中」
  useEffect(() => {
    let cancelled = false;
    setExisting(null);
    (async () => {
      const ids = new Set();
      for (let page = 1; page <= EXISTING_MAX_SCAN_PAGES; page += 1) {
        const d = await fetchExamQuestionPage(exam.examId, page);
        const list = Array.isArray(d?.list) ? d.list : [];
        for (const q of list) {
          if (q?.id != null) ids.add(String(q.id));
        }
        if (list.length < (d?.pageSize || 10)) break;
      }
      if (!cancelled) setExisting(ids);
    })().catch(() => {
      if (!cancelled) setExisting(new Set());
    });
    return () => {
      cancelled = true;
    };
  }, [exam.examId]);

  // 内容不足一屏时自动再拉一页
  useEffect(() => {
    if (loading || loadingMore || !hasMore || error) return;
    const el = areaRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 4) loadNext();
  }, [items, loading, loadingMore, hasMore, error, loadNext]);

  const onScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_EDGE) {
        loadNext();
      }
    },
    [loadNext]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const toggle = (q) => {
    setPicked((prev) => {
      const next = new Map(prev);
      const key = String(q.id);
      if (next.has(key)) next.delete(key);
      else next.set(key, q.title || '');
      return next;
    });
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setSearch((s) => ({ ...s, keyword: input.trim() }));
  };

  // 点难度立刻生效（与 C 端题目筛选一致），顺带带上输入框里已敲的关键字
  const applyDifficulty = (d) => {
    setSearch({ keyword: input.trim(), difficulty: d });
  };

  const resetSearch = () => {
    setInput('');
    setSearch({ keyword: '', difficulty: null });
  };

  const submit = async () => {
    if (saving) return;
    const ids = [...picked.keys()].map((x) => Number(x));
    if (!ids.length) {
      toast.info('请先点选要添加的题目');
      return;
    }
    setSaving(true);
    try {
      await addExamQuestions({ examId: exam.examId, questionIds: ids });
      toast.success(`已为「${exam.title || ''}」添加 ${ids.length} 道题目`);
      // 成功用独立的 onAdded 回调；onClose 只负责关弹窗，
      // 绝不能再把「消息」塞进 onClose —— 按钮 onClose 直接当 onClick 用时
      // 会传进来一个 click 事件对象，被当成提示文案渲染 → 报错白屏
      onAdded?.();
    } catch (e) {
      // 3208 / 3201 / 3207（竞赛状态不允许改）、3209（题目已存在）等原文透出
      toast.error(e?.message || '添加失败');
    } finally {
      setSaving(false);
    }
  };

  const pickedList = [...picked.values()];
  const pickedPreview =
    pickedList.length > 3
      ? `${pickedList.slice(0, 3).join('、')} 等 ${pickedList.length} 题`
      : pickedList.join('、');

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="dialog admin-exam-addq-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="为竞赛添加题目"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-title">为竞赛添加题目</div>
        <p className="admin-exam-q-sub" title={exam.title}>
          {exam.title || '—'}
        </p>

        {/* 检索：与题目管理页完全同一套（关键字 + 难度 + 本地筛兜底） */}
        <form
          className="admin-toolbar"
          style={{ marginTop: 12, marginBottom: 8 }}
          onSubmit={submitSearch}
        >
          <span className="admin-search">
            <input
              className="admin-input w-md"
              type="text"
              placeholder="搜索题目标题…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {input && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setInput('')}
                title="清空输入"
                aria-label="清空输入"
              >
                ×
              </button>
            )}
          </span>
          <button type="submit" className="admin-btn primary" disabled={loading}>
            搜索
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={resetSearch}
            disabled={!search.keyword && search.difficulty == null && !input}
          >
            重置
          </button>

          <span className="admin-chips">
            <button
              type="button"
              className={`admin-chip${
                search.difficulty == null ? ' is-active' : ''
              }`}
              onClick={() => applyDifficulty(null)}
            >
              全部
            </button>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                type="button"
                className={`admin-chip is-${DIFFICULTY_LEVELS[d].kind}${
                  search.difficulty === d ? ' is-active' : ''
                }`}
                onClick={() => applyDifficulty(d)}
              >
                {DIFFICULTY_LEVELS[d].text}
              </button>
            ))}
          </span>
        </form>


        <div className="admin-panel">
          <div className="admin-scroll-area" ref={areaRef} onScroll={onScroll}>
            <table className="admin-table admin-table-pick">
              <thead>
                <tr>
                  <th style={{ width: 44 }} className="col-check" />
                  <th>标题</th>
                  <th style={{ width: 90 }}>难度</th>
                  <th style={{ width: 110 }} className="col-time">
                    时间限制
                  </th>
                  <th style={{ width: 110 }} className="col-time">
                    空间限制
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((q) => {
                  const key = String(q.id);
                  const isExisting = existing?.has(key);
                  const checked = picked.has(key);
                  return (
                    <tr
                      key={q.id}
                      className={`admin-pick-row${checked ? ' is-picked' : ''}${
                        isExisting ? ' is-existing' : ''
                      }`}
                      onClick={() => {
                        if (!isExisting) toggle(q);
                      }}
                      title={isExisting ? '该题已在本场竞赛中' : '点击选中 / 取消'}
                    >
                      <td className="col-check">
                        <input
                          type="checkbox"
                          checked={checked || !!isExisting}
                          disabled={!!isExisting}
                          readOnly
                          tabIndex={-1}
                        />
                      </td>
                      <td className="cell-ellipsis" title={q.title || ''}>
                        {q.title || '—'}
                        {isExisting && (
                          <span className="admin-pick-hint">已在竞赛中</span>
                        )}
                      </td>
                      <td>
                        <DifficultyTag level={q.difficulty} />
                      </td>
                      <td className="col-num col-muted col-time">
                        {q.timeLimit == null ? '—' : `${q.timeLimit} ms`}
                      </td>
                      <td className="col-num col-muted col-time">
                        {q.spaceLimit == null ? '—' : `${q.spaceLimit} KB`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {loading && <EmptyState>加载中…</EmptyState>}
            {!loading && !items.length && !error && (
              <EmptyState>
                {(search.keyword || search.difficulty != null)
                  ? '没有匹配的题目'
                  : '暂无数据'}
              </EmptyState>
            )}
            {!loading && !items.length && error && (
              <EmptyState>
                {error}
                <button type="button" className="admin-btn link" onClick={reload}>
                  重试
                </button>
              </EmptyState>
            )}

            {loadingMore && <div className="admin-list-more">加载中…</div>}
            {!loading && !loadingMore && !hasMore && items.length > 0 && (
              <div className="admin-list-more">已加载全部 {items.length} 题</div>
            )}
            {!loading && items.length > 0 && error && (
              <div className="admin-list-more is-error">
                {error}
                <button type="button" className="admin-btn link" onClick={reload}>
                  重试
                </button>
              </div>
            )}
          </div>

          <div className="admin-listfoot">
            <span>
              {picked.size > 0 ? (
                <>
                  已选 <span className="admin-num">{picked.size}</span> 题：
                  <span className="admin-pick-preview" title={pickedList.join('、')}>
                    {pickedPreview}
                  </span>
                </>
              ) : (
                <span className="admin-muted">点列表里的行来选中题目</span>
              )}
            </span>
            {picked.size > 0 && (
              <button
                type="button"
                className="admin-btn link"
                onClick={() => setPicked(new Map())}
              >
                清空选择
              </button>
            )}
          </div>
        </div>

        <div className="dialog-actions">
          <button
            type="button"
            className="dialog-ok"
            onClick={() => onClose()}
            disabled={saving}
          >
            取消
          </button>
          <button
            type="button"
            className="admin-btn primary"
            onClick={submit}
            disabled={saving || !picked.size}
          >
            {saving ? '提交中…' : `添加所选 ${picked.size} 题`}
          </button>
        </div>
      </div>
    </div>
  );
}
