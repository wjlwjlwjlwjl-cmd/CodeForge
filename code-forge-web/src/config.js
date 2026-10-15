// 全局配置：端口、鉴权、接口常量
// 说明：后端接口的实际定义已对照源码核实（见下注释），与 AGENTS.md 略有出入，以源码为准。

// IP 取自当前页面 hostname，端口固定：
//   - 网关（题目详情 + 提交判题）= 18080
//   - WebSocket（判题结果推送）= 18082
export const HOST = window.location.hostname;

export const API_GATEWAY_PORT = 18080;
export const WS_PORT = 18082;

// 统一响应包裹：code === SUCCESS_CODE 视为成功
//
// ⚠️ 特例：后端的 R.success()（无参）返回的是一个全 null 的空对象
//     { "code": null, "msg": null, "data": null }
//   只有 R.success(data) 才会带上 code=1000 / msg="success"。
//   所以判定成功的规则是「没有错误码、也没有错误信息」，
//   不能用 `code !== SUCCESS_CODE`，否则会把 R.success() 误判成失败。
//   目前返回无参 R.success() 的接口：
//     POST   /job/java/submit       提交判题
//     POST   /user/exam/signUp      竞赛报名
//     DELETE /user/logout           C 端登出
//     DELETE /system/b/logout       B 端登出
export const SUCCESS_CODE = 1000;

// 上一题/下一题到达边界时的业务码（对应后端 ResultCode 枚举）
// 判断一个 R<T> 响应是否为「成功」
//   · code 为空 或 1000，且 msg 为空或 "success" → 成功
//   · json 为 null（HTTP 200 且 body 为空）也按成功处理
export function isSuccessResponse(json) {
  if (!json) return true;
  const code = json.code;
  const msg = typeof json.msg === 'string' ? json.msg.trim() : '';
  return (code == null || code === SUCCESS_CODE) && (msg === '' || msg === 'success');
}

export const FIRST_QUESTION_CODE = 3501; // 已经是第一题
export const LAST_QUESTION_CODE = 3502; // 已经是最后一题

// 鉴权 JWT：完全由登录页登录后写入 localStorage，不再硬编码。
// 同时用于：
//   1. GET /question/detail 的 Authorization 请求头（经网关 AuthFilter 鉴权）
//   2. POST /job/java/submit 的 Authorization 请求头（JobController @RequestHeader）
//   3. WS 握手 token（ws://.../ws/judge?token=...，AuthHandshakeInterceptor 从 param 取）
// 登录态本地存储 key（用于保存 jwt token）
export const TOKEN_STORAGE_KEY = 'cf:token';

// 读取当前登录 token（登录成功后由 App 写入 localStorage）
// 未登录返回 null。
export function getToken() {
  try {
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === 'string' && parsed) return parsed;
    }
  } catch (e) {
    // 读取/解析失败视为未登录
  }
  return null;
}

// 是否已登录（存在有效 token）
export function isLoggedIn() {
  return !!getToken();
}

// 本会话是否已经过后端校验的登录态
// 放 sessionStorage：同一标签页内跨整页跳转复用；新标签页 / 新会话需要重新校验。
const AUTHED_STORAGE_KEY = 'cf:authed';

export function isAuthed() {
  try {
    return window.sessionStorage.getItem(AUTHED_STORAGE_KEY) === '1';
  } catch (e) {
    return false;
  }
}

export function markAuthed() {
  try {
    window.sessionStorage.setItem(AUTHED_STORAGE_KEY, '1');
  } catch (e) {
    // 隐私模式等存储失败忽略
  }
}

export function clearAuthed() {
  try {
    window.sessionStorage.removeItem(AUTHED_STORAGE_KEY);
  } catch (e) {
    // 忽略
  }
}

// 登录成功后要回到的目标页（由 ?redirect= 携带）。
// 只放行以单个 / 开头的站内路径，避免被构造成开放重定向。
export function readRedirectTarget() {
  try {
    const raw = new URLSearchParams(window.location.search).get('redirect');
    if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  } catch (e) {
    // 忽略
  }
  return null;
}

