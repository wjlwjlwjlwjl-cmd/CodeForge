import { fetchMyExams } from './exam.js';

// 「我的竞赛」（已报名）全局存储
//
// 数据来源：GET /user/exam/list/mine（不再往 localStorage 里存报名记录）
//   报名成功后后端会维护 user:{id}:exam 这份缓存（signUp 里有 leftPush），
//   所以重新拉一次就能拿到最新的已报名列表。
//
// 只是「请求去重 + 全局共享」，不做任何持久化：
// 应用重新加载后会重新请求一次。
//
// 状态：
//   loading  首次拉取中
//   loaded   至少成功拉取过一次
//   ids      已报名的 examId（字符串，去重后）
//   rows     原始行（含 score / examRank，可用于后续展示分数与排名）
//   error    拉取失败时的提示

const EMPTY = [];

let state = {
  ids: EMPTY,
  rows: EMPTY,
  loading: false,
  loaded: false,
  error: null,
};

const listeners = new Set();
let inflight = null;

function emit() {
  listeners.forEach((fn) => fn(state));
}

function setState(next) {
  state = { ...state, ...next };
  emit();
}

function toIds(rows) {
  return rows.map((r) => String(r.examId));
}

// 拉取我的竞赛；并发调用只会发一次请求
export function ensureMyExams({ force = false } = {}) {
  if (!force && state.loaded && !state.error) return Promise.resolve(state.rows);
  if (inflight) return inflight;

  setState({ loading: true, error: null });

  inflight = fetchMyExams()
    .then((rows) => {
      setState({
        ids: toIds(rows),
        rows,
        loaded: true,
        loading: false,
        error: null,
      });
      return rows;
    })
    .catch((e) => {
      // 拿不到就当作「没有已报名」，不影响浏览
      setState({
        loading: false,
        loaded: true,
        error: e?.message || '加载失败',
        ids: EMPTY,
        rows: EMPTY,
      });
      return EMPTY;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

// 报名成功后就地补一条，立刻把按钮切到「已报名」，
// 再往后端同步一次（避免后端缓存写入的时序问题）
export function markMyExamSigned(examId) {
  const key = String(examId);
  if (state.ids.includes(key)) {
    ensureMyExams({ force: true });
    return;
  }
  setState({
    ids: [key, ...state.ids],
    rows: [{ examId: Number(examId) }, ...state.rows],
  });
  ensureMyExams({ force: true });
}

export function getMyExamState() {
  return state;
}

export function subscribeMyExams(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// 退出登录时清空（记录是按用户来的）
export function clearMyExams() {
  state = {
    ids: EMPTY,
    rows: EMPTY,
    loading: false,
    loaded: false,
    error: null,
  };
  inflight = null;
  emit();
}
