import { useState } from 'react';
import ThemeToggle from '../../components/ThemeToggle.jsx';
import CodeForgeLogo from '../../components/CodeForgeLogo.jsx';

// B 端（管理后台）登录页
//
// 视觉与 C 端登录页保持一致：复用同一套 .login-* 样式、同一个 CodeForgeLogo 字标、
// 同样的顶栏与背景装饰，只是表单换成「账号 + 密码」，并去掉注册入口。
// 不会在 C 端登录页暴露任何 B 端入口，只能通过 /admin（或 ?page=admin）到达。
//
// 接口：POST /system/b/login  SysLoginDTO { userAccount, password } → { token }
//   失败：3103 用户名密码错误 / 3102 用户不存在
export default function AdminLogin({ theme, onToggleTheme, onLogin, checking = false }) {
  const [form, setForm] = useState({ userAccount: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (!form.userAccount.trim()) return setError('请输入管理员账号');
    if (!form.password) return setError('请输入密码');

    setSubmitting(true);
    try {
      await onLogin({
        userAccount: form.userAccount.trim(),
        password: form.password,
      });
      // 登录成功后由 useAdminSession 更新状态，AdminApp 自动切到后台界面
    } catch (err) {
      setError(err?.message || '登录失败');
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-brand">
            <img className="app-logo" src="/code.png" alt="" aria-hidden="true" />
            <span className="app-brand-name">Code Forge</span>
          </div>
        </div>

        <div className="app-header-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </header>

      {/* 背景装饰，与 C 端登录页一致 */}
      <div className="login-glow" aria-hidden="true" />
      <div className="login-grid" aria-hidden="true" />

      <main className="login-main">
        <CodeForgeLogo className="login-title" animated />
        <p className="login-tagline">Forge your code, sharpen your mind</p>
        <p className="admin-login-sub">管理员登录</p>

        {checking ? (
          <div className="login-checking" role="status" aria-live="polite">
            <span className="login-checking-spinner" aria-hidden="true" />
            正在验证登录状态…
          </div>
        ) : (
          <form className="login-card" onSubmit={submit} noValidate>
            <input
              className="login-input"
              type="text"
              name="userAccount"
              placeholder="管理员账号"
              autoComplete="username"
              value={form.userAccount}
              onChange={(e) =>
                setForm((p) => ({ ...p, userAccount: e.target.value }))
              }
            />
            <input
              className="login-input"
              type="password"
              name="password"
              placeholder="密码"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            />

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? '登录中…' : '登录'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
