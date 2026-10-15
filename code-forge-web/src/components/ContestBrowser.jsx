import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useExamListByTab,
  useMyExamList,
  useExamQuestions,
} from '../hooks/useExam.js';
import { useMyExams } from '../hooks/useMyExams.js';
import { useExamRank, rankText, rankTimeText } from '../hooks/useExamRank.js';
import { signUpContest } from '../api/home.js';
import { DIFFICULTY, handleApiError } from '../config.js';
import { formatDateTime } from '../utils/format.js';

// 五个分类：默认展示「进行中」
const EXAM_TABS = [
  { key: 'unfinish', label: '进行中的竞赛' },
  { key: 'unstart', label: '未开始的竞赛' },
  { key: 'finished', label: '已结束的竞赛' },
  { key: 'all', label: '全部竞赛' },
  { key: 'mine', label: '我的竞赛' },
];

// 竞赛浏览器（抽屉，从左侧滑出）
//   一级：竞赛列表            GET /exam/list?pageNum=
//   二级：某竞赛的题目列表     GET /exam/listQuestion?examId=&pageNum=
//   点击题目 → 打开代码编辑页
export default function ContestBrowser({ open, onClose, onSelectQuestion }) {
  // 当前展开的竞赛（null = 显示竞赛列表）
  const [active, setActive] = useState(null);
  // 当前展开竞赛的状态：unfinish / unstart / finished
  const [activeKind, setActiveKind] = useState('unfinish');
  // 竞赛列表的分类。放在这一层，避免进二级页面再返回时被重置
  const [tab, setTab] = useState('unfinish');
  // 报名结果提示
  const [signNotice, setSignNotice] = useState(null);
  // 已报名状态来自 GET /user/exam/list/mine（打开抽屉时拉一次；成功后刷新）
  const { isSigned, markSigned } = useMyExams({ load: open });

  // 报名：调后端，成功（或后端说已经报过）都记到本地，按钮变灰
  const handleSignUp = useCallback(
    async (examId) => {
      try {
        // 成功时后端返回 R.success()，data 全是 null
        await signUpContest(examId);
        markSigned(examId);
        setSignNotice({
          title: '报名成功',
          body: '已为你报名该竞赛，竞赛开始后即可作答。',
        });
      } catch (e) {
        // 3301：后端告知已经报过名 —— 同样记为已报名
        if (e?.code === 3301) {
          markSigned(examId);
          setSignNotice({ title: '已报名', body: '你已经报名过这场竞赛了。' });
          return;
        }
        const msg = handleApiError(e, '报名失败，请稍后重试');
        if (msg !== null) setSignNotice({ title: '报名失败', body: msg });
      }
    },
    [markSigned]
  );

  // 关闭时回到竞赛列表
  useEffect(() => {
    if (!open) {
      setActive(null);
      setActiveKind('unfinish');
    }
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
            kind={activeKind}
            onSelectQuestion={onSelectQuestion}
          />
        ) : (
          <ExamListPane
            tab={tab}
            onTabChange={setTab}
            onPick={(exam, kind) => {
              setActive(exam);
              setActiveKind(kind);
            }}
            onSignUp={handleSignUp}
            isSigned={isSigned}
          />
        )}
      </aside>

      {/* 报名结果提示：成功 / 已报名 / 失败 都由后端返回决定 */}
      {signNotice && (
        <div
          className="dialog-backdrop"
          onClick={() => setSignNotice(null)}
          role="presentation"
        >
          <div
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-title">{signNotice.title}</div>
            <div className="dialog-body">{signNotice.body}</div>
            <div className="dialog-actions">
              <button
                type="button"
                className="dialog-ok"
                onClick={() => setSignNotice(null)}
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- 一级：竞赛列表（四个分类切换） ---------------- */
function ExamListPane({ tab, onTabChange, onPick, onSignUp, isSigned }) {
  // 分页分类：
  //   'all'                  → GET /exam/list?pageNum=
  //   三个时间状态分类        → GET /user/exam/list/queue?option=&pageNum=
  // 「我的竞赛」是另一条链路（先 /user/exam/list/mine 再补详情）
  const paginated = useExamListByTab(tab);
  const mine = useMyExamList(tab === 'mine');
  const { items, total, loading, error, hasMore, loadMore } =
    tab === 'mine' ? mine : paginated;

  // 后端若返回了 total 就用它（/exam/list 一直有；/user/exam/list/queue 视版本而定），
  // 没有 total 时退回「已加载条数」，并根据是否还有下一页决定文案
  const knownTotal = Number(total) > 0;
  const countText =
    tab === 'mine'
      ? `共 ${items.length} 场竞赛`
      : knownTotal
        ? hasMore
          ? `已加载 ${items.length} / 共 ${total} 场`
          : `共 ${total} 场竞赛`
        : hasMore
          ? `已加载 ${items.length} 场`
          : `共 ${items.length} 场竞赛`;

  const listRef = useRef(null);
  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) loadMore();
  };

  // 若下拉时把分类切成内容不足一屏的列表，哨兵没进视口就不会触发加载，
  // 这里补一手：看得到底就继续加载下一页
  useEffect(() => {
    if (error || loading || !hasMore) return;
    const el = listRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 4) loadMore();
  }, [error, loading, hasMore, loadMore, items]);

  return (
    <>
      {/* 分类切换 */}
      <div className="contest-filters">
        {EXAM_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`filter-chip${tab === t.key ? ' active' : ''}`}
            onClick={() => onTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="contest-subline">{countText}</div>

      <div className="library-list" ref={listRef} onScroll={handleScroll}>
        {items.map((e, i) => {
          const action = actionFor(tab, e, isSigned?.(e.examId));
          const handleAction = () => {
            if (action.intent === 'signup') onSignUp?.(e.examId);
            else if (action.intent === 'open') onPick(e, resolveKind(tab, e));
          };
          return (
            <div className="contest-row" key={e.examId ?? i}>
              <button
                type="button"
                className="contest-row-main"
                onClick={() => onPick(e, resolveKind(tab, e))}
                title={e.title}
              >
                {/* 分类由上方 Tab 表示，这里只保留标题与时间 */}
                <span className="contest-row-head">
                  <span className="contest-row-title">{e.title}</span>
                </span>
                <span className="contest-row-time">
                  {formatDateTime(e.startTime)} ~ {formatDateTime(e.endTime)}
                </span>
              </button>

              <button
                type="button"
                className={`contest-row-action${action.primary ? ' primary' : ''}`}
                disabled={!action.primary}
                onClick={handleAction}
              >
                {action.label}
              </button>
            </div>
          );
        })}

        {loading && <div className="library-status">加载中…</div>}
        {!loading && error && <div className="library-status library-error">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="library-status">
            {tab === 'mine' ? '你还没有报名任何竞赛' : '暂无竞赛'}
          </div>
        )}
        {!loading && !error && !hasMore && items.length > 0 && (
          <div className="library-status">没有更多了</div>
        )}
      </div>
    </>
  );
}

