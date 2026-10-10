import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchQuestionList } from '../api/question.js';

// 题库列表：按需分页加载（无限列表）
//   - open 变为 true 时重置并加载第一页
//   - loadMore() 加载下一页，供滚动到底部时调用
//
// 终止判断采用「本页是否满页」而不是后端返回的 total/pages：
//   后端命中 Redis 缓存时 total/pages 会失真（把 total 算成当前页条数），
//   用满页判断可保证无论如何都能把全部题目加载出来。
//   total 仅用于展示，取各次响应中的最大值。
export function useQuestionList(open) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const busyRef = useRef(false);

  const reset = useCallback(() => {
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
    setLoading(true);
    setError(null);

    try {
      const nextPage = pageRef.current + 1;
      const data = await fetchQuestionList(nextPage);
      const list = Array.isArray(data?.list) ? data.list : [];

      // 每页条数：优先用后端返回的 pageSize，兜底用本次条数
      const pageSize =
        Number(data?.pageSize) > 0 ? Number(data.pageSize) : list.length;

      pageRef.current = nextPage;
      setItems((prev) => (nextPage === 1 ? list : prev.concat(list)));

      // 满页 → 可能还有下一页；不满页（或空页）→ 到底了
      const more = list.length > 0 && (pageSize > 0 ? list.length >= pageSize : true);
      hasMoreRef.current = more;
      setHasMore(more);

      // total 取最大值（规避旧缓存返回的失真值）；到达末尾时以实际条数为准
      const loadedCount = (nextPage - 1) * pageSize + list.length;
      setTotal((prev) => {
        let next = prev;
        if (typeof data?.total === 'number' && data.total > 0) {
          next = Math.max(next, data.total);
        }
        if (!more) next = Math.max(next, loadedCount);
        return next;
      });
    } catch (e) {
      setError(e.message || '加载失败');
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, []);

  // 打开题库时重置并加载第一页
  useEffect(() => {
    if (!open) return;
    reset();
    loadMore();
  }, [open, reset, loadMore]);

  return { items, total, loading, error, hasMore, loadMore, reset };
}