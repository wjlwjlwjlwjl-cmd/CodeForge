import { authHeaders, getSubmitUrl, isSuccessResponse } from '../config.js';

// 提交判题
// POST {host}:18080/job/java/submit
// 请求体 SubmitInfoDTO = { questionId, examId, userCode }
// 需要 Authorization 请求头（JobController @RequestHeader）
//
// 成功时后端走的是无参 R.success()，响应是全 null 的空对象；
// 失败（题目不存在 3003 / 未授权 3001 / 服务繁忙 2000 等）虽然 HTTP 仍是 200，
// 但会带上错误码，必须判定出来 —— 否则界面会一直停在「正在判题…」。
export async function submitJudge({ questionId, examId = null, userCode }) {
  const res = await fetch(getSubmitUrl(), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      questionId,
      examId,
      userCode,
    }),
  });

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    // 提交接口成功时返回 R.success()，body 可能为空，忽略解析失败
  }

  if (!res.ok) {
    const err = new Error(json?.msg || `提交失败（HTTP ${res.status}）`);
    err.code = json?.code || res.status;
    throw err;
  }

  if (!isSuccessResponse(json)) {
    const err = new Error(json?.msg || `提交失败（code=${json?.code}）`);
    err.code = json?.code;
    throw err;
  }

  return json;
}
