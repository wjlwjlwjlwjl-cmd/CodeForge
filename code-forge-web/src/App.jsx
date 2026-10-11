import { useCallback, useEffect, useRef, useState } from 'react';
import Layout from './components/Layout.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import QuestionLibrary from './components/QuestionLibrary.jsx';
import LoginPage from './components/LoginPage.jsx';
import HomePage from './components/HomePage.jsx';
import { useQuestion } from './hooks/useQuestion.js';
import { useJudge } from './hooks/useJudge.js';
import { usePreferences } from './hooks/usePreferences.js';
import { isLoggedIn, goToLogin, TOKEN_STORAGE_KEY } from './config.js';
import { logout as logoutApi } from './api/user.js';
import { clearAvatar } from './api/avatarStore.js';

// 从 URL query 解析题目 id（如 ?id=802）
function parseIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id == null || id.trim() === '') return null;
  return id.trim();
}

// 是否显示登录页（如 ?page=login）。不引入路由，只用一个 query 开关
function isLoginPage() {
  const params = new URLSearchParams(window.location.search);
  return params.get('page') === 'login';
}

// 页面模式：?page=login → 登录页；?id=xxx → 代码编辑页；否则 → 首页
function parsePage() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('page') === 'login') return 'login';
  if (params.get('id') != null && params.get('id').trim() !== '') return 'editor';
  return 'home';
}

