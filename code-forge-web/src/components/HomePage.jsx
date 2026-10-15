import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppHeader from '../components/AppHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import ContestCard from '../components/ContestCard.jsx';
import ProblemItem from '../components/ProblemItem.jsx';
import ContestBrowser from '../components/ContestBrowser.jsx';
import { useHomeData } from '../hooks/useHomeData.js';
import { useAvatar } from '../hooks/useAvatar.js';
import { useProblemSearch } from '../hooks/useProblemSearch.js';
import { signUpContest } from '../api/home.js';
import { useMyExams } from '../hooks/useMyExams.js';
import { fetchQuestionList } from '../api/question.js';
import { DIFFICULTY } from '../config.js';

// 首页（登录后跳转至此）
//   顶栏 / 欢迎区 / 数据概览 / 竞赛区（两栏）/ 刷题区（两栏）
export default function HomePage({
  theme,
  onToggleTheme,
  onLogout,
  onOpenEditor,
  onOpenProfile,
  themeMode,
  onThemeModeChange,
}) {
  const { user, ongoing, loading } = useHomeData();

  // 竞赛抽屉（点顶栏「竞赛」打开）
  const [contestOpen, setContestOpen] = useState(false);

  // 「开始刷题」要跳哪道题：优先用下方题目列表的第一条（避免写死 id）
  const [firstProblemId, setFirstProblemId] = useState(null);

  const handleStartPractice = useCallback(async () => {
    if (firstProblemId != null) {
      onOpenEditor?.(firstProblemId);
      return;
    }
    // 列表还没加载出来时的兜底：直接问后端要第一页的第一题
    try {
      const data = await fetchQuestionList(1);
      const id = data?.list?.[0]?.id;
      if (id != null) onOpenEditor?.(id);
    } catch (e) {
      console.warn('[start] 获取首题失败:', e.message);
    }
  }, [firstProblemId, onOpenEditor]);

  // 已报名状态来自 GET /user/exam/list/mine：报名成功后按钮变「已报名」灰色
  const { isSigned, markSigned } = useMyExams({ load: true });

  const handleSignUp = useCallback(
    async (examId) => {
      try {
        // 成功时后端返回 R.success()，data 全是 null
        await signUpContest(examId);
        markSigned(examId);
      } catch (e) {
        // 3301：后端告知已经报过名
        if (e?.code === 3301) {
          markSigned(examId);
          return;
        }
        // 其他失败静默忽略，页面仍可浏览
        console.warn('[contest] 报名失败:', e.message);
      }
    },
    [markSigned]
  );

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
        onProfile={onOpenProfile}
        themeMode={themeMode}
        onThemeModeChange={onThemeModeChange}
        onBrandClick={() => {}}
        navItems={[
          { key: 'contest', label: '竞赛', onClick: () => setContestOpen(true) },
          { key: 'problem', label: '题目', active: true },
        ]}
      />

      <main className="home-main">
        <div className="home-inner">
        <WelcomeSection
          user={user}
          loading={loading}
          onStart={handleStartPractice}
        />


        {/* 数据概览 → 快速刷题 → 进行中的竞赛（纵向堆叠） */}
        <section className="home-section home-stack">
          <PracticeProblemsCol
            onOpenEditor={onOpenEditor}
            onFirstItem={setFirstProblemId}
          />
          <OngoingContestsCol
            ongoing={ongoing}
            delay={delay}
            onOpenEditor={onOpenEditor}
            onSignUp={handleSignUp}
            isSigned={isSigned}
            onOpenAll={() => setContestOpen(true)}
          />
        </section>
        </div>
      </main>

      <ContestBrowser
        open={contestOpen}
        onClose={() => setContestOpen(false)}
        onSelectQuestion={(id, examId) => {
          setContestOpen(false);
          // 竞赛入口：把 examId 一并带到答题页
          onOpenEditor?.(id, examId);
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
        <p className="welcome-tagline">Forge your code, sharpen your mind</p>
      </div>
      <button type="button" className="welcome-start" onClick={onStart}>
        开始刷题
      </button>
    </section>
  );
}

/* ==================== 竞赛区（两个独立列） ==================== */
// 左上：进行中的竞赛
function OngoingContestsCol({
  ongoing,
  delay,
  onOpenEditor,
  onSignUp,
  onOpenAll,
  isSigned,
}) {
  return (
    <div className="col" id="home-contests">
      <div className="section-head">
        <h2 className="section-title">进行中的竞赛</h2>
        <button type="button" className="section-more" onClick={onOpenAll}>
          全部竞赛 ›
        </button>
      </div>
      <div className="card-list">
        {(ongoing || []).map((c, i) => (
          <ContestCard
            key={c.examId ?? i}
            title={c.title}
            startTime={c.startTime}
            endTime={c.endTime}
            actionLabel={isSigned?.(c.examId) ? '已报名' : '报名'}
            actionDisabled={!!isSigned?.(c.examId)}
            onAction={() => onSignUp?.(c.examId)}
            delay={delay(i)}
          />
        ))}
        {!ongoing?.length && <div className="empty-hint">暂无进行中的竞赛</div>}
      </div>
    </div>
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

/* ==================== 刷题区（右上：快速刷题） ==================== */
function PracticeProblemsCol({ onOpenEditor, onFirstItem }) {
  // 输入框里的关键字（未提交）与真正生效的关键字
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  // 难度筛选：null=全部，1=简单，2=中等，3=困难
  const [difficulty, setDifficulty] = useState(null);

  const { items, loading, error, hasMore, loadMore } = useProblemSearch({
    keyword,
    difficulty,
  });

  // 无限滚动：列表固定在「8 条高」的框内（不随题库总数变高），
  // 框内滚到底部的哨兵进入视口即加载下一页。
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  useEffect(() => {
    const root = scrollRef.current;
    const el = sentinelRef.current;
    if (!root || !el || !hasMore) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { root, rootMargin: '120px 0px' } // 在框内提前 120px 触发
    );
    io.observe(el);
    return () => io.disconnect();
    // items.length / loading 变化时重建：
    // 若哨兵仍在框内会再次回调，从而继续把框填满
  }, [hasMore, loading, items.length, loadMore]);

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

  // 把当前列表的第一条报给外层，「开始刷题」用它作为跳转目标
  useEffect(() => {
    const id = items[0]?.id;
    if (id != null) onFirstItem?.(id);
  }, [items, onFirstItem]);

  const searching = keyword.length > 0;

  return (
    <div className="col" id="home-practice">
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

        {/* 题目列表：固定在 8 条高的框内滚动，框内滑到底自动加载下一页 */}
        <div className="problem-scroll" ref={scrollRef}>
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
          {/* 无限滚动哨兵（在滚动框内部） */}
          <div ref={sentinelRef} className="list-sentinel" aria-hidden="true" />
        </div>
    </div>
  );
}
