import {
  TOKEN,
  SUCCESS_CODE,
  FIRST_QUESTION_CODE,
  LAST_QUESTION_CODE,
  getQuestionDetailUrl,
  getQuestionNextUrl,
  getQuestionPrevUrl,
  getQuestionListUrl,
} from '../config.js';

// 通用请求：题目详情类接口（detail / next / prev）
// 返回 { data, code }
async function requestQuestion(url) {
  const res = await fetch(url, {
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

  return { code: json?.code, data: json?.data, msg: json?.msg };
}

// 获取题目详情
// GET {host}:18080/question/detail?id={id}
//   QuestionDetailVO = { id, title, difficulty, timeLimit, spaceLimit,
//                        content, questionCase, defaultCode, mainFuc }
export async function fetchQuestionDetail(id) {
  const { code, data, msg } = await requestQuestion(getQuestionDetailUrl(id));
  if (code !== SUCCESS_CODE) {
    throw new Error(msg || `业务错误（code=${code}）`);
  }
  return data;
}

// 获取下一道题目
// GET {host}:18080/question/next?id={id}
// 到达最后一题时后端返回 code=3502，这里返回 { boundary: 'last' }
export async function fetchNextQuestion(id) {
  const { code, data, msg } = await requestQuestion(getQuestionNextUrl(id));
  if (code === LAST_QUESTION_CODE) return { boundary: 'last' };
  if (code !== SUCCESS_CODE) throw new Error(msg || `业务错误（code=${code}）`);
  if (!data || data.id == null) return { boundary: 'last' };
  return { data };
}

// 获取上一道题目
// GET {host}:18080/question/prev?id={id}
// 到达第一题时后端返回 code=3501，这里返回 { boundary: 'first' }
export async function fetchPrevQuestion(id) {
  const { code, data, msg } = await requestQuestion(getQuestionPrevUrl(id));
  if (code === FIRST_QUESTION_CODE) return { boundary: 'first' };
  if (code !== SUCCESS_CODE) throw new Error(msg || `业务错误（code=${code}）`);
  if (!data || data.id == null) return { boundary: 'first' };
  return { data };
}

// 获取题目列表（分页）
// GET {host}:18080/question/list?pageNum={n}
// 返回 { total, pages, pageNum, pageSize, list }
export async function fetchQuestionList(pageNum = 1) {
  const { code, data, msg } = await requestQuestion(getQuestionListUrl(pageNum));
  if (code !== SUCCESS_CODE) throw new Error(msg || `业务错误（code=${code}）`);
  return data;
}
