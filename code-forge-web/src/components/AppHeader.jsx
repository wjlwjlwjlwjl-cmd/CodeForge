import { useEffect, useRef, useState } from 'react';
import { useAvatar } from '../hooks/useAvatar.js';
import { THEME_MODES } from '../hooks/useTheme.js';

// 通用顶栏：左侧 Logo + 导航项，右侧用户头像下拉
// （外观切换已经收进头像菜单里的「外观」二级菜单，顶栏不再单独放按钮）
//
// props:
//   navItems                导航项 [{ key, label, active, onClick }]
//   user                    { nickName, avatarUrl } 为空则不显示头像
//   onLogout                退出登录
//   onProfile               个人中心（可选）
//   themeMode / onThemeModeChange  外观：'system' | 'light' | 'dark'
export default function AppHeader({
  navItems = [],
  user,
  onLogout,
  onProfile,
  onBrandClick,
  themeMode,
  onThemeModeChange,
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
        <UserMenu
          user={user}
          onLogout={onLogout}
          onProfile={onProfile}
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
        />
      </div>
    </header>
  );
}

// 用户头像 + 下拉菜单
// 导出给编辑器页顶栏复用（两处顶栏的用户菜单必须完全一致）
export function UserMenu({
  user,
  onLogout,
  onProfile,
  themeMode,
  onThemeModeChange,
}) {
  const [open, setOpen] = useState(false);
  // 「外观」二级菜单是否展开（点一下展开，再点收起）
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef(null);

  // 头像统一取自全局存储；load:true 让「直接进编辑器页」也能拿到头像
  // （store 内部有并发去重，多次调用只会请求一次）
  const { avatarUrl } = useAvatar({ load: true });

  // 头像地址变化（例如刚上传完换新头像）时，重新尝试加载图片
  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        setAppearanceOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setAppearanceOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const nick = user?.nickName || user?.email || '';
  const initial = (nick.trim()[0] || '?').toUpperCase();
  // 优先级：真实头像 > 昵称首字母 > 默认头像。
  // 未授权 / 取不到用户信息（nick 为空）时兜底展示默认头像，
  // 保证右上角头像始终存在，进而能打开菜单退出登录。
  const hasAvatar = !!avatarUrl && !avatarError;
  const useDefault = !hasAvatar && !nick;
  const showImg = hasAvatar || useDefault;
  const imgSrc = hasAvatar ? avatarUrl : '/avatar-default.svg';

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className={`user-avatar-btn${showImg ? ' has-img' : ''}`}
        onClick={() => {
          setOpen((v) => {
            if (!v) setAppearanceOpen(false);
            return !v;
          });
        }}
        title={nick || '用户菜单'}
        aria-label="用户菜单"
        aria-expanded={open}
      >
        {showImg ? (
          <img
            className="user-avatar-img"
            src={imgSrc}
            alt={nick || '默认头像'}
            onError={hasAvatar ? () => setAvatarError(true) : undefined}
          />
        ) : (
          <span className="user-avatar-initial">{initial}</span>
        )}
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-user">
            <span
              className={`user-dropdown-avatar${showImg ? ' has-img' : ''}`}
            >
              {showImg ? (
                <img
                  src={imgSrc}
                  alt={nick || '默认头像'}
                  onError={hasAvatar ? () => setAvatarError(true) : undefined}
                />
              ) : (
                initial
              )}
            </span>
            <span className="user-dropdown-info">
              <span className="user-dropdown-name">{nick || '未登录'}</span>
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
          {/* 外观：点开后在左侧弹出三个选项 */}
          <div className="user-submenu-anchor">
            <button
              type="button"
              className={`user-dropdown-item has-sub${appearanceOpen ? ' open' : ''}`}
              aria-haspopup="menu"
              aria-expanded={appearanceOpen}
              onClick={() => setAppearanceOpen((v) => !v)}
            >
              外观
              <span className="user-dropdown-caret" aria-hidden="true">
                ‹
              </span>
            </button>

            {appearanceOpen && (
              <div className="user-submenu" role="menu" aria-label="外观">
                {THEME_MODES.map((m) => {
                  const active = themeMode === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      className={`user-submenu-item${active ? ' active' : ''}`}
                      onClick={() => onThemeModeChange?.(m.key)}
                    >
                      <span className="user-submenu-check" aria-hidden="true">
                        {active ? '✓' : ''}
                      </span>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            className="user-dropdown-item danger"
            onClick={() => {
              setOpen(false);
              setAppearanceOpen(false);
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
