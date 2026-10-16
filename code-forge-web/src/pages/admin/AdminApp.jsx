import { useCallback, useEffect, useState } from 'react';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import { useAdminSession } from '../../hooks/useAdminSession.js';
import { AdminIcon } from './AdminBits.jsx';
import AdminLogin from './AdminLogin.jsx';
import AdminOverview from './AdminOverview.jsx';
import AdminUsers from './AdminUsers.jsx';
import AdminAdmins from './AdminAdmins.jsx';
import AdminDetailDialog from './AdminDetailDialog.jsx';
import AdminExams from './AdminExams.jsx';
import AdminQuestions from './AdminQuestions.jsx';
import '../../styles/admin.css';

// B 端管理后台外壳：左侧固定导航 + 右侧内容区
//
// 与 C 端完全独立：独立 token、独立样式（styles/admin.css），
// 不复用 C 端的 AppHeader / 抽屉 / 状态管理。
// 入口：?page=admin（或 /admin），见 App.jsx 的 parsePage 与 routeGuard。
const SECTIONS = [
  { key: 'overview', label: '概览', icon: 'overview' },
  { key: 'users', label: '用户管理', icon: 'users' },
  { key: 'admins', label: '管理员管理', icon: 'admins' },
  { key: 'questions', label: '题目管理', icon: 'questions' },
  { key: 'exams', label: '竞赛管理', icon: 'exams' },
];

const VALID = SECTIONS.map((s) => s.key);

function readSection() {
  const tab = new URLSearchParams(window.location.search).get('tab');
  return VALID.includes(tab) ? tab : 'overview';
}

export default function AdminApp({ theme, onToggleTheme }) {
  const { token, info, loading, error, loggingOut, login, logout } =
    useAdminSession();
  const [section, setSection] = useState(readSection);
  // 宽屏下是否收起导航（窄屏由 CSS 强制收成图标栏）
  const [collapsed, setCollapsed] = useState(false);
  // 「管理员详情」弹窗（数据来自 GET /system/b/info）
  const [detailOpen, setDetailOpen] = useState(false);

  // 切换区块时同步到地址栏（replace，不产生历史记录）
  const go = useCallback((key) => {
    setSection(key);
    const url = new URL(window.location.href);
    // 路径式入口（/admin）不再重复塞 ?page=admin
    if (url.pathname.replace(/\/+$/, '') !== '/admin') {
      url.searchParams.set('page', 'admin');
    }
    url.searchParams.set('tab', key);
    window.history.replaceState(null, '', url.toString());
  }, []);

  // Esc：宽屏下收起导航（不做抽屉，避免多余交互）
  // 任何弹窗开着都让路，否则一次 Esc 会既关弹窗又收导航
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('.dialog-backdrop')) return;
      setCollapsed((v) => v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 没拿到管理员信息就不进后台：
  //   · 有 token 且仍在验证 → 「正在验证登录状态…」
  //   · 其余（无 token / 验证失败）→ 登录表单，并显示失败原因
  if (!info) {
    return (
      <AdminLogin
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLogin={login}
        checking={!!token && loading}
        sessionError={token && !loading ? error : null}
      />
    );
  }

  const nick = info?.nickName || '—';
  const account = info?.userAccount || '—';
  const current = SECTIONS.find((s) => s.key === section) || SECTIONS[0];

  return (
    <div className="admin-shell">
      {/* 左侧固定导航 */}
      <aside className={`admin-side${collapsed ? ' is-collapsed' : ''}`}>
        <div className="admin-side-head">
          <img className="admin-logo" src="/code.png" alt="" aria-hidden="true" />
          <div className="admin-side-title">
            <strong>Code Forge</strong>
            <span>ADMIN CONSOLE</span>
          </div>
          <button
            type="button"
            className="admin-collapse"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? '展开导航' : '收起导航'}
            aria-label={collapsed ? '展开导航' : '收起导航'}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
              aria-hidden="true"
            >
              <path d="M14 6l-6 6 6 6" />
            </svg>
          </button>
        </div>

        <nav className="admin-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`admin-nav-item${section === s.key ? ' is-active' : ''}`}
              onClick={() => go(s.key)}
              title={s.label}
            >
              <AdminIcon name={s.icon} />
              <span className="admin-nav-label">{s.label}</span>
            </button>
          ))}
        </nav>

        {/* 底部：当前管理员信息 + 退出 */}
        <div className="admin-side-foot">
          <div className="admin-side-user">
            <button
              type="button"
              className="admin-side-user-btn"
              onClick={() => setDetailOpen(true)}
              title="查看管理员详情"
            >
              <span className="admin-side-avatar">
                {(nick[0] || '?').toUpperCase()}
              </span>
              <span className="admin-side-user-info">
                <strong>{nick}</strong>
                <span title="账号">{account}</span>
              </span>
            </button>
            <button
              type="button"
              className="admin-side-out"
              onClick={logout}
              disabled={loggingOut}
              title="退出登录"
            >
              {loggingOut ? '…' : '退出'}
            </button>
          </div>
        </div>
      </aside>

      {/* 右侧主区 */}
      <div className="admin-main">
        {/* 顶部细信息条 */}
        <div className="admin-topbar">
          <span className="admin-topbar-sect">{current.label}</span>
          <span className="admin-topbar-sep" />
          <span className="admin-topbar-meta">
            <button
              type="button"
              className="admin-user-badge"
              onClick={() => setDetailOpen(true)}
              title="查看管理员详情"
            >
              {nick}
            </button>
            <em>账号 {account}</em>
            <em>·</em>
            {/* 后端没有角色字段，这里不臆造 */}
            <em>角色 —</em>
          </span>
          {/* 退出登录只保留下方侧栏底部那一个 */}
          <span className="admin-topbar-right">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </span>
        </div>

        <div className="admin-content">
          <div className="admin-content-inner">
            {section === 'overview' && <AdminOverview info={info} onGo={go} />}
            {section === 'users' && <AdminUsers />}
            {section === 'admins' && <AdminAdmins selfAccount={account} />}
            {section === 'questions' && <AdminQuestions />}
            {section === 'exams' && <AdminExams />}
          </div>
        </div>
      </div>

      {detailOpen && (
        <AdminDetailDialog
          fallback={info}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  );
}
