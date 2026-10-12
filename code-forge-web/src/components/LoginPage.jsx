import { useCallback, useEffect, useRef, useState } from 'react';
import ThemeToggle from './ThemeToggle.jsx';
import CodeForgeLogo from './CodeForgeLogo.jsx';
import { login as loginApi, register as registerApi, sendCode as sendCodeApi } from '../api/user.js';
import { SEND_CODE_COOLDOWN_SEC } from '../config.js';

// 登录 / 注册页
//   - 顶栏与代码编辑页一致（Logo + Code Forge + 主题切换）
//   - 主体：游戏风字标 + 标语 + 表单卡片
//   - 卡片可在「登录」与「注册」之间切换（不引入路由，用内部 state）
export default function LoginPage({ theme, onToggleTheme, onLoginSuccess }) {
  // 'login' | 'register'
  const [mode, setMode] = useState('login');

  const switchMode = useCallback((next) => {
    setMode(next);
  }, []);

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

      {/* 背景光晕 */}
      <div className="login-glow" aria-hidden="true" />
      <div className="login-grid" aria-hidden="true" />

      <main className="login-main">
        <CodeForgeLogo className="login-title" animated />
        <p className="login-tagline">Forge your code, sharpen your mind</p>

        {mode === 'login' ? (
          <LoginForm
            key="login"
            onSwitch={() => switchMode('register')}
            onSuccess={onLoginSuccess}
          />
        ) : (
          <RegisterForm
            key="register"
            onSwitch={() => switchMode('login')}
            onSuccess={onLoginSuccess}
          />
        )}
      </main>
    </div>
  );
}

/* ============================ 登录表单 ============================ */
function LoginForm({ onSwitch, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (!email.trim()) return setError('请输入邮箱');
    if (!password) return setError('请输入密码');

    setSubmitting(true);
    try {
      const token = await loginApi({ email: email.trim(), password });
      // token 由外层负责持久化（onSuccess）
      onSuccess?.(token);
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="login-card" onSubmit={handleSubmit} noValidate>
      <input
        className="login-input"
        type="email"
        name="email"
        placeholder="邮箱"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="login-input"
        type="password"
        name="password"
        placeholder="密码"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <div className="login-error" role="alert">{error}</div>}

      <button type="submit" className="login-submit" disabled={submitting}>
        {submitting ? '登录中…' : '登录'}
      </button>

      <button type="button" className="login-register" onClick={onSwitch}>
        还没有账号？注册
      </button>
    </form>
  );
}

/* ============================ 注册表单 ============================ */
function RegisterForm({ onSwitch, onSuccess }) {
  const [form, setForm] = useState({
    nickName: '',
    sex: 1,
    email: '',
    code: '',
    password: '',
    schoolName: '',
    majorName: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  // 前端校验：与后端 UserRegisterDTO 注解保持一致
  const validate = () => {
    const { nickName, sex, email, code, password, schoolName, majorName } = form;
    if (!nickName || nickName.length < 4 || nickName.length > 20)
      return '昵称长度应在 4～20 个字符之间';
    if (sex !== 1 && sex !== 2) return '请选择性别';
    if (!email.trim()) return '邮箱不得为空';
    if (email.trim().length > 50) return '邮箱长度上限为 50 个字符';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return '邮箱格式不正确';
    if (!code.trim()) return '验证码不能为空';
    if (!password || password.length < 6 || password.length > 15)
      return '密码长度应在 6～15 位';
    if (schoolName && schoolName.length > 20) return '学校名称最多 20 个字符';
    if (majorName && majorName.length > 20) return '专业名称最多 20 个字符';
    return '';
  };

  // 等待验证码冷却结束
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const setField = (key) => (e) => {
    const value = key === 'sex' ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSendCode = async () => {
    if (sending || cooldown > 0) return;
    setError('');

    const email = form.email.trim();
    if (!email) return setError('请先填写邮箱');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('邮箱格式不正确');

    setSending(true);
    try {
      await sendCodeApi(email);
      setCooldown(SEND_CODE_COOLDOWN_SEC);
    } catch (err) {
      setError(err.message || '验证码发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    const msg = validate();
    if (msg) return setError(msg);

    setSubmitting(true);
    try {
      await registerApi({
        nickName: form.nickName.trim(),
        sex: form.sex,
        email: form.email.trim(),
        code: form.code.trim(),
        password: form.password,
        schoolName: form.schoolName.trim(),
        majorName: form.majorName.trim(),
      });
      // 注册成功后直接回到登录页，让用户用新账号登录
      onSwitch?.();
    } catch (err) {
      setError(err.message || '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="login-card login-card-wide" onSubmit={handleSubmit} noValidate>
      <div className="login-row">
        <input
          className="login-input"
          type="text"
          name="nickName"
          placeholder="昵称（4～20 字符）"
          value={form.nickName}
          onChange={setField('nickName')}
        />
        <select
          className="login-input login-select"
          name="sex"
          value={form.sex}
          onChange={setField('sex')}
        >
          <option value={1}>男</option>
          <option value={2}>女</option>
        </select>
      </div>

      <input
        className="login-input"
        type="email"
        name="email"
        placeholder="邮箱"
        autoComplete="username"
        value={form.email}
        onChange={setField('email')}
      />

      <div className="login-row">
        <input
          className="login-input"
          type="text"
          name="code"
          placeholder="邮箱验证码"
          value={form.code}
          onChange={setField('code')}
        />
        <button
          type="button"
          className="login-code-btn"
          onClick={handleSendCode}
          disabled={sending || cooldown > 0}
        >
          {sending ? '发送中…' : cooldown > 0 ? `${cooldown}s` : '发送验证码'}
        </button>
      </div>

      <input
        className="login-input"
        type="password"
        name="password"
        placeholder="密码（6～15 位）"
        autoComplete="new-password"
        value={form.password}
        onChange={setField('password')}
      />

      <div className="login-row">
        <input
          className="login-input"
          type="text"
          name="schoolName"
          placeholder="学校（选填）"
          value={form.schoolName}
          onChange={setField('schoolName')}
        />
        <input
          className="login-input"
          type="text"
          name="majorName"
          placeholder="专业（选填）"
          value={form.majorName}
          onChange={setField('majorName')}
        />
      </div>

      {error && <div className="login-error" role="alert">{error}</div>}

      <button type="submit" className="login-submit" disabled={submitting}>
        {submitting ? '注册中…' : '注册'}
      </button>

      <button type="button" className="login-register" onClick={onSwitch}>
        已有账号？登录
      </button>
    </form>
  );
}
