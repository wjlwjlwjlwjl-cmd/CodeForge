import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchExamList, fetchExamQuestions } from '../api/exam.js';
import { handleApiError } from '../config.js';

// 通用「分页 + 无限滚动」列表
//   fetchPage(pageNum) => Promise<{ list, pageSize?, total? }>
//   enabled 为 false 时不请求（例如尚未选中竞赛）
// 终止判断用「本页是否满页」，不依赖后端的 total/pages。
function useInfinite(fetchPage, enabled = true) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const pageRef = useRef(0);
  const hasMoreRef = useRef(false);
  const busyRef = useRef(false);
  const tokenRef = useRef(0);

  const reset = useCallback(() => {
    tokenRef.current += 1;
    pageRef.current = 0;
    hasMoreRef.current = false;
    busyRef.current = false;
    setItems([]);
    setTotal(0);
    setError(null);
    setHasMore(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (!enabled || busyRef.current || !hasMoreRef.current) return;
    busyRef.current = true;
    const myToken = tokenRef.current;
    setLoading(true);
    setError(null);

    try {
      const nextPage = pageRef.current + 1;
      const data = await fetchPage(nextPage);
      if (myToken !== tokenRef.current) return; // 已重置，丢弃

      const list = Array.isArray(data?.list) ? data.list : [];
      const pageSize =
        Number(data?.pageSize) > 0 ? Number(data.pageSize) : list.length || 10;

      pageRef.current = nextPage;
      setItems((prev) => (nextPage === 1 ? list : prev.concat(list)));

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
      if (msg !== null) {
        // 已经加载出内容时，后续页失败通常是「翻过了最后一页」
        // （该后端对越界页返回 2000 服务繁忙请稍后重试），
        // 按「没有更多」处理，不要打断已有内容的展示；
        // 只有第一页就失败才提示错误。
        setError(pageRef.current >= 1 ? null : msg);
      }
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      busyRef.current = false;
      if (myToken === tokenRef.current) setLoading(false);
    }
  }, [enabled, fetchPage]);

  // fetchPage 变化（如切换竞赛）→ 重置并加载第一页。
  // 置 hasMore=true 让首次 loadMore 能通过守卫。
  useEffect(() => {
    reset();
    if (!enabled) return;
    hasMoreRef.current = true;
    setHasMore(true);
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchPage]);

  return { items, total, loading, error, hasMore, loadMore, reset };
}

// 竞赛列表
export function useExamList() {
  const fetchPage = useCallback((pageNum) => fetchExamList(pageNum), []);
  return useInfinite(fetchPage, true);
}

// 某个竞赛的题目列表（examId 为空时不请求）
export function useExamQuestions(examId) {
  const enabled = examId != null;
  const fetchPage = useCallback(
    (pageNum) => fetchExamQuestions(examId, pageNum),
    [examId]
  );
  return useInfinite(fetchPage, enabled);
}
