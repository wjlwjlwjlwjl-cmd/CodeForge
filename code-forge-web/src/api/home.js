import { authHeaders, SUCCESS_CODE, HOST, API_GATEWAY_PORT, getUserSubmitInfoUrl } from '../config.js';

// ---------------- 首页相关接口 ----------------
// 统一解析后端 R<T> 包裹 { code, msg, data }

async function getJson(url, { auth = true } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: auth ? authHeaders() : undefined,
    });
  } catch (e) {
    throw new Error('网络异常，请检查服务是否可用');
  }

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error(`接口返回非 JSON（HTTP ${res.status}）`);
  }

  if (json?.code !== SUCCESS_CODE) {
    const err = new Error(json?.msg || `业务错误（code=${json?.code}）`);
    err.code = json?.code;
    throw err;
  }
  return json.data;
}

const base = () => `http://${HOST}:${API_GATEWAY_PORT}`;

// 获取 C 端用户信息
// GET /user/detail  →  { nickName, sex, email, avatarName, schoolName, majorName, introduce }
export async function fetchUserInfo() {
  return getJson(`${base()}/user/detail`);
}

// 提交信息：通过数 / 总提交数 / 通过率
// GET /user/submitInfo → { submitSum, passSum, passRate }
//   注意：后端 passRate 是「比值」字符串（如 "0.20" 表示 20%）
export async function fetchSubmitInfo() {
  return getJson(getUserSubmitInfoUrl());
}

// 获取头像预签名 url
// GET /user/avatar → string（预签名下载地址）
export async function fetchAvatarUrl() {
  return getJson(`${base()}/user/avatar`);
}

// 根据竞赛状态获取竞赛列表
// GET /user/exam/list/queue?pageNum=&option=
//   option：0-未开始 1-进行中 2-已结束
// 注意：该接口在网关侧需要鉴权（无 Authorization 会 401）
// 返回 ExamListVO = { pageNum, pageSize, list: [{ examId, title, startTime, endTime, status }] }
// 注意 pageNum 必须从 1 开始：后端内部按 LRANGE pageSize*(pageNum-1) .. -1 取，
// 传 0 会取到「最后 10 条」而不是第一页
export async function fetchOngoingContests({ option = 1, pageNum = 1 } = {}) {
  return getJson(`${base()}/user/exam/list/queue?pageNum=${pageNum}&option=${option}`);
}

// 用户提交记录（全部题目，分页）
// GET /job/user/history?pageNum=
// 返回 { has, total, pages, pageNum, pageSize, list: SubmitVO[] }
export async function fetchRecentSubmissions({ pageNum = 1 } = {}) {
  return getJson(`${base()}/job/user/history?pageNum=${pageNum}`);
}

// 报名竞赛
// POST /user/exam/signUp?examId=
//
// 注意：本接口成功时后端用的是「无参」R.success()，字段全是 null：
//   { code: null, msg: null, data: null }   —— code 并不是 1000
// 失败时才由全局异常处理返回带错误码与错误信息的 R（如 3301 已报名）。
// 因此这里不能用 `code !== 1000` 判失败，否则会把成功误判成失败。
// 判定规则：只要没有错误码、也没有错误信息，就视为报名成功。
export async function signUpContest(examId) {
  const res = await fetch(`${base()}/user/exam/signUp?examId=${examId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    // 成功时 body 可能为空
  }

  const code = json?.code;
  const msg = typeof json?.msg === 'string' ? json.msg.trim() : '';
  // 有非成功错误码，或有错误信息（R.success(data) 的 msg 固定为 "success"，不算错误）
  const hasError =
    (code != null && code !== SUCCESS_CODE) || (msg !== '' && msg !== 'success');

  if (hasError) {
    const err = new Error(msg || `报名失败（code=${code}）`);
    err.code = code; // 3301 = 已经报过名
    throw err;
  }
  return true;
}
