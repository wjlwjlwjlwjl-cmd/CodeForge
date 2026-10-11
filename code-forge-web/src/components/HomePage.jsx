import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppHeader from '../components/AppHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import ContestCard from '../components/ContestCard.jsx';
import ProblemItem from '../components/ProblemItem.jsx';
import ContestBrowser from '../components/ContestBrowser.jsx';
import { useHomeData } from '../hooks/useHomeData.js';
import { useAvatar } from '../hooks/useAvatar.js';
import { useProblemSearch } from '../hooks/useProblemSearch.js';
import { useRecentSubmissions } from '../hooks/useRecentSubmissions.js';
import { signUpContest } from '../api/home.js';
import { PASS_STATUS, DIFFICULTY } from '../config.js';
import { formatDateCN, formatRunTime } from '../utils/format.js';

// 首页（登录后跳转至此）
//   顶栏 / 欢迎区 / 数据概览 / 竞赛区（两栏）/ 刷题区（两栏）
export default function HomePage({
  theme,
  onToggleTheme,
  onLogout,
  onOpenEditor,
  onOpenContests,
  onOpenHistory,
}) {
  const { user, stats, ongoing, mine, loading } = useHomeData();

  // 竞赛抽屉（点顶栏「竞赛」打开）
  const [contestOpen, setContestOpen] = useState(false);

  // 进入首页时异步获取头像（不阻塞页面渲染），
  // 结果存入全局 avatarStore，后续所有展示头像的地方共用
  useAvatar({ load: true });

  // 各区块淡入延迟（stagger）
  const delay = (i) => 80 + i * 70;

  return (
    <div className="home-page">
      <AppHeader
        theme={theme}
        onToggleTheme={onToggleTheme}
        user={user}
        onLogout={onLogout}
        onProfile={() => {}}
        onBrandClick={() => {}}
        navItems={[
          { key: 'contest', label: '竞赛', onClick: () => setContestOpen(true) },
          { key: 'problem', label: '题目', active: true },
          { key: 'history', label: '提交记录', onClick: onOpenHistory },
        ]}
      />

      <main className="home-main">
        <WelcomeSection
          user={user}
          loading={loading}
          onStart={() => onOpenEditor?.(920)}
        />

        <StatsSection stats={stats} delay={delay} />

        <ContestsSection
          ongoing={ongoing}
          mine={mine}
          delay={delay}
          onOpenEditor={onOpenEditor}
          onOpenAll={() => setContestOpen(true)}
        />

        <PracticeSection onOpenEditor={onOpenEditor} />
      </main>

      <ContestBrowser
        open={contestOpen}
        onClose={() => setContestOpen(false)}
        onSelectQuestion={(id) => {
          setContestOpen(false);
          onOpenEditor?.(id);
        }}
      />
    </div>
  );
}

/* ============================ 欢迎区 ============================ */
function WelcomeSection({ user, loading, onStart }) {
  const name = user?.nickName || user?.email || '同学';

  return (
    <section className="home-section welcome-section">
      <div className="welcome-left">
        <h1 className="welcome-title">
          欢迎回来，<span className="welcome-name">{loading ? '…' : name}</span>
        </h1>
        <p className="welcome-tagline">// Forge your code, sharpen your mind</p>
      </div>
      <button type="button" className="welcome-start" onClick={onStart}>
        开始刷题
      </button>
    </section>
  );
}

/* ============================ 数据概览 ============================ */
function StatsSection({ stats, delay }) {
  // 数据来自 GET /user/submitInfo，任一项不合法则展示 N/A
  const cards = [
    { label: '通过数', value: stats?.passSum ?? 'N/A', hint: 'AC 提交次数' },
    {
      label: '通过率',
      value: stats?.passRate ?? 'N/A',
      hint: '通过数 / 总提交数',
      accent: true,
      progress: stats?.passRatePercent ?? null,
    },
    { label: '总提交数', value: stats?.submitSum ?? 'N/A', hint: '累计提交次数' },
  ];

  return (
    <section className="home-section">
      <div className="stat-grid">
        {cards.map((c, i) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            hint={c.hint}
            accent={c.accent}
            progress={c.progress}
            delay={delay(i)}
          />
        ))}
      </div>
    </section>
  );
}

