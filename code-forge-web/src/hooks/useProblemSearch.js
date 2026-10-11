import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchQuestionList, searchProblems } from '../api/question.js';
import { handleApiError } from '../config.js';

// 快速刷题列表：分页 + 无限滚动（与代码编辑页「题库」抽屉同一套分页逻辑）
//
// 数据来源：
//   - keyword 为空 → GET /question/list          （等价于整个题库，即题库抽屉的方式）
//   - keyword 非空 → GET /question/search/filter （ES 关键字搜索，可带 difficulty）
//
// 终止判断用「本页是否满页」而不是后端的 total/pages
// （题库列表接口命中 Redis 缓存时 total/pages 会失真）。
//
// 关于难度筛选：
//   difficulty 是 /question/search/filter 的可选参数（1 简单 / 2 中等 / 3 困难）。
//   两种退化场景改用「客户端筛选」：
//     a) 只选难度、没有关键字 —— 该接口 keyword 为 @NotBlank，无法只按难度查；
//     b) 后端旧版本把 difficulty 校验成 0~2，传 3 会返回「参数校验失败」，
//        此时退化为不带难度搜索后在本地筛选，保证功能可用。
const MAX_SCAN_PAGES = 30; // 客户端筛选时最多向后扫描的页数，避免极端情况下空转

// 搜索：必要时退化为「不带 difficulty + 本地筛选」
async function searchWithFallback(keyword, difficulty, pageNum) {
  try {
    const data = await searchProblems(keyword, { difficulty, pageNum });
    return { data, clientFilter: false };
  } catch (e) {
    if (difficulty == null) throw e;
    // 后端因 difficulty 参数校验失败 → 去掉难度重试，改由前端筛选
    const data = await searchProblems(keyword, { difficulty: null, pageNum });
    return { data, clientFilter: true };
  }
}

export function useProblemSearch({ keyword = '', difficulty = null } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const busyRef = useRef(false);
  // 用于丢弃过期请求（快速改关键字/难度时的旧响应）
  const tokenRef = useRef(0);

  const reset = useCallback(() => {
    tokenRef.current += 1;
    pageRef.current = 0;
    hasMoreRef.current = true;
    busyRef.current = false;
    setItems([]);
    setTotal(0);
    setLoading(false);
    setError(null);
    setHasMore(true);
  }, []);

  const loadMore = useCallback(async () => {
    if (busyRef.current || !hasMoreRef.current) return;
    busyRef.current = true;
    const myToken = tokenRef.current;
    setLoading(true);
    setError(null);

    const kw = keyword.trim();
    const isSearch = kw.length > 0;
    // 无关键字 + 选了难度 → 必须在本地筛选（接口不支持只按难度查）
    let filterLocally = !isSearch && difficulty != null;

    try {
      let collected = [];
      let pageSize = 10;
      let sawFullPage = false;
      let serverTotal = 0;
      let page = pageRef.current;

      // 循环：本地筛选时可能需要连翻多页才凑够一页结果
      for (let scan = 0; scan < MAX_SCAN_PAGES; scan += 1) {
        page += 1;

        let data;
        if (isSearch) {
          const res = await searchWithFallback(kw, difficulty, page);
          data = res.data;
          filterLocally = filterLocally || res.clientFilter;
        } else {
          data = await fetchQuestionList(page);
        }

        if (myToken !== tokenRef.current) return; // 已被重置，丢弃本次结果

        const list = Array.isArray(data?.list) ? data.list : [];
        pageSize = Number(data?.pageSize) > 0 ? Number(data.pageSize) : list.length || 10;
        if (typeof data?.total === 'number' && data.total > 0) {
          serverTotal = Math.max(serverTotal, data.total);
        }

        sawFullPage = list.length > 0 && list.length >= pageSize;

        const picked = filterLocally
          ? list.filter((q) => Number(q.difficulty) === Number(difficulty))
          : list;

        collected = collected.concat(picked);

        // 攒够一页 或 后面没数据了 → 停止本次加载
        if (!sawFullPage || collected.length >= pageSize) break;
      }

      pageRef.current = page;

      setItems((prev) => {
        const base = page === 1 ? [] : prev;
        // 去重（本地筛选跨页时可能出现重复）
        const seen = new Set();
        const merged = [];
        for (const q of base.concat(collected)) {
          const key = String(q?.id);
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(q);
        }
        return merged;
      });

      // 还有下一页？
      //   后端分页筛选：看是否满页
      //   本地筛选：只要后端还有数据就继续翻（用扫描上限兜底）
      const more = sawFullPage && (!filterLocally || page < MAX_SCAN_PAGES);
      hasMoreRef.current = more;
      setHasMore(more);

      setTotal((prev) => {
        let next = Math.max(prev, serverTotal);
        if (!more) next = Math.max(next, (page - 1) * pageSize + collected.length);
        return next;
      });
    } catch (e) {
      const msg = handleApiError(e, '加载失败');
      if (msg !== null) setError(msg);
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      busyRef.current = false;
      if (myToken === tokenRef.current) setLoading(false);
    }
  }, [keyword, difficulty]);

  // 关键字 / 难度变化时重置并加载第一页
  useEffect(() => {
    reset();
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, difficulty]);

  return { items, total, loading, error, hasMore, loadMore, reset };
}
