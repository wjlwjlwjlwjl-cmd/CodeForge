import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchExamPage, fetchExamQueuePage } from '../../api/admin.js';
import { useAdminPagedList } from '../../hooks/useAdminPagedList.js';
import {
  ColorTag,
  EmptyState,
  Notice,
  StatusDot,
} from './AdminBits.jsx';
import AdminExamAddQuestionsDialog from './AdminExamAddQuestionsDialog.jsx';
import AdminExamDialog from './AdminExamDialog.jsx';
import AdminExamQuestionsDialog from './AdminExamQuestionsDialog.jsx';
import { formatDateTime } from '../../utils/format.js';

// B 端竞赛管理
//
//   GET /exam/list?pageNum=                    → 全部竞赛（ExamListVO，带 total）
//   GET /user/exam/list/queue?option=&pageNum= → 按时间状态筛选
//                                                option：0 未开始 / 1 进行中 / 2 已结束
//
// 列表形态与题目管理一致 = 「区内无限滚动」：区域高度有上限（admin.css 的
// .admin-scroll-area），在区域里滚到底就自动拉下一页追加。
//
//   POST /exam/b/add                           → 新增竞赛（弹窗）
// 「查看竞赛题目」会打开弹窗，里面调 /exam/listQuestion 列出这场竞赛的题目，
// 并支持把某道题移出竞赛（DELETE /exam/b/delete）。
// 「添加题目」会打开题目选择弹窗（POST /exam/b/question/add）。
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

// 四个分类：全部走 /exam/list，其余走 /user/exam/list/queue 的 option
const TABS = [
  { key: 'all', label: '全部', option: null },
  { key: 'unstart', label: '未开始', option: 0, kind: 'warning' },
  { key: 'unfinish', label: '进行中', option: 1, kind: 'success' },
  { key: 'finished', label: '已结束', option: 2, kind: 'muted' },
];

export default function AdminExams() {
  const [tab, setTab] = useState('all');
  const [notice, setNotice] = useState(null);
  // 正在查看题目的那场竞赛（null = 没开弹窗）
  const [viewExam, setViewExam] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  // 正在给哪场竞赛添加题目（null = 没开弹窗）
  const [addQExam, setAddQExam] = useState(null);
  // 新增成功后是否把列表翻到底（新竞赛的 examId 最大，排在最后一页）
  const [revealEnd, setRevealEnd] = useState(false);
  const areaRef = useRef(null);

  const current = TABS.find((t) => t.key === tab) || TABS[0];

  const { items, total, loading, loadingMore, error, hasMore, loadNext, reload } =
    useAdminPagedList(
      (pageNum) =>
        current.option == null
          ? fetchExamPage(pageNum)
          : fetchExamQueuePage(current.option, pageNum),
      // 分类就是查询条件：换了分类就清空、从第 1 页重来
      current.key
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

  // 切分类后把滚动区域拉回顶部
  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = 0;
  }, [tab]);

  // 新增成功：
  //  1. 后端只失效了 exam:list:page:*，按时间划分的三个缓存（exam:unstart /
  //     unfinish / finished）是每天 0 点和服务启动时才重建的，所以新建的竞赛在
  //     「未开始」等分类里暂时看不到 —— 直接切回「全部」；
  //  2. 新竞赛 examId 最大、排在最后一页，列表又是一页页往后加载的，
  //     所以标记一下让它连续往后拉到底，把新竞赛翻到眼前。
  const handleAdded = ({ title }) => {
    setAddOpen(false);
    setNotice(`已新增竞赛「${title}」`);
    if (tab === 'all') reload();
    else setTab('all');
    setRevealEnd(true);
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
          <span className="admin-chips">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`admin-chip${t.kind ? ` is-${t.kind}` : ''}${
                  tab === t.key ? ' is-active' : ''
                }`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
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

        {notice && <Notice onClose={() => setNotice(null)}>{notice}</Notice>}

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
                  <th style={{ width: 230 }} className="col-actions">
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
                            查看竞赛题目
                          </button>
                          <button
                            type="button"
                            className="admin-btn"
                            onClick={() => setAddQExam(e)}
                          >
                            添加题目
                          </button>
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

      {addQExam && (
        <AdminExamAddQuestionsDialog
          exam={addQExam}
          onClose={(msg) => {
            setAddQExam(null);
            if (msg) setNotice(msg);
          }}
        />
      )}

      {viewExam && (
        <AdminExamQuestionsDialog
          exam={viewExam}
          onClose={() => setViewExam(null)}
        />
      )}
    </>
  );
}