/* ============================ 竞赛区 ============================ */
function ContestsSection({ ongoing, mine, delay, onOpenEditor, onOpenAll }) {
  // 已参加的竞赛 id，用于把「进行中」卡片按钮显示为「进入」
  const joinedIds = useMemo(
    () => new Set((mine || []).map((m) => String(m.examId))),
    [mine]
  );

  const mineMap = useMemo(() => {
    const m = new Map();
    (mine || []).forEach((x) => m.set(String(x.examId), x));
    return m;
  }, [mine]);

  const handleSignUp = useCallback(async (examId) => {
    try {
      await signUpContest(examId);
    } catch (e) {
      // 报名失败（如后端未启动）静默忽略，页面仍可浏览
      console.warn('[contest] 报名失败:', e.message);
    }
  }, []);

  return (
    <section className="home-section two-col" id="home-contests">
      <div className="col">
        <div className="section-head">
          <h2 className="section-title">进行中的竞赛</h2>
          <button type="button" className="section-more" onClick={onOpenAll}>
            全部竞赛 ›
          </button>
        </div>
        <div className="card-list">
          {(ongoing || []).map((c, i) => {
            const joined = joinedIds.has(String(c.examId));
            return (
              <ContestCard
                key={c.examId ?? i}
                title={c.title}
                startTime={c.startTime}
                endTime={c.endTime}
                actionLabel={joined ? '进入' : '报名'}
                onAction={() =>
                  joined ? onOpenEditor?.(920) : handleSignUp(c.examId)
                }
                delay={delay(i)}
              />
            );
          })}
          {!ongoing?.length && <div className="empty-hint">暂无进行中的竞赛</div>}
        </div>
      </div>

      <div className="col">
        <h2 className="section-title">我参加的竞赛</h2>
        <div className="card-list">
          {(mine || []).map((c, i) => {
            const meta = mineMap.get(String(c.examId)) || c;
            const info = { ...c, ...meta };
            return (
              <ContestCard
                key={c.examId ?? i}
                title={info.title || `竞赛 #${c.examId}`}
                startTime={info.startTime}
                endTime={info.endTime}
                statusText={statusLabel(info.status)}
                statusKind={statusKind(info.status)}
                rank={info.examRank}
                rankTime={info.rankTime}
                delay={delay(i)}
              />
            );
          })}
          {!mine?.length && <div className="empty-hint">还没有参加过竞赛</div>}
        </div>
      </div>
    </section>
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

/* ============================ 刷题区 ============================ */
function PracticeSection({ onOpenEditor }) {
  // 输入框里的关键字（未提交）与真正生效的关键字
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  // 难度筛选：null=全部，1=简单，2=中等，3=困难
  const [difficulty, setDifficulty] = useState(null);

  const { items, loading, error, hasMore, loadMore } = useProblemSearch({
    keyword,
    difficulty,
  });

  // 滚动到底部附近时加载下一页
  const handleScroll = useCallback(
    (e) => {
      if (!hasMore || loading) return;
      const el = e.currentTarget;
      // 距底部 80px 内触发
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore]
  );

  const applySearch = useCallback(() => {
    setKeyword(input.trim());
  }, [input]);

  const clearKeyword = useCallback(() => {
    setInput('');
    setKeyword('');
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') applySearch();
    },
    [applySearch]
  );

  const searching = keyword.length > 0;

  return (
    <section className="home-section two-col" id="home-history">
      <div className="col">
        <h2 className="section-title">快速刷题</h2>

        <div className="search-box">
          <input
            className="search-input"
            type="text"
            placeholder="搜索题目名称…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {searching && (
            <button
              type="button"
              className="search-clear"
              onClick={clearKeyword}
              title="清空搜索"
              aria-label="清空搜索"
            >
              ×
            </button>
          )}
          <button type="button" className="search-btn" onClick={applySearch}>
            搜索
          </button>
        </div>

        {/* 难度筛选：取值 1/2/3，可选 */}
        <div className="difficulty-filter">
          <button
            type="button"
            className={`filter-chip${difficulty == null ? ' active' : ''}`}
            onClick={() => setDifficulty(null)}
          >
            全部
          </button>
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              type="button"
              className={`filter-chip difficulty-${DIFFICULTY[d].kind}${
                difficulty === d ? ' active' : ''
              }`}
              onClick={() => setDifficulty(d)}
            >
              {DIFFICULTY[d].text}
            </button>
          ))}
        </div>

        {/* 可滚动题目列表：高度约 8 条，滚到底部自动加载下一页 */}
        <div className="problem-scroll" onScroll={handleScroll}>
          <div className="problem-list">
            {items.map((p, i) => (
              <ProblemItem
                key={p.id ?? i}
                index={i + 1}
                id={p.id}
                title={p.title}
                difficulty={p.difficulty}
                onClick={onOpenEditor}
              />
            ))}
            {!items.length && !loading && (
              <div className="empty-hint">
                {error ? error : searching ? '没有匹配的题目' : '暂无题目'}
              </div>
            )}
            {loading && <div className="list-loading">加载中…</div>}
            {!hasMore && items.length > 0 && (
              <div className="list-end">没有更多了</div>
            )}
          </div>
        </div>
      </div>

      <RecentSubmissions onOpenEditor={onOpenEditor} />
    </section>
  );
}

