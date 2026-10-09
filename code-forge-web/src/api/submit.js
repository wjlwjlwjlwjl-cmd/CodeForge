import { TOKEN, getSubmitUrl } from '../config.js';

// 提交判题
// POST {host}:18080/job/java/submit
// 请求体 SubmitInfoDTO = { questionId, examId, userCode }
// 需要 Authorization 请求头（JobController @RequestHeader）
export async function submitJudge({ questionId, examId = null, userCode }) {
  const res = await fetch(getSubmitUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: TOKEN,
    },
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
    throw new Error(json?.msg || `提交失败（HTTP ${res.status}）`);
  }

  return json;
}
