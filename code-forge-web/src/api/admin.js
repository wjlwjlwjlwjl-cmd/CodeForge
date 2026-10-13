import { SUCCESS_CODE, HOST, API_GATEWAY_PORT } from '../config.js';

// ============================================================
// B 端（管理后台）接口封装
//
// 与 C 端完全隔离：
//   · token 单独存放于 localStorage['cf:adminToken']，不碰 C 端的 cf:token
//   · 不修改 config.js 里任何 C 端请求逻辑，只复用 HOST / 网关端口 / 成功码
//
// 网关路由（share-gateway-test.yaml）：
//   /system/**  → code-forge-system
//   /user/b/**  → code-forge-system
//   /question/**→ code-forge-system
//   /exam/**    → code-forge-system
// ============================================================

export const ADMIN_TOKEN_KEY = 'cf:adminToken';

export function getAdminToken() {
  try {
    const raw = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : '';
  } catch (e) {
    return '';
  }
}

export function setAdminToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify(token));
    } else {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch (e) {
    // 忽略
  }
}

function adminAuthHeaders(extra) {
  const headers = { ...(extra || {}) };
  const token = getAdminToken();
  if (token) headers.Authorization = token;
  return headers;
}

const base = () => `http://${HOST}:${API_GATEWAY_PORT}`;

// 统一解析 { code, msg, data }
async function request(path, { method = 'GET', body, auth = true } = {}) {
  const init = {
    method,
    headers: auth ? adminAuthHeaders() : {},
  };
  if (body !== undefined) {
    init.headers = { ...init.headers, 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${base()}${path}`, init);
  } catch (e) {
    const err = new Error('网络异常，请检查服务是否可用');
    err.code = 'NETWORK';
    throw err;
  }

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    const err = new Error(`服务返回异常（HTTP ${res.status}）`);
    err.code = 'HTTP';
    throw err;
  }

  if (json?.code !== SUCCESS_CODE) {
    const err = new Error(json?.msg || `请求失败（code=${json?.code}）`);
    err.code = json?.code;
    throw err;
  }
  return json.data;
}

/* ---------------- 身份认证 ---------------- */

// POST /system/b/login   参数 { userAccount, password } → { token }（白名单，无需 token）
export async function adminLogin({ userAccount, password }) {
  return request('/system/b/login', {
    method: 'POST',
    body: { userAccount, password },
    auth: false,
  });
}

// DELETE /system/b/logout
export async function adminLogout() {
  return request('/system/b/logout', { method: 'DELETE' });
}

// GET /system/b/info → { id, userId, userAccount, nickName, createBy, updateBy, createTime, updateTime }
// 注意：接口没有返回角色字段，前端不要臆造
export async function fetchAdminInfo() {
  return request('/system/b/info');
}

/* ---------------- 管理员管理 ---------------- */

// GET /system/b/list → { list: [{ id, userId, userAccount, nickName, createTime, updateTime, ... }] }
export async function fetchAdminList() {
  return request('/system/b/list');
}

// POST /system/b/add  参数 AddAdminDTO { nickname（非空）, password（6~12 位） } → { userAccount }
export async function addAdmin({ nickname, password }) {
  return request('/system/b/add', {
    method: 'POST',
    body: { nickname, password },
  });
}

// DELETE /system/b/delete/{userAccount} → 受影响行数
export async function deleteAdmin(userAccount) {
  return request(`/system/b/delete/${encodeURIComponent(userAccount)}`, {
    method: 'DELETE',
  });
}

/* ---------------- B 端用户管理 ---------------- */

// GET /user/b/list  参数 UserQueryDTO { pageNum, userId, nickName }（查询条件走 query string）
// → { total, pages, pageNum, pageSize, list: [{ userId, nickName, sex, email, schoolName,
//      majorName, introduce, status, createTime, updateTime, updateBy }] }
// status: 0-拉黑  1-正常（见 01-init.sql 里 tb_user.status 注释）
export async function fetchUserList({ pageNum = 1, userId, nickName } = {}) {
  const qs = new URLSearchParams({ pageNum: String(pageNum) });
  if (userId) qs.set('userId', String(userId));
  if (nickName) qs.set('nickName', nickName);
  return request(`/user/b/list?${qs.toString()}`);
}

// POST /user/b/update  参数 UserDTO { userId, status }
// 后端签名是 updateStatus(UserDTO userDTO, ...)，没有 @RequestBody，
// 所以必须用 query string 传参（用 JSON body 会绑定不到字段）
export async function updateUserStatus({ userId, status }) {
  const qs = new URLSearchParams({
    userId: String(userId),
    status: String(status),
  });
  return request(`/user/b/update?${qs.toString()}`, { method: 'POST' });
}

/* ---------------- 数量统计（复用已存在且可用的列表接口） ---------------- */

// GET /question/list?pageNum=1 → { total, ... }  total = 题目总数
export async function fetchQuestionTotal() {
  const data = await request('/question/list?pageNum=1');
  return typeof data?.total === 'number' ? data.total : null;
}

// GET /exam/list?pageNum=1 → { total, ... }  total = 竞赛总数
export async function fetchExamTotal() {
  const data = await request('/exam/list?pageNum=1');
  return typeof data?.total === 'number' ? data.total : null;
}
