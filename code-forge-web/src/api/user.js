import {
  SUCCESS_CODE,
  authHeaders,
  getUserLoginUrl,
  getUserRegisterUrl,
  getUserSendCodeUrl,
  getUserLogoutUrl,
} from '../config.js';

// 统一解析后端 R<T> 包裹：{ code, msg, data }
// 非成功业务码时抛出携带 code 的错误，便于页面区分展示
async function postJson(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error('网络异常，请检查服务是否可用');
  }

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error(`服务返回异常（HTTP ${res.status}）`);
  }

  if (json?.code !== SUCCESS_CODE) {
    const err = new Error(json?.msg || `请求失败（code=${json?.code}）`);
    err.code = json?.code;
    throw err;
  }
  return json.data;
}

// 登录：POST /user/login  参数 { email, password }
// 成功返回 jwt token 字符串
export async function login({ email, password }) {
  return postJson(getUserLoginUrl(), { email, password });
}

// 注册：POST /user/register  参数 UserRegisterDTO
// 成功返回 true
export async function register({
  nickName,
  sex,
  email,
  code,
  password,
  schoolName,
  majorName,
}) {
  return postJson(getUserRegisterUrl(), {
    nickName,
    sex,
    email,
    code,
    password,
    schoolName,
    majorName,
  });
}

// 发送邮箱验证码：GET /user/sendCode?email=
// 成功返回 true
export async function sendCode(email) {
  const url = getUserSendCodeUrl(email);
  let res;
  try {
    res = await fetch(url, { method: 'GET' });
  } catch (e) {
    throw new Error('网络异常，请检查服务是否可用');
  }

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error(`服务返回异常（HTTP ${res.status}）`);
  }

  if (json?.code !== SUCCESS_CODE) {
    const err = new Error(json?.msg || `验证码发送失败（code=${json?.code}）`);
    err.code = json?.code;
    throw err;
  }
  return json.data;
}

// 登出：DELETE /user/logout
// 对应后端 com.wjl.friend.controller.user.UserController#logout
//   需要 Authorization 请求头（@RequestHeader(SecurityConstants.AUTHENTICATION)）
//   后端会删除 Redis 中的登录态（tokenService.delLoginUser）
//
// 返回 true 表示后端已登出；若 token 已失效（401）也视为已登出（幂等），
// 便于前端无论如何都能清理本地登录态。
export async function logout() {
  let res;
  try {
    res = await fetch(getUserLogoutUrl(), {
      method: 'DELETE',
      headers: authHeaders(),
    });
  } catch (e) {
    // 网络异常 / 本地无 token：无法调后端，但本地登录态仍应被清理
    return false;
  }

  // token 已失效：后端已无登录态，按已登出处理
  if (res.status === 401) return true;

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    // 成功时后端返回 R.success()，body 可能为空
    json = null;
  }

  if (json && json.code !== SUCCESS_CODE) {
    const err = new Error(json.msg || `登出失败（code=${json.code}）`);
    err.code = json.code;
    throw err;
  }
  return true;
}
