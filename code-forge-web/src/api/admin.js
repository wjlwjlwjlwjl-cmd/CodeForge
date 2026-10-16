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

/* ---------------- 竞赛管理 ---------------- */

// GET /exam/list?pageNum=  → ExamListVO { total, pages, pageNum, pageSize, list: ExamVO[] }
//   ExamVO = { examId, title, startTime, endTime, status }（status：1 已发布 / 0 未发布）
// ⚠️ 后端这一版返回的 pages 恒为 1（ExamService 里 total/pageSize 那行三元写错了），
//    不能拿它判断有没有下一页，所以这里把 pages 丢掉，
//    让通用列表退回「本页是否满页」的判断。
export async function fetchExamPage(pageNum = 1) {
  const d = await request(`/exam/list?pageNum=${Number(pageNum) || 1}`);
  return { ...(d || {}), pages: undefined };
}

// GET /exam/listQuestion?examId=&pageNum=  → ExamQuestionListVO extends BasePageVO<QuestionVO>
//   QuestionVO = { id, title, difficulty, timeLimit, spaceLimit }
// ⚠️ 后端是把「本页 questionId 对应的题目」查出来，再用 PageInfo 包了一层**内存 List**，
//    不是数据库分页，于是这几个字段都不是真值：
//      · pages    恒为 1（第 10 题之后前端会以为已经到底）
//      · total    是「本页条数」，第 2 页起直接变 0
//      · pageSize 也是「本页条数」，最后一页只剩 1 条时会被当成满页
//    所以都不采用：total 不展示（只报已加载多少），pageSize 按后端固定页长
//    （CommonConstants.PAGE_SIZE = 10）来算，这样不满页就能立刻判定到底。
const EXAM_QUESTION_PAGE_SIZE = 10;

export async function fetchExamQuestionPage(examId, pageNum = 1) {
  const qs = new URLSearchParams({
    examId: String(examId),
    pageNum: String(Math.max(1, Number(pageNum) || 1)),
  });
  const d = await request(`/exam/listQuestion?${qs.toString()}`);
  const list = Array.isArray(d?.list) ? d.list : [];
  return { list, pageSize: EXAM_QUESTION_PAGE_SIZE };
}

// DELETE /exam/b/delete?examId=&questionId=（从竞赛里移除一道题，不是删题库里的题）
// ⚠️ 后端 checkExam(examId, false) 会拦三种情况：竞赛已发布(3208)、
//    竞赛已开始(3201)、竞赛已结束(3207)，都必须先在竞赛管理里「取消发布」才能改。
export async function deleteExamQuestion({ examId, questionId }) {
  const qs = new URLSearchParams({
    examId: String(examId),
    questionId: String(questionId),
  });
  return request(`/exam/b/delete?${qs.toString()}`, { method: 'DELETE' });
}

// POST /exam/b/add  参数 ExamAddDTO { title, startTime, endTime }
// ⚠️ 后端这两个时间字段是 @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")，
//    所以必须传 "2026-10-20 09:00:00"（空格分隔），传 ISO 的 "2026-10-20T09:00" 会解析失败。
//    前端表单用的是 <input type="datetime-local">（值形如 "2026-10-20T09:00"），
//    这里统一转成后端要的格式。
// 校验（前端已预先做一遍，见 AdminExamDialog）：
//   · 开始时间不能早于当前时间（3201）
//   · 开始时间不能晚于结束时间（3202）
// 新建出来的竞赛 status = 0（未发布）。
function toApiDateTime(value) {
  if (!value) return null;
  const raw = String(value).trim().replace('T', ' ');
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})(?::(\d{2}))?$/.exec(raw);
  if (!m) return raw;
  return `${m[1]} ${m[2]}:${m[3] || '00'}`;
}

export async function addExam({ title, startTime, endTime }) {
  return request('/exam/b/add', {
    method: 'POST',
    body: {
      title,
      startTime: toApiDateTime(startTime),
      endTime: toApiDateTime(endTime),
    },
  });
}

// POST /exam/b/question/add  参数 ExamQuestionAdd { examId, questions:[questionId,…] }
//   一次提交一批题目 id（后端是 LinkedHashSet，重复的会去重）
// ⚠️ 两个后端行为要注意：
//   · checkExam(examId, false)：竞赛「已发布 / 已开始 / 已结束」都不允许改（3208/3201/3207）
//   · 只要提交的 id 里有一个已经在这场竞赛里了，整批失败并返回 3209「竞赛题目已存在」
//     —— 所以弹窗里会把已在竞赛中的题目标出来、不允许勾选。
export async function addExamQuestions({ examId, questionIds }) {
  return request('/exam/b/question/add', {
    method: 'POST',
    body: { examId, questions: questionIds },
  });
}

// GET /exam/detail?examId= → ExamVO
//   { examId, title, startTime, endTime, status, createTime, updateTime, createBy, updateBy }
//   注意：竞赛不存在时后端返回的是 data:null（不是报错），调用方要判空
export async function fetchExamDetail(examId) {
  return request(`/exam/detail?examId=${encodeURIComponent(String(examId))}`);
}

// POST /exam/b/edit  参数 ExamEditDTO { examId, title, startTime, endTime }
//   时间格式同 add（"yyyy-MM-dd HH:mm:ss"）
//   后端校验：checkExam(examId,false) —— 已发布(3208) / 已开始(3201) / 已结束(3207) 都不允许改；
//   注意后端这里**不**重校 start<end，前端沿用新增那套预先校验。
export async function editExam({ examId, title, startTime, endTime }) {
  return request('/exam/b/edit', {
    method: 'POST',
    body: {
      examId: Number(examId),
      title,
      startTime: toApiDateTime(startTime),
      endTime: toApiDateTime(endTime),
    },
  });
}

// DELETE /exam/b/delete/{examId} → 删竞赛（连同竞赛题目关联）
//   同样走 checkExam(examId,false)，已发布 / 已开始 / 已结束都不能删
export async function deleteExam(examId) {
  return request(`/exam/b/delete/${encodeURIComponent(String(examId))}`, {
    method: 'DELETE',
  });
}

// PUT /exam/b/publish?examId=  发布竞赛（status=1，C 端才看得到）
//   后端 checkExam(examId,false)：必须未发布 + 未开始 + 未结束
export async function publishExam(examId) {
  return request(`/exam/b/publish?examId=${encodeURIComponent(String(examId))}`, {
    method: 'PUT',
  });
}

// PUT /exam/b/publish_cancel?examId=  取消发布（status=0）
//   后端 checkExam(examId,true)：只校验竞赛存在，任何状态都能取消发布
export async function publishCancelExam(examId) {
  return request(
    `/exam/b/publish_cancel?examId=${encodeURIComponent(String(examId))}`,
    { method: 'PUT' }
  );
}
