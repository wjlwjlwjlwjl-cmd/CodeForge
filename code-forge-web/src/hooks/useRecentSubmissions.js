import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRecentSubmissions } from '../api/home.js';
import { handleApiError } from '../config.js';

// 最近提交：分页 + 无限滚动（拖动到底部自动加载下一页）
// 接口：GET /job/user/history?pageNum=
//   返回 { has, total, pages, pageNum, pageSize, list: SubmitVO[] }
//   SubmitVO = { submitId, questionId, pass, programType, runTime, title, createTime }
//
// 终止判断同样用「本页是否满页」，不依赖后端的 total/pages。
export function useRecentSubmissions() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const busyRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (busyRef.current || !hasMoreRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const nextPage = pageRef.current + 1;
      const data = await fetchRecentSubmissions({ pageNum: nextPage });
      const list = Array.isArray(data?.list) ? data.list : [];

      const pageSize =
        Number(data?.pageSize) > 0 ? Number(data.pageSize) : list.length || 10;

      pageRef.current = nextPage;
      setItems((prev) => {
        const base = nextPage === 1 ? [] : prev;
        const seen = new Set();
        const merged = [];
        for (const s of base.concat(list)) {
          const key = String(s?.submitId);
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(s);
        }
        return merged;
      });

      const more = list.length > 0 && list.length >= pageSize;
      hasMoreRef.current = more;
      setHasMore(more);

      setTotal((prev) => {
        let next = prev;
        if (typeof data?.total === 'number' && data.total > 0) {
          next = Math.max(next, data.total);
        }
        if (!more) next = Math.max(next, (nextPage - 1) * pageSize + list.length);
        return next;
      });
    } catch (e) {
      const msg = handleApiError(e, '加载失败');
      if (msg !== null) setError(msg);
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  return { items, total, loading, error, hasMore, loadMore };
}
