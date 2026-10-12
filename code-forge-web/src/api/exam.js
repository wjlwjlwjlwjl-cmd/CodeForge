import { authHeaders, SUCCESS_CODE, HOST, API_GATEWAY_PORT } from '../config.js';

// 竞赛相关接口（code-forge-system / ExamController）

async function getJson(url) {
  let res;
  try {
    res = await fetch(url, { method: 'GET', headers: authHeaders() });
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

// 获取所有竞赛（分页）
// GET /exam/list?pageNum=
// 返回 { total, pages, pageNum, pageSize, list: [{ examId, title, startTime, endTime, status }] }
export async function fetchExamList(pageNum = 1) {
  return getJson(`${base()}/exam/list?pageNum=${pageNum}`);
}

// 按时间状态获取竞赛（分页）
// GET /user/exam/list/queue?option=&pageNum=
//   option: 0-未开始  1-开始但未结束  2-已结束
// 返回 { pageSize, pageNum, list: [{ examId, title, startTime, endTime, status }] }
//
// 注意两点（来自后端实现 UserExamService#getExamListSortByTime）：
//   1. pageNum 必须从 1 开始：内部取 LRANGE pageSize*(pageNum-1) .. pageSize*pageNum-1，
//      传 0 会算出负下标，拿到的是「最后 10 条」而不是第一页
//   2. total 字段后端没有返回（response 里没有该键），分页只能按「本页是否满页」判断
export async function fetchExamQueue(option, pageNum = 1) {
  return getJson(
    `${base()}/user/exam/list/queue?option=${option}&pageNum=${pageNum}`
  );
}

// 我的竞赛（已报名）：GET /user/exam/list/mine?pageNum=
// 返回 BasePageVO<UserExamVO>：
//   { total, pages, pageNum, pageSize, list: [{ userId, examId, score, examRank }] }
// 注意：
//   1. 没有任何报名记录时后端直接返回 data: null
//   2. list 里只有一个 id / 分数 / 名次，没有标题和时间，需要另行用 /exam/detail 补
//   3. 后端缓存用的是 list 追加语义，历史脏数据可能造成重复行，这里按 examId 去重
export async function fetchMyExams() {
  const data = await getJson(`${base()}/user/exam/list/mine?pageNum=1`);
  const list = Array.isArray(data?.list) ? data.list : [];
  const seen = new Set();
  const rows = [];
  for (const row of list) {
    const key = String(row?.examId);
    if (!row || seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }
  return rows;
}

// 竞赛详情：GET /exam/detail?examId=  → ExamVO { examId, title, startTime, endTime, status }
export async function fetchExamDetail(examId) {
  return getJson(`${base()}/exam/detail?examId=${examId}`);
}

// 获取某竞赛的全部题目（分页）
// GET /exam/listQuestion?examId=&pageNum=
// 返回 { total, pages, pageNum, pageSize, list: [{ id, title, difficulty, timeLimit, spaceLimit }] }
export async function fetchExamQuestions(examId, pageNum = 1) {
  return getJson(
    `${base()}/exam/listQuestion?examId=${examId}&pageNum=${pageNum}`
  );
}
