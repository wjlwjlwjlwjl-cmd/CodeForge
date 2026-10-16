import { HOST, API_GATEWAY_PORT, isSuccessResponse } from '../config.js';

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

// 后端返回的雪花 ID 是 19 位 Long，超出 JS 安全整数范围
// （Number.MAX_SAFE_INTEGER = 9007199254740991，只有 16 位），
// 直接 res.json() 会丢精度：
//   2110744467849048067  →  2110744467849048000
// 结果就是列表里显示一个不存在的 ID，回传后端（如拉黑用户）也会打到别人身上。
// 所以在 parse 之前，把「JSON 键后面跟着的 16 位以上整数」先包成字符串。
// 只认 "key": 1234567890123456 这种结构，不会误伤字符串内部的数字。
// （更彻底的做法是后端让 Long 序列化成 String，那样这段就能删掉；
//   前端对字符串 / 数字两种形态都兼容。）
const BIG_INT_RE = /("(?:[^"\\]|\\.)*"\s*:\s*)(-?\d{16,})(?![\d.])/g;

function parseJson(text) {
  try {
    return JSON.parse(text.replace(BIG_INT_RE, '$1"$2"'));
  } catch (e) {
    // 预处理万一没兑住，退回标准解析（宁可丢精度，也不能整个请求失败）
    return JSON.parse(text);
  }
}

// 统一解析 { code, msg, data }
//
// 成功判定统一走 isSuccessResponse：后端无参 R.success() 返回的是全 null 空对象
// （如 DELETE /system/b/logout），不能只认 code === 1000。
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
    json = parseJson(await res.text());
  } catch (e) {
    const err = new Error(`服务返回异常（HTTP ${res.status}）`);
    err.code = 'HTTP';
    throw err;
  }

  if (!isSuccessResponse(json)) {
    const err = new Error(json?.msg || `请求失败（code=${json?.code}）`);
    err.code = json?.code;
    throw err;
  }
  return json?.data ?? null;
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

// DELETE /system/b/logout  退出登录（需要 Authorization）
//
// 后端这个接口是无参 R.success()，返回 {"code":null,"msg":null,"data":null}；
// token 已失效时网关返回 3001，等价于「已登出」。
export async function adminLogout() {
  try {
    return await request('/system/b/logout', { method: 'DELETE' });
  } catch (e) {
    // 3001 / 401：后端已经没有这个登录态了，等价于登出成功
    if (e?.code === 3001 || e?.code === 401) return true;
    throw e;
  }
}

// GET /system/b/info → { userId, userAccount, nickName, createBy, updateBy, createTime, updateTime }
// 注意：接口没有返回角色字段，前端不要臆造；userId 是用户 ID（没有自增主键 id）。
export async function fetchAdminInfo() {
  return request('/system/b/info');
}

/* ---------------- 管理员管理 ---------------- */

// GET /system/b/list → { list: [{ userId, userAccount, nickName, createTime, updateTime, ... }] }
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

/* ---------------- 题目管理 ---------------- */

// GET /question/list?pageNum=  → { total, pages, pageNum, pageSize, list: QuestionVO[] }
//   QuestionVO = { id, title, difficulty, timeLimit, spaceLimit }
//   pageNum 从 1 开始（ListQuestionDTO 上有 @Min(1)）；每页条数由后端 PAGE_SIZE 决定
//   注意：这个接口在网关侧需要鉴权，所以必须带 Authorization（B 端 token 同样可用）
export async function fetchQuestionPage(pageNum = 1) {
  return request(`/question/list?pageNum=${Number(pageNum) || 1}`);
}

// GET /question/search/filter?keyword=&difficulty=&pageNum=  （ES 检索）
//   keyword    ：必填（后端 @NotBlank），空值会返回 3002 参数校验失败
//   difficulty ：可选，1 简单 / 2 中等 / 3 困难
//   返回结构和 /question/list 一致：BasePageVO<QuestionVO>
//   注意：搜索结果里只有 id/title/difficulty/timeLimit/spaceLimit，
//   没有 createBy/createTime/updateBy/updateTime（ES 文档里就没存这些）
export async function searchQuestions({ keyword, difficulty = null, pageNum = 1 }) {
  const qs = new URLSearchParams();
  qs.set('keyword', keyword ?? '');
  qs.set('pageNum', String(Number(pageNum) || 1));
  if (difficulty != null) qs.set('difficulty', String(difficulty));
  return request(`/question/search/filter?${qs.toString()}`);
}

// GET /question/detail?id= → QuestionDetailVO
//   { id, title, difficulty, timeLimit, spaceLimit, content, questionCase, defaultCode, mainFuc }
export async function fetchQuestionDetail(id) {
  return request(`/question/detail?id=${encodeURIComponent(String(id))}`);
}

// POST /question/b/add  参数 AddQuestionDTO，8 个字段全部必填：
//   title / difficulty(1~3) / timeLimit(ms) / spaceLimit(KB) /
//   content / questionCase / defaultCode / mainFuc
// 返回一句文案，如「添加成功，题目编号：108」
export async function addQuestion(dto) {
  return request('/question/b/add', { method: 'POST', body: dto });
}

// POST /question/b/edit  参数 QuestionEditDTO：id 必填，其余字段可选
// （后端 updateById 会忽略 null，传全量即可）
export async function editQuestion(dto) {
  return request('/question/b/edit', { method: 'POST', body: dto });
}

// DELETE /question/b/delete/{id} → 返回一句文案
export async function deleteQuestion(id) {
  return request(`/question/b/delete/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
  });
}
