import { useEffect, useMemo, useRef, useState } from 'react';
import { deleteExamQuestion, fetchExamQuestionPage } from '../../api/admin.js';
import {
  ConfirmDialog,
  DIFFICULTY_LEVELS,
  DifficultyTag,
  EmptyState,
} from './AdminBits.jsx';
import { toast } from './AdminToast.jsx';


// 「删除竞赛题目」弹窗
//
// 交互照「为竞赛添加题目」：同一套检索条（关键字 + 难度 chips）+ 可点选的行列表，
// 差别只有一处 —— 这里**不攒批**，点一行就移出一道题（一次删一个）。
//
//   GET    /exam/listQuestion?examId=&pageNum=  → 本场竞赛已有的题目（打开时全量拉回，便于本地筛选）
//   DELETE /exam/b/delete?examId=&questionId=   → 把某道题移出竞赛
//
// 删除后就地改本地列表，不重拉（否则滚动位置会丢）。
//
// ⚠️ 能不能删由后端按「时间」决定，与发布状态无关：
//    未开始 → 可以；进行中 → 3210「竞赛已经开始，不能进行编辑操作」；已结束 → 3207。
//    前端不预判，直接把后端原文透出来。
const SCAN_MAX_PAGES = 50; // 每页 10 条，最多拉 500 题，足够覆盖一场竞赛

export default function AdminExamDeleteQuestionsDialog({
  exam,
  onClose,
  onDeleted,
}) {
  // 全量题目（null = 还没拉回来）
  const [all, setAll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [difficulty, setDifficulty] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // 点「重试」时 +1，重新拉一遍
  const [reloadFlag, setReloadFlag] = useState(0);
  const areaRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setAll(null);
    (async () => {
      const list = [];
      for (let page = 1; page <= SCAN_MAX_PAGES; page += 1) {
        const d = await fetchExamQuestionPage(exam.examId, page);
        const rows = Array.isArray(d?.list) ? d.list : [];
        list.push(...rows);
        if (rows.length < (d?.pageSize || 10)) break;
      }
      if (!cancelled) setAll(list);
    })()
      .catch((e) => {
        if (!cancelled) setError(e?.message || '加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [exam.examId, reloadFlag]);

  // Esc 关弹窗；二次确认框开着时让路
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (pendingDelete || deleting) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pendingDelete, deleting]);

  const keyword = input.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!all) return [];
    return all.filter((q) => {
      if (difficulty != null && q.difficulty !== difficulty) return false;
      if (keyword && !String(q.title || '').toLowerCase().includes(keyword)) {
        return false;
      }
      return true;
    });
  }, [all, keyword, difficulty]);

  const filtered = !!keyword || difficulty != null;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteExamQuestion({
        examId: exam.examId,
        questionId: pendingDelete.id,
      });
      // 就地改本地列表，不重拉（保住滚动位置）
      setAll((prev) => (prev || []).filter((q) => q.id !== pendingDelete.id));
      toast.success(`已将题目「${pendingDelete.title || ''}」移出本场竞赛`);
      setPendingDelete(null);
      onDeleted?.();
    } catch (e) {
      // 3208 / 3210 / 3207 都会在这里返回后端原文
      toast.error(e?.message || '删除失败');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        className="dialog-backdrop"
        role="presentation"
        onClick={() => {
          if (!deleting) onClose();
        }}
      >
        <div
          className="dialog admin-exam-addq-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="删除竞赛题目"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dialog-title">删除竞赛题目</div>
          <p className="admin-exam-q-sub" title={exam.title}>
            {exam.title || '—'}
          </p>
          <p className="admin-exam-delq-tip">
            点一行即可把该题移出本场竞赛（题目本身不会被删除）。竞赛已经开始或已经结束的
            不能再改动题目，未开始的无论是否发布都可以增删。
          </p>

          <form
            className="admin-toolbar"
            style={{ marginTop: 12, marginBottom: 8 }}
            onSubmit={(e) => e.preventDefault()}
          >
            <span className="admin-search">
              <input
                className="admin-input w-md"
                type="text"
                placeholder="在本场竞赛的题目里筛选…"
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
            <button
              type="button"
              className="admin-btn"
              onClick={() => {
                setInput('');
                setDifficulty(null);
              }}
              disabled={!input && difficulty == null}
            >
              重置
            </button>

            <span className="admin-chips">
              <button
                type="button"
                className={`admin-chip${difficulty == null ? ' is-active' : ''}`}
                onClick={() => setDifficulty(null)}
              >
                全部
              </button>
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`admin-chip is-${DIFFICULTY_LEVELS[d].kind}${
                    difficulty === d ? ' is-active' : ''
                  }`}
                  onClick={() => setDifficulty(d)}
                >
                  {DIFFICULTY_LEVELS[d].text}
                </button>
              ))}
            </span>
          </form>

          <div className="admin-panel">
            <div className="admin-scroll-area" ref={areaRef}>
              <table className="admin-table admin-table-pick">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th style={{ width: 90 }}>难度</th>
                    <th style={{ width: 110 }} className="col-time">
                      时间限制
                    </th>
                    <th style={{ width: 110 }} className="col-time">
                      空间限制
                    </th>
                    <th style={{ width: 110 }} className="col-actions">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((q) => (
                    <tr
                      key={q.id}
                      className="admin-pick-row"
                      onClick={() => {
                        if (!deleting) setPendingDelete(q);
                      }}
                      title="点击移出本场竞赛"
                    >
                      <td className="cell-ellipsis" title={q.title || ''}>
                        {q.title || '—'}
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
                      <td className="col-actions">
                        <button
                          type="button"
                          className="admin-btn danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(q);
                          }}
                        >
                          移出
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {loading && <EmptyState>加载中…</EmptyState>}
              {!loading && error && (
                <EmptyState>
                  {error}
                  <button
                    type="button"
                    className="admin-btn link"
                    onClick={() => setReloadFlag((n) => n + 1)}
                  >
                    重试
                  </button>
                </EmptyState>
              )}
              {!loading && !error && !all?.length && (
                <EmptyState>本场竞赛还没有题目</EmptyState>
              )}
              {!loading && !error && all?.length > 0 && !shown.length && (
                <EmptyState>没有符合筛选条件的题目</EmptyState>
              )}
            </div>

            <div className="admin-listfoot">
              <span>
                共 <span className="admin-num">{all?.length ?? 0}</span> 题
                {filtered && (
                  <>
                    ，筛出 <span className="admin-num">{shown.length}</span> 题
                  </>
                )}
              </span>
              <span className="admin-pick-preview">
                {filtered ? '正在筛选（仅本场竞赛的题目）' : '一次移出一道'}
              </span>
            </div>
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              className="admin-btn primary"
              onClick={() => onClose()}
            >
              关闭
            </button>
          </div>
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="移出竞赛题目"
          body={`确定把题目「${pendingDelete.title || ''}」从本场竞赛移出吗？题目本身不会被删除。`}
          confirmText="移出"
          danger
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
