import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteExamQuestion,
  fetchExamQuestionPage,
} from '../../api/admin.js';
import { useAdminPagedList } from '../../hooks/useAdminPagedList.js';
import { ConfirmDialog, DifficultyTag, EmptyState } from './AdminBits.jsx';
import { toast } from './AdminToast.jsx';


// 「查看竞赛题目」弹窗
//
//   GET    /exam/listQuestion?examId=&pageNum=  → 竞赛里的题目（分页）
//   DELETE /exam/b/delete?examId=&questionId=   → 把某道题移出竞赛
//
// 列表形态和页面上一致：区域高度有上限、区内滚到底自动拉下一页。
//
// ⚠️ 删除能不能成功由后端按「时间」决定，与发布状态无关：未开始可以，
//    进行中返回 3210、已结束返回 3207。前端不预判，直接把后端的话透出来。
const SCROLL_EDGE = 60;

export default function AdminExamQuestionsDialog({ exam, onClose }) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const areaRef = useRef(null);

  const { items, total, loading, loadingMore, error, hasMore, loadNext, reload } =
    useAdminPagedList(
      (pageNum) => fetchExamQuestionPage(exam.examId, pageNum),
      `exam-questions:${exam.examId}`
    );

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

  // Esc 关弹窗；二次确认框开着时让路（否则一次 Esc 会连确认框一起关掉）
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (pendingDelete || deleting) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pendingDelete, deleting]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteExamQuestion({
        examId: exam.examId,
        questionId: pendingDelete.id,
      });
      toast.success(`已将题目「${pendingDelete.title || ''}」移出本场竞赛`);
      setPendingDelete(null);
      // 删除会让后面各页的偏移前移，直接从第 1 页重拉
      reload();
    } catch (e) {
      // 已发布 / 已开始 / 已结束都会在这里返回后端原文
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
          className="dialog admin-exam-q-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="竞赛题目"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dialog-title">竞赛题目</div>
          <p className="admin-exam-q-sub" title={exam.title}>
            {exam.title || '—'}
          </p>

          <div
            className="admin-panel admin-exam-q-panel"
            style={{ marginTop: 12 }}
          >
            <div
              className="admin-scroll-area"
              ref={areaRef}
              onScroll={onScroll}
            >
              <table className="admin-table admin-table-exam-q">
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
                  {items.map((q) => (
                    <tr key={q.id}>
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
                          onClick={() => setPendingDelete(q)}
                        >
                          删除题目
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {loading && <EmptyState>加载中…</EmptyState>}
              {!loading && !items.length && !error && (
                <EmptyState>本场竞赛还没有题目</EmptyState>
              )}
              {!loading && !items.length && error && (
                <EmptyState>
                  {error}
                  <button
                    type="button"
                    className="admin-btn link"
                    onClick={reload}
                  >
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
                  <button
                    type="button"
                    className="admin-btn link"
                    onClick={reload}
                  >
                    重试
                  </button>
                </div>
              )}
            </div>

            <div className="admin-listfoot">
              <span>
                {total != null && (
                  <>
                    共 <span className="admin-num">{total}</span> 题，
                  </>
                )}
                已加载 <span className="admin-num">{items.length}</span> 题
              </span>
            </div>
          </div>

          <div className="dialog-actions">
            <button type="button" className="admin-btn primary" onClick={() => onClose()}>
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