export default function App() {
  const [currentId, setCurrentId] = useState(parseIdFromQuery);
  // 当前页面：'login' | 'home' | 'editor'
  const [page, setPage] = useState(parsePage);
  const loginPage = page === 'login';

  // 未登录且不在登录页时，强制跳转登录页
  // （token 只来自登录页，其余页面不再硬编码）
  useEffect(() => {
    if (!loginPage && !isLoggedIn()) {
      goToLogin();
    }
  }, [loginPage]);

  // 登录成功后：持久化 token，并跳到首页
  const handleLoginSuccess = useCallback((token) => {
    try {
      if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
    } catch (e) {
      // 存储失败忽略（如隐私模式）
    }
    // 新登录：清掉上一个账号残留的头像缓存，首页会重新获取
    clearAvatar();
    const url = new URL(window.location.href);
    url.searchParams.delete('page');
    url.searchParams.delete('id');
    window.location.href = url.toString();
  }, []);

  // 退出登录：调后端 /user/logout 删除服务端登录态，再清本地 token、回登录页
  const handleLogout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (e) {
      // 后端登出失败不阻塞本地登出
      console.warn('[logout] 后端登出失败:', e.message);
    }
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (e) {
      // 忽略
    }
    // 清掉缓存的头像，避免下个账号串号
    clearAvatar();
    goToLogin();
  }, []);

  // 顶栏导航：竞赛 / 提交记录（当前先定位到首页对应区块）
  const goHomeAndScroll = useCallback((sectionId) => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('id') || url.searchParams.get('page')) {
      url.searchParams.delete('page');
      url.searchParams.delete('id');
      window.location.href = url.toString();
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleOpenContests = useCallback(
    () => goHomeAndScroll('home-contests'),
    [goHomeAndScroll]
  );
  const handleOpenHistory = useCallback(
    () => goHomeAndScroll('home-history'),
    [goHomeAndScroll]
  );

  // 返回首页（编辑页顶栏点击 Logo）
  const handleOpenEditorHome = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    url.searchParams.delete('page');
    window.location.href = url.toString();
  }, []);

  // 打开代码编辑页（指定题目 id）
  const handleOpenEditor = useCallback((id) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('page');
    url.searchParams.set('id', String(id ?? 920));
    window.location.href = url.toString();
  }, []);
  // 题库抽屉是否打开
  const [libraryOpen, setLibraryOpen] = useState(false);
  // 右侧代码编辑器（用于把「提交详情 / 判题结果」里的代码复制回编辑区）
  const editorRef = useRef(null);
  const handleCopyCodeToEditor = useCallback((code) => {
    editorRef.current?.setCode(code);
  }, []);
  const {
    theme,
    monacoTheme,
    toggleTheme,
    editorFontSize,
    setEditorFontSize,
    zoom,
    splitRatio,
    setSplitRatio,
    vimMode,
    setVimMode,
  } = usePreferences();

  // 切换题目：更新 state，并把 ?id= 同步到地址栏（不新增历史记录）
  const handleSwitchQuestion = useCallback((newId) => {
    setCurrentId(String(newId));
    const url = new URL(window.location.href);
    url.searchParams.set('id', newId);
    window.history.replaceState(null, '', url);
  }, []);

  // 登录页不拉题目数据（且未登录时若去请求会不断重定向，形成死循环）
  const activeId = loginPage ? null : currentId;

  const {
    data: question,
    loading: questionLoading,
    error: questionError,
    notice: questionNotice,
    clearNotice,
    retry,
    switching,
    goPrev,
    goNext,
  } = useQuestion(activeId, { onSwitch: handleSwitchQuestion });

  const { result, judging, submitError, submit } = useJudge(activeId);

  // 从题库选择题目：切题 + 关闭抽屉
  const handleSelectQuestion = useCallback(
    (q) => {
      if (q?.id != null) handleSwitchQuestion(q.id);
      setLibraryOpen(false);
    },
    [handleSwitchQuestion]
  );

  // 将主题同步到 <html> 元素，确保 body、overscroll 区域、浏览器原生滚动条
  // 都能取到正确的暗/亮色 CSS 变量（:root 变量在 html 层面切换）
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // 边界提示 toast：3 秒后自动消失
  useEffect(() => {
    if (!questionNotice) return;
    const t = setTimeout(() => clearNotice?.(), 3000);
    return () => clearTimeout(t);
  }, [questionNotice, clearNotice]);

  return (
    <div className="app" data-theme={theme} style={{ zoom: zoom }}>
      {loginPage ? (
        <LoginPage
          theme={theme}
          onToggleTheme={toggleTheme}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : page === 'home' ? (
        <HomePage
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
          onOpenEditor={handleOpenEditor}
          onOpenContests={handleOpenContests}
          onOpenHistory={handleOpenHistory}
        />
      ) : (
        <>
          <header className="app-header">
          <div className="app-header-left">
            <button
              type="button"
              className="app-brand app-brand-btn"
              onClick={handleOpenEditorHome}
              title="回到首页"
            >
              <img className="app-logo" src="/code.png" alt="" aria-hidden="true" />
              <span className="app-brand-name">Code Forge</span>
            </button>

            <button
              type="button"
              className="library-btn"
              onClick={() => setLibraryOpen(true)}
              title="题库"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="3.5" cy="6" r="1" />
                <circle cx="3.5" cy="12" r="1" />
                <circle cx="3.5" cy="18" r="1" />
              </svg>
              题库
            </button>

            {currentId != null && (
              <div className="question-nav">
                <button
                  type="button"
                  className="nav-btn"
                  onClick={goPrev}
                  disabled={switching}
                  title="上一题"
                  aria-label="上一题"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
                    strokeLinejoin="round">
                    <polyline points="15 5 8 12 15 19" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="nav-btn"
                  onClick={goNext}
                  disabled={switching}
                  title="下一题"
                  aria-label="下一题"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
                    strokeLinejoin="round">
                    <polyline points="9 5 16 12 9 19" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="app-header-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>
        {/* 边界提示：屏幕中央弹出的灰底 toast */}
        {questionNotice && (
          <div className="toast" role="status" aria-live="polite">
            {questionNotice}
          </div>
        )}

        {/* 题库抽屉 */}
        <QuestionLibrary
          open={libraryOpen}
          currentId={currentId}
          onClose={() => setLibraryOpen(false)}
          onSelect={handleSelectQuestion}
        />

        {currentId == null ? (
          <div className="panel-center">
            <div className="error-text">缺少题目 ID，请在 URL 后加 ?id= 指定题目（如 ?id=802）</div>
          </div>
        ) : (
          <Layout
            question={question}
            questionId={currentId}
            questionLoading={questionLoading}
            questionError={questionError}
            onRetry={retry}
            monacoTheme={monacoTheme}
            editorFontSize={editorFontSize}
            onEditorFontSizeChange={setEditorFontSize}
            vimMode={vimMode}
            onVimModeChange={setVimMode}
            judging={judging}
            result={result}
            submitError={submitError}
            onSubmit={submit}
            onCopyCodeToEditor={handleCopyCodeToEditor}
            editorRef={editorRef}
            splitRatio={splitRatio}
            onSplitRatioChange={setSplitRatio}
          />
        )}
        </>
      )}
    </div>
  );
}
