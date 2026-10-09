import { useCallback, useEffect, useState } from 'react';
import { fetchQuestionDetail } from '../api/question.js';

// 拉取题目详情
// 返回 { data, loading, error, retry }
export function useQuestion(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchQuestionDetail(id)
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
  }, [id]);

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, [load]);

  return { data, loading, error, retry: load };
}
