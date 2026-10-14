import { getToken, isAuthed, goToLogin, goAfterAuth } from './config.js';

// 进入页面前的同步路由守卫（在 React 挂载之前调用）
//
// 规则：
//   0. B 端管理后台自行鉴权，直接放行；
//   1. 只有「本会话已经过后端校验、且本地仍有 token」才视为已登录，直接放行；
//   2. 其余情况（无 token，或本会话还没校验过）一律先去登录页：
//        由登录页拿 token 调后端接口校验，通过后再回到原本要访问的页面；
//        校验不通过就停在登录页。
//   3. 已登录却停在登录页，则直接送回目标页。
//
// 说明：日志/校验的「本会话」标记存在 sessionStorage（见 config.js），
// 因此同一标签页内的整页跳转不会反复经过登录页，而新标签页 / 新会话
// 访问任意 URL 都会先到登录页确认登录态。
//
// 返回 true 表示可以继续渲染当前页面；返回 false 表示已经发起跳转
// （此时不需要渲染，避免先闪一下页面内容）。

// B 端管理后台（?page=admin 或 /admin）有独立的管理员登录态
// （localStorage['cf:adminToken']），不参与 C 端的登录守卫。
function isAdminEntry(url) {
  if (url.searchParams.get('page') === 'admin') return true;
  return url.pathname.replace(/\/+$/, '') === '/admin';
}

export function guardRoute() {
  const url = new URL(window.location.href);
  if (isAdminEntry(url)) return true;

  const isLoginPage = url.searchParams.get('page') === 'login';
  // 本会话已通过后端校验，且本地仍有 token → 放行
  const verified = isAuthed() && !!getToken();

  if (verified) {
    // 已登录却停在登录页：直接回目标页（不再重复校验）
    if (isLoginPage) {
      goAfterAuth();
      return false;
    }
    return true;
  }

  // 未校验：已经在登录页就放行（由登录页完成校验），否则先去登录页
  if (isLoginPage) return true;
  goToLogin();
  return false;
}
