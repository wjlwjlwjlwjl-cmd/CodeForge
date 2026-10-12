import { getToken } from './config.js';

// 进入页面前的同步路由守卫（在 React 挂载之前调用）
//
// 规则：
//   1. 没有 jwt token → 一律先去登录页（任何页面，包括以后新增的）；
//      同时把原来的目标（?id=xxx）保留在 URL 上，登录成功后回到那里。
//   2. 已经有 jwt token → 直接进入目标页面；如果访问的是登录页，则跳走。
//
// 返回 true 表示可以继续渲染当前页面；返回 false 表示已经发起跳转
// （此时不需要渲染，避免先闪一下页面内容）。

function redirect(url) {
  // replace 而不是 assign：不往历史里塞中间态，避免返回键在登录页来回跳
  window.location.replace(url.toString());
}

export function guardRoute() {
  const url = new URL(window.location.href);
  const isLoginPage = url.searchParams.get('page') === 'login';
  const hasToken = !!getToken();

  if (!hasToken) {
    // 未登录：已经在登录页就放行，否则跳登录页（保留 ?id= 目标）
    if (isLoginPage) return true;
    url.searchParams.set('page', 'login');
    redirect(url);
    return false;
  }

  // 已登录却停在登录页：跳到原本想去的页面（有 ?id= 就去那道题，否则首页）
  if (isLoginPage) {
    url.searchParams.delete('page');
    redirect(url);
    return false;
  }

  return true;
}
