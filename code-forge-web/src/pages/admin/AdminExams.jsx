import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteExam,
  fetchExamPage,
  publishCancelExam,
  publishExam,
} from '../../api/admin.js';
import { useAdminPagedList } from '../../hooks/useAdminPagedList.js';
import { toast } from './AdminToast.jsx';
import {
  ColorTag,
  ConfirmDialog,
  EmptyState,
  RowMenu,
  StatusDot,
} from './AdminBits.jsx';
import AdminExamAddQuestionsDialog from './AdminExamAddQuestionsDialog.jsx';
import AdminExamDeleteQuestionsDialog from './AdminExamDeleteQuestionsDialog.jsx';
import AdminExamDialog from './AdminExamDialog.jsx';
import AdminExamQuestionsDialog from './AdminExamQuestionsDialog.jsx';
import { formatDateTime } from '../../utils/format.js';

// B 端竞赛管理
//
//   GET /exam/list?pageNum=  → 全部竞赛（ExamListVO，带 total）
//
// 列表只看全量：按时间划分的那套筛选（/user/exam/list/queue 的 0/1/2）已经去掉，
// 需要看某场竞赛处于什么时间状态，看「比赛状态」列即可。
//
// 列表形态与题目管理一致 = 「区内无限滚动」：区域高度有上限（admin.css 的
// .admin-scroll-area），在区域里滚到底就自动拉下一页追加。
//
//   POST /exam/b/add                           → 新增竞赛（弹窗）
// 「查看竞赛题目」会打开弹窗，里面调 /exam/listQuestion 列出这场竞赛的题目，
// 并支持把某道题移出竞赛（DELETE /exam/b/delete）。
// 「添加题目」会打开题目选择弹窗（POST /exam/b/question/add）。
// 「删除题目」用的是同一套选择器（检索 + 点行），但一次只移出一道题
// （DELETE /exam/b/delete）。
// 行内「⋯」菜单里是竞赛本身的三个操作：
//   编辑   POST   /exam/b/edit            （详情 GET /exam/detail 回填）
//   发布   PUT    /exam/b/publish         （status=1，C 端才看得到）
//   取消发布 PUT  /exam/b/publish_cancel
//   删除   DELETE /exam/b/delete/{examId}
// 除了「取消发布」，其余三个后端都走 checkExam(examId,false)：竞赛「已发布 /
// 已开始 / 已结束」一律不允许改，报 3208 / 3201 / 3207 —— 前端不预判，原文透出。
// 修改竞赛、发布 / 取消发布这些后端接口也有了，界面后续再接。
//
// 两个列表接口都不返回 pages（queue 本身没有这个字段，list 返回的恒为 1），
// 所以翻页终止都靠「本页是否满页」判断 —— 见 useAdminPagedList。
const SCROLL_EDGE = 80;

// 竞赛当前处于哪个时间状态：进行中 / 未开始 / 已结束（口径与后端划分一致）
function kindOf(exam) {
  const now = Date.now();
  const start = exam?.startTime ? new Date(exam.startTime).getTime() : 0;
  const end = exam?.endTime ? new Date(exam.endTime).getTime() : 0;
  if (end && now > end) return 'finished';
  if (start && now < start) return 'unstart';
  return 'unfinish';
}

const TIME_STATUS = {
  unfinish: { text: '进行中', kind: 'success' },
  unstart: { text: '未开始', kind: 'warning' },
  finished: { text: '已结束', kind: 'muted' },
};

