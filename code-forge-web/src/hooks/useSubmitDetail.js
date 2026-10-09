import { useCallback, useEffect, useState } from 'react';
import { fetchSubmitDetail } from '../api/history.js';

// 获取单条提交详情
// 返回 { data, loading, error, reload }
//   data = { pass, createTime, programType, runTime, title, userCode }
export function useSubmitDetail(submitId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    if (submitId == null) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSubmitDetail(submitId)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || '加载失败');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [submitId, reloadFlag]);

  const reload = useCallback(() => setReloadFlag((f) => f + 1), []);

  return { data, loading, error, reload };
}