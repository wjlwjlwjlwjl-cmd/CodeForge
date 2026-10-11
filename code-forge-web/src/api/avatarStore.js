import { fetchAvatarUrl } from './home.js';

// 用户头像全局存储
//
// 目标：
//   1. 首页加载时「异步」拉取头像，不阻塞页面构建
//   2. 拉取一次后全局复用（顶栏、个人中心等所有展示头像的地方都用它）
//   3. 拿不到头像（后端返回 null / 未签名 / 请求失败）时回退默认头像
//
// 说明：头像是一个 OSS 预签名 URL，带 Expires 过期时间戳，
// 所以缓存时要校验有效期，过期后重新获取。

const STORAGE_KEY = 'cf:avatar';

// 状态：'idle' | 'loading' | 'ready' | 'none'
let state = {
  url: null,
  expiresAt: 0,
  status: 'idle',
};

const listeners = new Set();
// 正在进行的请求，避免并发重复拉取
let inflight = null;

function emit() {
  listeners.forEach((fn) => fn(state));
}

function setState(next) {
  state = { ...state, ...next };
  emit();
}

// 从预签名 url 里解析过期时间（秒级时间戳 → 毫秒）
function parseExpires(url) {
  try {
    const exp = new URL(url).searchParams.get('Expires');
    const sec = Number(exp);
    if (Number.isFinite(sec) && sec > 0) return sec * 1000;
  } catch (e) {
    // 解析失败视为无过期信息
  }
  return 0;
}

// 是否仍可用（有 url 且未过期）
function isUsable(entry) {
  if (!entry?.url) return false;
  if (!entry.expiresAt) return true;
  // 提前 30 秒判定过期，避免边界情况
  return entry.expiresAt - 30_000 > Date.now();
}

// 从 sessionStorage 恢复（同一标签页内跨页面复用，避免重复请求）
function restore() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isUsable(parsed)) return parsed;
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // 忽略
  }
  return null;
}

function persist(entry) {
  try {
    if (entry?.url) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    // 忽略
  }
}

// 初始化：先用本地缓存（若有且未过期）
const restored = restore();
if (restored) {
  state = { url: restored.url, expiresAt: restored.expiresAt, status: 'ready' };
}

// 拉取头像 url（去重，并发调用只会发一次请求）
export function ensureAvatar({ force = false } = {}) {
  if (!force && isUsable(state)) {
    if (state.status !== 'ready') setState({ status: 'ready' });
    return Promise.resolve(state.url);
  }
  if (inflight) return inflight;

  if (state.status !== 'loading') setState({ status: 'loading' });

  inflight = (async () => {
    try {
      // GET /user/avatar → 预签名 url；未设置头像时后端返回 data:null
      const url = await fetchAvatarUrl();

      if (typeof url !== 'string' || !url) {
        // 未设置头像 / 未签名 → 用默认头像
        setState({ url: null, expiresAt: 0, status: 'none' });
        persist(null);
        return null;
      }

      const expiresAt = parseExpires(url);
      const entry = { url, expiresAt };
      persist(entry);
      setState({ url, expiresAt, status: 'ready' });
      return url;
    } catch (e) {
      // 未登录 / 网络异常 / 后端未签名：统一回退默认头像
      setState({ url: null, expiresAt: 0, status: 'none' });
      persist(null);
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

// 读取当前可用的头像 url（不可用返回 null）
export function getAvatarUrl() {
  return isUsable(state) ? state.url : null;
}

export function getAvatarState() {
  return state;
}

export function subscribeAvatar(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// 退出登录时清空
export function clearAvatar() {
  state = { url: null, expiresAt: 0, status: 'idle' };
  persist(null);
  emit();
}
