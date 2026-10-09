import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchQuestionDetail,
  fetchNextQuestion,
  fetchPrevQuestion,
} from '../api/question.js';

// 拉取题目详情 + 上一题/下一题切换
//
// 返回值：
//   { data, loading, error, notice, clearNotice, retry, switching, goPrev, goNext }
//
// 设计：
//   - 传入的 id 是「当前题目 id」，变化时自动拉取 detail
//   - goPrev/goNext 调用后端 prev/next 接口，成功后通过 onSwitch(newId) 通知外部
//     更新 currentId；并用 ref 记录「刚由切换接口填充的 id」，
//     下一次因 id 变化触发的 effect 会跳过重复请求，直接复用已返回的详情。
//   - error 表示真正的加载/请求失败；notice 表示边界提示（如已是最后一题）
export function useQuestion(id, { onSwitch } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [switching, setSwitching] = useState(false);

  // 记录「详情已由切换接口填充、无需再请求」的 id
  const filledBySwitchRef = useRef(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // 该 id 的详情已由切换接口填充，跳过重复请求
    if (
      filledBySwitchRef.current != null &&
      String(filledBySwitchRef.current) === String(id)
    ) {
      filledBySwitchRef.current = null;
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

  const retry = useCallback(() => {
    if (!id) return;
    filledBySwitchRef.current = null;
    setLoading(true);
    setError(null);
    fetchQuestionDetail(id)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || '加载失败');
        setLoading(false);
      });
  }, [id]);

  const clearNotice = useCallback(() => setNotice(null), []);

  const go = useCallback(
    async (direction) => {
      const currentId = data?.id ?? id;
      if (!currentId || switching) return;

      setSwitching(true);
      setError(null);
      setNotice(null);
      try {
        const res =
          direction === 'prev'
            ? await fetchPrevQuestion(currentId)
            : await fetchNextQuestion(currentId);

        // 到达边界：友好提示，不算错误
        if (res?.boundary) {
          setNotice(
            res.boundary === 'first'
              ? '已经是第一道题目了'
              : '已经是最后一道题目了'
          );
          return;
        }

        const next = res?.data;
        if (!next || next.id == null) {
          setNotice('没有更多题目了');
          return;
        }

        // 先记录已填充 id，再填充数据并通知外部切换 currentId
        filledBySwitchRef.current = next.id;
        setData(next);
        onSwitch?.(next.id);
      } catch (e) {
        setError(e.message || '切换题目失败');
      } finally {
        setSwitching(false);
      }
    },
    [data, id, switching, onSwitch]
  );

  const goPrev = useCallback(() => go('prev'), [go]);
  const goNext = useCallback(() => go('next'), [go]);

  return {
    data,
    loading,
    error,
    notice,
    clearNotice,
    retry,
    switching,
    goPrev,
    goNext,
  };
}