/* ============================ 最近提交 ============================ */
// 可滚动 + 拖动到底部分页加载（与题目列表同一思路）
// 条目：日期（xxxx年xx月xx日） / 题目 / 结果状态 / 运行时间（未通过为 N/A）
// 点击 → 跳到该条提交对应的题目
function RecentSubmissions({ onOpenEditor }) {
  const { items, loading, error, hasMore, loadMore } = useRecentSubmissions();
  const scrollRef = useRef(null);

  // 滚动到底部附近 → 加载下一页
  const handleScroll = useCallback(
    (e) => {
      if (!hasMore || loading) return;
      const el = e.currentTarget;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadMore();
    },
    [hasMore, loading, loadMore]
  );

  // 内容完全撑不满容器（无法拖动）时自动续加载；
  // 只要能滚动就交给用户拖动触发（阈值取小，避免一次拉好几页）
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollHeight - el.clientHeight < 4) loadMore();
  }, [items, loading, hasMore, loadMore]);

  return (
    <div className="col">
      <h2 className="section-title">最近提交</h2>
      <div className="submit-scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className="submit-list">
          {items.map((s, i) => (
            <SubmitRow
              key={s.submitId ?? i}
              title={s.title || `题目 #${s.questionId}`}
              pass={s.pass}
              runTime={s.runTime}
              createTime={s.createTime}
              onClick={() => onOpenEditor?.(s.questionId)}
            />
          ))}
          {!items.length && !loading && (
            <div className="empty-hint">{error || '暂无提交记录'}</div>
          )}
          {loading && <div className="list-loading">加载中…</div>}
          {!hasMore && items.length > 0 && (
            <div className="list-end">没有更多了</div>
          )}
        </div>
      </div>
    </div>
  );
}

// 提交行：日期 / 题目 / 结果状态 / 运行时间
// 运行时间只在「通过」时有意义，其余展示 N/A
// 注意：用 formatRunTime(pass, runTime)（双参，仅 pass===4 才出值）
function SubmitRow({ title, pass, runTime, createTime, onClick }) {
  const isAc = pass === 4 || pass === 'ACCEPTED';
  const status = PASS_STATUS[pass];
  const label = isAc ? '通过' : status?.text || '未通过';

  return (
    <button type="button" className="submit-row" onClick={onClick}>
      <span className="submit-row-date">{formatDateCN(createTime)}</span>
      <span className="submit-row-title">{title}</span>
      <span className={`submit-row-status ${isAc ? 'ok' : 'bad'}`}>{label}</span>
      <span className="submit-row-runtime">{formatRunTime(pass, runTime)}</span>
    </button>
  );
}
