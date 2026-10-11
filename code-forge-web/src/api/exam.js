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

// 获取某竞赛的全部题目（分页）
// GET /exam/listQuestion?examId=&pageNum=
// 返回 { total, pages, pageNum, pageSize, list: [{ id, title, difficulty, timeLimit, spaceLimit }] }
export async function fetchExamQuestions(examId, pageNum = 1) {
  return getJson(
    `${base()}/exam/listQuestion?examId=${examId}&pageNum=${pageNum}`
  );
}
