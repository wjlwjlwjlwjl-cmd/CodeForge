import { useEffect, useRef, useState } from 'react';
import ThemeToggle from './ThemeToggle.jsx';
import { useAvatar } from '../hooks/useAvatar.js';

// 通用顶栏：左侧 Logo + 导航项，右侧主题切换 + 用户头像下拉
//
// props:
//   theme / onToggleTheme   主题
//   navItems                导航项 [{ key, label, active, onClick }]
//   user                    { nickName, avatarUrl } 为空则不显示头像
//   onLogout                退出登录
//   onProfile               个人中心（可选）
//   hideNav                 隐藏导航（登录页用）
export default function AppHeader({
  theme,
  onToggleTheme,
  navItems = [],
  user,
  onLogout,
  onProfile,
  onBrandClick,
}) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <button
          type="button"
          className="app-brand app-brand-btn"
          onClick={onBrandClick}
          title="回到首页"
        >
          <img className="app-logo" src="/code.png" alt="" aria-hidden="true" />
          <span className="app-brand-name">Code Forge</span>
        </button>

        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`nav-link${item.active ? ' active' : ''}`}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="app-header-actions">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        {user && <UserMenu user={user} onLogout={onLogout} onProfile={onProfile} />}
      </div>
    </header>
  );
}

// 用户头像 + 下拉菜单
function UserMenu({ user, onLogout, onProfile }) {
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef(null);

  // 头像统一取自全局存储（首页那一次获取的结果）
  const { avatarUrl } = useAvatar();

  // 点击外部关闭
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const nick = user?.nickName || user?.email || '';
  const initial = (nick.trim()[0] || '?').toUpperCase();
  // 拿不到（未签名 / 加载失败 / 图片加载失败）则回退默认头像
  const showImg = avatarUrl && !avatarError;

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-avatar-btn"
        onClick={() => setOpen((v) => !v)}
        title={nick}
        aria-label="用户菜单"
        aria-expanded={open}
      >
        {showImg ? (
          <img
            className="user-avatar-img"
            src={avatarUrl}
            alt={nick}
            onError={() => setAvatarError(true)}
          />
        ) : (
          <span className="user-avatar-initial">{initial}</span>
        )}
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-user">
            <span className="user-dropdown-avatar">
              {showImg ? (
                <img src={avatarUrl} alt={nick} onError={() => setAvatarError(true)} />
              ) : (
                initial
              )}
            </span>
            <span className="user-dropdown-info">
              <span className="user-dropdown-name">{nick}</span>
              {user?.email && (
                <span className="user-dropdown-email">{user.email}</span>
              )}
            </span>
          </div>
          <div className="user-dropdown-divider" />
          {onProfile && (
            <button
              type="button"
              className="user-dropdown-item"
              onClick={() => {
                setOpen(false);
                onProfile();
              }}
            >
              个人中心
            </button>
          )}
          <button
            type="button"
            className="user-dropdown-item danger"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