// 按时间判断某竞赛当前处于哪种状态
function kindOf(exam) {
  const now = Date.now();
  const start = exam.startTime ? new Date(exam.startTime).getTime() : 0;
  const end = exam.endTime ? new Date(exam.endTime).getTime() : 0;
  if (end && now > end) return 'finished';
  if (start && now < start) return 'unstart';
  return 'unfinish';
}

// 「全部竞赛」「我的竞赛」没有固定的时间状态，按每场自己的时间算；
// 其余分类直接用分类本身（后端已按时间筛过）
function resolveKind(tab, exam) {
  return tab === 'all' || tab === 'mine' ? kindOf(exam) : tab;
}

// 每一行的按钮：文案、颜色、点击行为
//   我的竞赛 → 进行中的给「去答题」（进题目列表），其余按时间状态置灰
//   已报名   → 「已报名」灰色不可点（来自 /user/exam/list/mine）
//   进行中   → 「报名」主题色可点
//   未开始   → 「未开始」灰色不可点
//   已结束   → 「已结束」灰色不可点
function actionFor(tab, exam, signed) {
  if (tab === 'mine') {
    const kind = kindOf(exam);
    if (kind === 'unfinish') return { label: '去答题', primary: true, intent: 'open' };
    if (kind === 'unstart') return { label: '未开始', primary: false };
    return { label: '已结束', primary: false };
  }
  if (signed) return { label: '已报名', primary: false };
  const kind = resolveKind(tab, exam);
  if (kind === 'unfinish') return { label: '报名', primary: true, intent: 'signup' };
  if (kind === 'unstart') return { label: '未开始', primary: false };
  return { label: '已结束', primary: false };
}

