import { useCallback, useEffect, useState } from 'react';
import { fetchSubmitHistory } from '../api/history.js';

// 每页条数（后端 CommonConstants.PAGE_SIZE）
const PAGE_SIZE = 10;
// 安全上限，避免异常情况下无限翻页
const MAX_PAGES = 30;

// 拉取某道题的全部提交记录
//   - active 为 true 时才请求（切到「提交记录」标签时才拉）
//   - active 每次变为 true 都会重新拉取，保证提交后切回来是最新的
// 返回 { list, total, loading, error, reload }
export function useSubmitHistory(questionId, active) {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    if (!active || questionId == null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const first = await fetchSubmitHistory(questionId, 1);
        let acc = Array.isArray(first?.list) ? first.list : [];
        const pages = Math.min(first?.pages || 1, MAX_PAGES);

        // 依次拉取剩余页（后端按 createTime 倒序，拼起来仍是倒序）
        for (let p = 2; p <= pages; p++) {
          if (cancelled) return;
          const next = await fetchSubmitHistory(questionId, p);
          if (Array.isArray(next?.list) && next.list.length) {
            acc = acc.concat(next.list);
          }
        }

        if (!cancelled) {
          setList(acc);
          setTotal(first?.total != null ? first.total : acc.length);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || '加载失败');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [questionId, active, reloadFlag]);

  const reload = useCallback(() => setReloadFlag((f) => f + 1), []);

  return { list, total, loading, error, reload, pageSize: PAGE_SIZE };
}