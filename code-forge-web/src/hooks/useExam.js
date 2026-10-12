import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchExamList,
  fetchExamQueue,
  fetchExamDetail,
  fetchExamQuestions,
} from '../api/exam.js';
import { handleApiError } from '../config.js';
import { useMyExams } from './useMyExams.js';

const NOOP = () => {};

// 通用「分页 + 无限滚动」列表
//   fetchPage(pageNum) => Promise<{ list, pageSize?, total? }>
//   enabled 为 false 时不请求（例如尚未选中竞赛）
// 终止判断用「本页是否满页」，不依赖后端的 total/pages。
// keyOf: 取业务主键用于去重（后端缓存为追加语义时可能返回重复项）
function useInfinite(fetchPage, enabled = true, keyOf = null) {
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
      setItems((prev) => {
        const base = nextPage === 1 ? [] : prev;
        if (!keyOf) return base.concat(list);
        // 去重，避免重复行与 React key 冲突
        const seen = new Set();
        const merged = [];
        for (const item of base.concat(list)) {
          const k = String(keyOf(item));
          if (seen.has(k)) continue;
          seen.add(k);
          merged.push(item);
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

// 分类 → /user/exam/list/queue 的 option
//   0-未开始  1-开始但未结束（进行中）  2-已结束
export const EXAM_TIME_OPTION = {
  unstart: 0,
  unfinish: 1,
  finished: 2,
};

// 竞赛列表（分类 + 分页 + 无限滚动）
//   tab: 'unfinish' | 'unstart' | 'finished' → /user/exam/list/queue
//        'all'                              → /exam/list
//        'mine'                             → 不走这里（见 useMyExamList）
// 切换分类时 fetchPage 变化会自动重置并拉第一页。
export function useExamListByTab(tab) {
  const isAll = tab === 'all';
  const option = EXAM_TIME_OPTION[tab];
  const enabled = Boolean(tab) && tab !== 'mine';

  const fetchPage = useCallback(
    (pageNum) =>
      isAll ? fetchExamList(pageNum) : fetchExamQueue(option, pageNum),
    [isAll, option]
  );

  return useInfinite(fetchPage, enabled, (e) => e.examId);
}

// 我的竞赛：/user/exam/list/mine 只给 examId / 分数 / 名次，
// 这里再逐个 /exam/detail 把标题与时间补齐，拼成和别的分类一样的行数据。
// 返回结构与 useInfinite 对齐（hasMore 恒为 false），方便列表统一渲染。
export function useMyExamList(enabled = true) {
  const { ids, loading: idsLoading, error: idsError, loaded } = useMyExams({
    load: enabled,
  });
  const [items, setItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ids 变化（报名成功 / 重新加载）时重新取详情
  const idKey = ids.join(',');

  useEffect(() => {
    if (!enabled || !loaded) return undefined;
    if (!ids.length) {
      setItems([]);
      return undefined;
    }

    let cancelled = false;
    setDetailLoading(true);

    Promise.all(
      ids.map((id) =>
        fetchExamDetail(id).catch(() => null) // 单个失败不影响其它
      )
    )
      .then((list) => {
        if (cancelled) return;
        setItems(list.filter(Boolean));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, loaded, idKey]);

  return {
    items,
    total: items.length,
    loading: idsLoading || detailLoading,
    error: idsError,
    hasMore: false,
    loadMore: NOOP,
  };
}

// 某个竞赛的题目列表（examId 为空时不请求）
export function useExamQuestions(examId) {
  const enabled = examId != null;
  const fetchPage = useCallback(
    (pageNum) => fetchExamQuestions(examId, pageNum),
    [examId]
  );
  return useInfinite(fetchPage, enabled, (q) => q.id);
}