// 登录态确认后跳转：有目标页就原路返回，否则回首页
export function goAfterAuth() {
  const target = readRedirectTarget();
  if (target) {
    window.location.replace(target);
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.delete('page');
  url.searchParams.delete('redirect');
  window.location.replace(url.pathname + url.search + url.hash);
}

// 跳转到登录页（未登录 / 校验失败 / 被踢下线时使用）。
// 会把当前页面记进 ?redirect=，登录成功后原路返回。
export function goToLogin() {
  clearAuthed();
  const current = new URL(window.location.href);
  const alreadyLogin = current.searchParams.get('page') === 'login';
  const target = current.pathname + current.search + current.hash;

  const login = new URL(current.href);
  login.search = '';
  login.searchParams.set('page', 'login');
  if (!alreadyLogin && target && target !== '/') {
    login.searchParams.set('redirect', target);
  }
  window.location.replace(login.toString());
}

// 统一错误处理：未登录 / 登录态失效（网关 3001）则跳转登录页，否则返回可展示的错误文案
// 返回 null 表示已发起跳转，调用方无需再设置 error。
export function handleApiError(e, fallback = '请求失败') {
  if (e?.code === 'UNAUTHORIZED' || e?.code === 3001) {
    goToLogin();
    return null;
  }
  return e?.message || fallback;
}

// 构建鉴权请求头。未登录时抛出错误，避免发送空 Authorization 被网关掉回 401。
export function authHeaders(extra) {
  const token = getToken();
  if (!token) {
    const err = new Error('未登录或登录已过期，请重新登录');
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  return { Authorization: token, ...(extra || {}) };
}

// 接口路径
// 注意：题目详情是 query 参数 ?id=，不是路径参数 /{id}
export const getQuestionDetailUrl = (id) =>
  `http://${HOST}:${API_GATEWAY_PORT}/question/detail?id=${id}`;

export const getQuestionNextUrl = (id) =>
  `http://${HOST}:${API_GATEWAY_PORT}/question/next?id=${id}`;

export const getQuestionPrevUrl = (id) =>
  `http://${HOST}:${API_GATEWAY_PORT}/question/prev?id=${id}`;

// 获取题目列表（分页）
// GET {host}:18080/question/list?pageNum={n}
// 返回 { total, pages, pageNum, pageSize, list: [{ id, title, difficulty, ... }] }
export const getQuestionListUrl = (pageNum = 1) =>
  `http://${HOST}:${API_GATEWAY_PORT}/question/list?pageNum=${pageNum}`;

// 题目关键字搜索（ES，需 Authorization）
// GET {host}:18080/question/search/filter?keyword=&difficulty=&pageNum=
//   keyword    ：必填
//   difficulty ：可选，1 简单 / 2 中等 / 3 困难
// 返回 ListQuestionVO = { total, pages, pageNum, pageSize, list }
export const getQuestionSearchUrl = (keyword, difficulty, pageNum = 1) => {
  const params = new URLSearchParams();
  params.set('keyword', keyword ?? '');
  params.set('pageNum', String(pageNum));
  if (difficulty != null) params.set('difficulty', String(difficulty));
  return `http://${HOST}:${API_GATEWAY_PORT}/question/search/filter?${params.toString()}`;
};

export const getSubmitUrl = () =>
  `http://${HOST}:${API_GATEWAY_PORT}/job/java/submit`;

// 获取某道题的提交记录（分页）
// GET {host}:18080/job/ques/history?questionId={id}&pageNum={n}
// 返回 { has, total, pages, pageNum, pageSize, list: SubmitVO[] }
//   SubmitVO = { submitId, pass, programType, runTime, title, createTime }
export const getSubmitHistoryUrl = (questionId, pageNum = 1) =>
  `http://${HOST}:${API_GATEWAY_PORT}/job/ques/history?questionId=${questionId}&pageNum=${pageNum}`;

// 获取单条提交详情
// GET {host}:18080/job/submit/detail?submitId={id}
// 返回 { pass, createTime, programType, runTime, title, userCode }
export const getSubmitDetailUrl = (submitId) =>
  `http://${HOST}:${API_GATEWAY_PORT}/job/submit/detail?submitId=${submitId}`;

// 判题 WebSocket 地址。未登录时抛出错误（调用方应引导重新登录）。
export const getJudgeWsUrl = () => {
  const token = getToken();
  if (!token) {
    const err = new Error('未登录或登录已过期，请重新登录');
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  return `ws://${HOST}:${WS_PORT}/ws/judge?token=${token}`;
};

// ---------------- 用户：登录 / 注册 ----------------
// 登录：POST {host}:18080/user/login，body { email, password }
//   成功返回 data = jwt token
// 注册：POST {host}:18080/user/register，body = UserRegisterDTO
//   成功返回 data = true
// 发验证码：GET {host}:18080/user/sendCode?email={email}
// 以上三个接口均在网关白名单内，无需 Authorization

export const getUserLoginUrl = () =>
  `http://${HOST}:${API_GATEWAY_PORT}/user/login`;

export const getUserRegisterUrl = () =>
  `http://${HOST}:${API_GATEWAY_PORT}/user/register`;

export const getUserSendCodeUrl = (email) =>
  `http://${HOST}:${API_GATEWAY_PORT}/user/sendCode?email=${encodeURIComponent(email)}`;

// 登出：DELETE {host}:18080/user/logout（需要 Authorization）
// 对应 com.wjl.friend.controller.user.UserController#logout
export const getUserLogoutUrl = () =>
  `http://${HOST}:${API_GATEWAY_PORT}/user/logout`;

// 上传用户头像
// POST {host}:18080/user/avatar/upload（需要 Authorization，multipart/form-data）
// 表单字段名固定为 avatar；成功后返回 { success: true }
// 注意：后端校验不通过时仍是 code=1000，错误在 data.success=false + data.errMsg
// 对应 com.wjl.friend.controller.user.UserController#avatarUpload
export const getAvatarUploadUrl = () =>
  `http://${HOST}:${API_GATEWAY_PORT}/user/avatar/upload`;

// 头像校验规则 —— 与后端保持一致，改动需同步：
//   CommonConstants.MAX_SIZE    = 2 * 1024 * 1024
//   CommonConstants.ALLOW_MIME  = {"image/jpeg","image/jpg","image/png","image/webp"}
//   尺寸限制（UserService#avatarUpload）：宽高均需在 200 ~ 2000 之间
//   另外 friend 服务 bootstrap.yaml 里 spring.servlet.multipart.max-file-size = 2MB，
//   实测「正好 2MB」也会被网关拦下返回 code=2000，所以前端按 2MB 以内提示。
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
export const AVATAR_ALLOW_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
export const AVATAR_MIN_EDGE = 200;
export const AVATAR_MAX_EDGE = 2000;

// 编辑个人资料：学校 / 专业 / 自我介绍
// POST {host}:18080/user/addInfo（需要 Authorization）
// 参数 UserAddInfoDTO：schoolName / majorName 各 ≤20 字，introduce ≤100 字
// 对应 com.wjl.friend.controller.user.UserController#addInfo
export const getUserAddInfoUrl = () =>
  `http://${HOST}:${API_GATEWAY_PORT}/user/addInfo`;

// 提交信息（通过数 / 总提交数 / 通过率）
// GET {host}:18080/user/submitInfo（需要 Authorization）
// 对应 com.wjl.friend.controller.user.UserController#submitSum
export const getUserSubmitInfoUrl = () =>
  `http://${HOST}:${API_GATEWAY_PORT}/user/submitInfo`;

// 发送验证码冷却时间（秒）——需求：间隔一分钟
// 注意：后端 sendCode 可能对同一邮箱有频控，这里用 60s 作为前端间隔
export const SEND_CODE_COOLDOWN_SEC = 60;

// 判题语言：目前后端仅支持 java
export const LANGUAGES = [
  { value: 'java', label: 'Java', enabled: true },
  { value: 'cpp', label: 'C++', enabled: false },
  { value: 'python', label: 'Python', enabled: false },
];

// 判题状态 → 中文文案（枚举名与后端 JudgeStatus 一致）
export const STATUS_TEXT = {
  ACCEPTED: '通过',
  WRONG_ANSWER: '解答错误',
  COMPILE_ERROR: '编译错误',
  COMPILE_TIMEOUT: '编译超时',
  TIME_LIMIT_EXCEEDED: '运行超时',
  RUNTIME_ERROR: '运行时错误',
  SYSTEM_ERROR: '系统错误',
};

// 提交记录的 pass 字段 → 展示文案与颜色类型
// 对应后端 UserSubmit.pass：0 编译错误 / 1 运行时错误 / 2 超时 / 3 答案错误 / 4 ac
export const PASS_STATUS = {
  0: { text: '编译错误', kind: 'error' },
  1: { text: '运行时错误', kind: 'error' },
  2: { text: '运行超时', kind: 'warning' },
  3: { text: '解答错误', kind: 'error' },
  4: { text: '通过', kind: 'success' },
};

// 提交记录的 programType → 语言名（0-Java，1-C++）
export const PROGRAM_TYPES = { 0: 'Java', 1: 'C++' };

// 提交记录的 programType → Monaco 语言 id（用于代码高亮）
export const PROGRAM_LANG = { 0: 'java', 1: 'cpp' };

// 题目难度 → 文案与颜色类型（1-简单 2-中等 3-困难）
export const DIFFICULTY = {
  1: { text: '简单', kind: 'easy' },
  2: { text: '中等', kind: 'medium' },
  3: { text: '困难', kind: 'hard' },
};