/* ---------------- 二级：竞赛题目 ---------------- */
function ExamQuestionPane({ exam, kind, onSelectQuestion }) {
  // 只有「进行中」的竞赛可以点进答题页；
  // 未开始 / 已结束都只展示题目，点击时给出提示
  const canAnswer = kind === 'unfinish';
  const [notice, setNotice] = useState('');

  // 当前用户在这场比赛里的名次（后端只给「查询这一刻」的值，靠前端轮询刷新）
  const { rank, updatedAt, loading: rankLoading } = useExamRank(exam?.examId, {
    enabled: exam?.examId != null,
  });

  const handlePick = (questionId) => {
    if (canAnswer) {
      // 带上本场竞赛的 examId：答题页提交时会被视为竞赛答题
      onSelectQuestion?.(questionId, exam?.examId);
      return;
    }
    setNotice(
      kind === 'unstart'
        ? '该竞赛尚未开始，暂时无法答题'
        : '该竞赛已结束，无法答题'
    );
  };

  const { items, loading, error, hasMore, loadMore } = useExamQuestions(
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
        {/* 后端 listQuestion 的 total 是「当前页条数」，不可靠，这里用已加载数量 */}
        {hasMore ? `已加载 ${items.length} 题` : `共 ${items.length} 题`} ·{' '}
        {formatDateTime(exam.startTime)} 起
        {!canAnswer && (
          <span className="contest-subline-hint">
            {kind === 'unstart' ? '（未开始，暂不可答题）' : '（已结束）'}
          </span>
        )}
      </div>
      {/* 我的排名：每 30 秒轮询一次；未提交过时后端返回 2000，这里显示「暂无排名」 */}
      <div className="contest-rankbar">
        <span className="contest-rankbar-label">我的排名</span>
        <span
          className={`contest-rankbar-value${rank == null ? ' is-muted' : ''}`}
          title="每 30 秒自动刷新"
        >
          {rankText(rank)}
        </span>
        <span className="contest-rankbar-hint">
          {rankLoading && rank === undefined
            ? '加载中…'
            : `${rankTimeText(updatedAt) || '—'} · 30s 自动刷新`}
        </span>
      </div>

      <div className="library-list" ref={listRef} onScroll={handleScroll}>
        {items.map((q, i) => {
          const diff = DIFFICULTY[q.difficulty] || { text: '—', kind: 'muted' };
          return (
            <button
              type="button"
              key={q.id ?? i}
              className={`library-item${canAnswer ? '' : ' is-locked'}`}
              onClick={() => handlePick(q.id)}
              title={canAnswer ? q.title : `${q.title}（暂不可答题）`}
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

      {/* 不能答题时的提示弹窗 */}
      {notice && (
        <div
          className="dialog-backdrop"
          onClick={() => setNotice('')}
          role="presentation"
        >
          <div
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-title">暂时无法答题</div>
            <div className="dialog-body">{notice}</div>
            <div className="dialog-actions">
              <button
                type="button"
                className="dialog-ok"
                onClick={() => setNotice('')}
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

