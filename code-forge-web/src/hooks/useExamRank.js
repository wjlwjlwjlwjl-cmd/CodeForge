import { useEffect, useMemo, useState } from 'react';
import { fetchExamRank } from '../api/exam.js';

// 竞赛排名（实时）
//
// 后端 GET /job/exam/rank?examId= 返回的是「查询这一刻」的名次（Redis ZSET 反排名 + 1），
// 不会推送，所以前端需要自己轮询刷新。
//
// 语义：
//   数字      → 名次（从 1 开始）
//   null      → 暂无排名（该竞赛里还没有任何有效提交）
//   undefined → 还没拿到过结果（首次加载中）
//
// 轮询策略：
//   · 立即拉一次，之后每 pollMs 拉一次
//   · 页面切到后台（切标签/最小化）时暂停，切回前台立刻补一次
export const RANK_POLL_MS = 30_000;

// 多个竞赛一起轮询（个人主页用）；返回 { [examId]: rank }
export function useExamRanks(examIds, { enabled = true, pollMs = RANK_POLL_MS } = {}) {
  // 用字符串做依赖，避免数组每次渲染都是新引用
  const key = useMemo(
    () => (Array.isArray(examIds) ? examIds.map(String).join(',') : ''),
    [examIds]
  );

  const [ranks, setRanks] = useState({});
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    if (!enabled || !ids.length) {
      setRanks({});
      return undefined;
    }

    let cancelled = false;
    let busy = false;

    const run = async () => {
      if (busy || cancelled) return;
      busy = true;
      setLoading(true);
      // 单个竞赛失败不影响其它竞赛
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return [id, await fetchExamRank(id)];
          } catch (e) {
            return [id, null];
          }
        })
      );
      busy = false;
      if (cancelled) return;
      setRanks(Object.fromEntries(results));
      setUpdatedAt(Date.now());
      setLoading(false);
    };

    const timer = window.setInterval(() => {
      // 后台标签不轮询，避免无意义请求
      if (document.visibilityState === 'visible') run();
    }, pollMs);

    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);

    run();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [key, enabled, pollMs]);

  return { ranks, updatedAt, loading };
}

// 单个竞赛（竞赛详情页用）
export function useExamRank(examId, options) {
  const ids = useMemo(() => (examId == null ? [] : [String(examId)]), [examId]);
  const { ranks, updatedAt, loading } = useExamRanks(ids, options);
  return {
    // undefined = 加载中，null = 暂无排名，数字 = 名次
    rank: examId == null ? undefined : ranks[String(examId)],
    updatedAt,
    loading,
  };
}

// 名次文案
export function rankText(rank) {
  if (rank === undefined) return '…';
  if (rank === null) return '暂无排名';
  return `#${rank}`;
}

// 「更新于 21:03:12」
export function rankTimeText(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `更新于 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
