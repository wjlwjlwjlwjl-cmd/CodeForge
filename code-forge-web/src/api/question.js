import { TOKEN, SUCCESS_CODE, getQuestionDetailUrl } from '../config.js';

// 获取题目详情
// GET {host}:18080/question/detail?id={id}
// 返回统一包裹 { code, msg, data: QuestionDetailVO }
//   QuestionDetailVO = { id, title, difficulty, timeLimit, spaceLimit,
//                        content, questionCase, defaultCode, mainFuc }
export async function fetchQuestionDetail(id) {
  const res = await fetch(getQuestionDetailUrl(id), {
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
