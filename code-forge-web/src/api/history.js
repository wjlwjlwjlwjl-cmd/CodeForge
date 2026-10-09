import { TOKEN, SUCCESS_CODE, getSubmitHistoryUrl, getSubmitDetailUrl } from '../config.js';

// 获取某道题的提交记录（分页）
// GET {host}:18080/job/ques/history?questionId={id}&pageNum={n}
// 返回统一包裹 { code, msg, data: { has, total, pages, pageNum, pageSize, list } }
//   list 每项 SubmitVO = { submitId, pass, programType, runTime, title, createTime }
export async function fetchSubmitHistory(questionId, pageNum = 1) {
  const res = await fetch(getSubmitHistoryUrl(questionId, pageNum), {
    method: 'GET',
    headers: {
      Authorization: TOKEN,
    },
  });

  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error(`接口返回非 JSON（HTTP ${res.status}）`);
  }

  if (!res.ok) {
    throw new Error(json?.msg || `请求失败（HTTP ${res.status}）`);
  }

  if (json.code !== SUCCESS_CODE) {
    throw new Error(json?.msg || json?.message || `业务错误（code=${json.code}）`);
  }

  return json.data;
}

// 获取单条提交详情
// GET {host}:18080/job/submit/detail?submitId={id}
// 返回统一包裹 { code, msg, data: { pass, createTime, programType, runTime, title, userCode } }
export async function fetchSubmitDetail(submitId) {
  const res = await fetch(getSubmitDetailUrl(submitId), {
    method: 'GET',
    headers: {
      Authorization: TOKEN,
    },
  });

  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error(`接口返回非 JSON（HTTP ${res.status}）`);
  }

  if (!res.ok) {
    throw new Error(json?.msg || `请求失败（HTTP ${res.status}）`);
  }

  if (json.code !== SUCCESS_CODE) {
    throw new Error(json?.msg || json?.message || `业务错误（code=${json.code}）`);
  }

  return json.data;
}