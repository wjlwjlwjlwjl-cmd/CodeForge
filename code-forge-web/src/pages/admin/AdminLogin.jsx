import { useState } from 'react';
import ThemeToggle from '../../components/ThemeToggle.jsx';

// B 端登录：POST /system/b/login（网关白名单，无需 token）
//   参数 SysLoginDTO { userAccount, password } → data { token }
//   失败示例：3103 用户名密码错误 / 3102 用户不存在
export default function AdminLogin({ theme, onToggleTheme, onLogin }) {
  const [form, setForm] = useState({ userAccount: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.userAccount.trim() || !form.password) {
      setError('请填写管理员账号与密码');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onLogin({
        userAccount: form.userAccount.trim(),
        password: form.password,
      });
    } catch (err) {
      setError(err?.message || '登录失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login-wrap">
      <form className="admin-login" onSubmit={submit}>
        <div className="admin-login-head">
          <img src="/code.png" alt="" aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong>Code Forge</strong>
            <span>ADMIN CONSOLE</span>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>

        <h1 className="admin-login-title">管理员登录</h1>

        {error && <p className="admin-login-error">{error}</p>}

        <div className="admin-field">
          <label htmlFor="admin-account">账号</label>
          <input
            id="admin-account"
            className="admin-input w-lg"
            type="text"
            autoComplete="username"
            placeholder="管理员账号"
            value={form.userAccount}
            onChange={(e) =>
              setForm((p) => ({ ...p, userAccount: e.target.value }))
            }
          />
        </div>

        <div className="admin-field">
          <label htmlFor="admin-password">密码</label>
          <input
            id="admin-password"
            className="admin-input w-lg"
            type="password"
            autoComplete="current-password"
            placeholder="密码"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn primary" disabled={busy}>
            {busy ? '登录中…' : '登录'}
          </button>
        </div>
      </form>
    </div>
  );
}