export default function AdminExams() {
  // 正在查看题目的那场竞赛（null = 没开弹窗）
  const [viewExam, setViewExam] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  // 正在给哪场竞赛添加题目（null = 没开弹窗）
  const [addQExam, setAddQExam] = useState(null);
  // 正在给哪场竞赛删除题目（null = 没开弹窗）
  const [delQExam, setDelQExam] = useState(null);
  // 正在编辑的竞赛（null = 没开弹窗）
  const [editExam, setEditExam] = useState(null);
  // 待确认的操作：{ kind:'publish'|'cancel'|'delete', exam }
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  // 新增成功后是否把列表翻到底（新竞赛的 examId 最大，排在最后一页）
  const [revealEnd, setRevealEnd] = useState(false);
  const areaRef = useRef(null);

  const { items, total, loading, loadingMore, error, hasMore, loadNext, reload } =
    useAdminPagedList(
      (pageNum) => fetchExamPage(pageNum),
      'exams'
    );

  // 内容不足一屏时自动再拉一页（否则没有滚动条，就永远触发不了滚动加载）
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

  // 新增成功：
  //  1. 后端只失效了 exam:list:page:*，按时间划分的三个缓存（exam:unstart /
  //     unfinish / finished）是每天 0 点和服务启动时才重建的，所以新建的竞赛在
  //     「未开始」等分类里暂时看不到 —— 直接切回「全部」；
  //  2. 新竞赛 examId 最大、排在最后一页，列表又是一页页往后加载的，
  //     所以标记一下让它连续往后拉到底，把新竞赛翻到眼前。
  const handleAdded = ({ title, mode }) => {
    setAddOpen(false);
    setEditExam(null);
    toast.success(`已${mode === 'edit' ? '保存' : '新增'}竞赛「${title}」`);
    if (mode === 'edit') {
      refreshAfter();
      setRevealEnd(true); // 时间变了排序可能变，直接把这场竞赛翻到眼前
      return;
    }
    reload();
    setRevealEnd(true);
  };

  // 所有增删改（add / edit / delete / publish / publish_cancel）后端都会失效
  // exam:list:page:*，而列表只读这个接口，所以成功后直接重拉即可，不会看到旧数据。
  const refreshAfter = () => reload();

  // 确认框里的文案
  const confirmText = (() => {
    if (!pending) return null;
    const name = pending.exam.title || '';
    if (pending.kind === 'publish') {
      return {
        title: '发布竞赛',
        body: `确定发布竞赛「${name}」吗？发布后 C 端用户就能看到并报名。`,
        confirmText: '发布',
        danger: false,
      };
    }
    if (pending.kind === 'cancel') {
      return {
        title: '取消发布',
        body: `确定取消发布竞赛「${name}」吗？取消后 C 端不再展示该竞赛。`,
        confirmText: '取消发布',
        danger: false,
      };
    }
    return {
      title: '删除竞赛',
      body: `确定删除竞赛「${name}」吗？该竞赛的题目关联会一并删除，操作不可撤销。`,
      confirmText: '删除',
      danger: true,
    };
  })();

  const runPending = async () => {
    if (!pending || busy) return;
    const { kind, exam } = pending;
    setBusy(true);
    try {
      if (kind === 'publish') {
        await publishExam(exam.examId);
        toast.success(`已发布竞赛「${exam.title || ''}」`);
        refreshAfter();
      } else if (kind === 'cancel') {
        await publishCancelExam(exam.examId);
        toast.success(`已取消发布竞赛「${exam.title || ''}」`);
        refreshAfter();
      } else {
        await deleteExam(exam.examId);
        toast.success(`已删除竞赛「${exam.title || ''}」`);
        refreshAfter();
      }
      setPending(null);
    } catch (e) {
      toast.error(e?.message || '操作失败');
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  // 翻到底直到新竞赛出现（最多再拉 20 页，避免极端数据量下一直请求）
  useEffect(() => {
    if (!revealEnd) return;
    if (loading || loadingMore) return;
    if (hasMore && items.length < 20 * 10) {
      loadNext();
      return;
    }
    const el = areaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setRevealEnd(false);
  }, [revealEnd, loading, loadingMore, hasMore, items, loadNext]);

  return (
    <>
      <h1 className="admin-h1">竞赛管理</h1>
      <p className="admin-sub">全部竞赛按开始时间排列，可按时间状态筛选。</p>

      <section className="admin-section">
        <div className="admin-toolbar">
          <span className="admin-sub-inline">
            共 <span className="admin-num">{total ?? '—'}</span> 场竞赛
          </span>

          <span className="admin-toolbar-spacer" />

          <button
            type="button"
            className="admin-btn primary"
            onClick={() => setAddOpen(true)}
          >
            新增竞赛
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={reload}
            disabled={loading}
          >
            刷新
          </button>
        </div>

        <div className="admin-panel">
          {/* 列表区：高度有上限，区内滚动加载 */}
          <div className="admin-scroll-area" ref={areaRef} onScroll={onScroll}>
            <table className="admin-table admin-table-exams">
              <thead>
                <tr>
                  <th>标题</th>
                  <th style={{ width: 100 }}>比赛状态</th>
                  <th style={{ width: 90 }}>发布</th>
                  <th style={{ width: 170 }} className="col-time">
                    开始时间
                  </th>
                  <th style={{ width: 170 }} className="col-time">
                    结束时间
                  </th>
                  <th style={{ width: 240 }} className="col-actions">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => {
                  const st = TIME_STATUS[kindOf(e)] || TIME_STATUS.unfinish;
                  const published = e.status === 1;
                  return (
                    <tr key={e.examId}>
                      <td className="cell-ellipsis" title={e.title || ''}>
                        {e.title || '—'}
                      </td>
                      <td>
                        <ColorTag kind={st.kind}>{st.text}</ColorTag>
                      </td>
                      <td>
                        <StatusDot kind={published ? 'ok' : 'neutral'}>
                          {published ? '已发布' : '未发布'}
                        </StatusDot>
                      </td>
                      <td className="col-num col-muted col-time">
                        {formatDateTime(e.startTime)}
                      </td>
                      <td className="col-num col-muted col-time">
                        {formatDateTime(e.endTime)}
                      </td>
                      <td className="col-actions">
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-btn"
                            onClick={() => setViewExam(e)}
                          >
                            查看题目
                          </button>
                          <button
                            type="button"
                            className="admin-btn"
                            onClick={() => setAddQExam(e)}
                          >
                            添加题目
                          </button>
                          <button
                            type="button"
                            className="admin-btn"
                            onClick={() => setDelQExam(e)}
                          >
                            删除题目
                          </button>
                          <RowMenu
                            items={[
                              {
                                label: '编辑',
                                onClick: () => setEditExam(e),
                              },
                              e.status === 1
                                ? {
                                    label: '取消发布',
                                    onClick: () =>
                                      setPending({ kind: 'cancel', exam: e }),
                                  }
                                : {
                                    label: '发布',
                                    onClick: () =>
                                      setPending({ kind: 'publish', exam: e }),
                                  },
                              {
                                label: '删除',
                                danger: true,
                                onClick: () =>
                                  setPending({ kind: 'delete', exam: e }),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {loading && <EmptyState>加载中…</EmptyState>}
            {!loading && !items.length && !error && <EmptyState>暂无数据</EmptyState>}
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
              <div className="admin-list-more">已加载全部 {items.length} 场</div>
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
              {total != null && (
                <>
                  共 <span className="admin-num">{total}</span> 场，
                </>
              )}
              已加载 <span className="admin-num">{items.length}</span> 场
            </span>
          </div>
        </div>
      </section>

      {addOpen && (
        <AdminExamDialog
          onClose={() => setAddOpen(false)}
          onSaved={handleAdded}
        />
      )}

      {editExam && (
        <AdminExamDialog
          exam={editExam}
          onClose={() => setEditExam(null)}
          onSaved={handleAdded}
        />
      )}

      {pending && confirmText && (
        <ConfirmDialog
          title={confirmText.title}
          body={confirmText.body}
          confirmText={confirmText.confirmText}
          danger={confirmText.danger}
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={runPending}
        />
      )}

      {addQExam && (
        <AdminExamAddQuestionsDialog
          exam={addQExam}
          onClose={() => setAddQExam(null)}
          onAdded={() => setAddQExam(null)}
        />
      )}

      {viewExam && (
        <AdminExamQuestionsDialog
          exam={viewExam}
          onClose={() => setViewExam(null)}
        />
      )}

      {delQExam && (
        <AdminExamDeleteQuestionsDialog
          exam={delQExam}
          onClose={() => setDelQExam(null)}
        />
      )}
    </>
  );
}
