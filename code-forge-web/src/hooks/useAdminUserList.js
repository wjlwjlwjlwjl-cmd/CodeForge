import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchUserList } from '../api/admin.js';

// B 端「用户管理」列表：一页一页向后端要，供「区内无限滚动」使用
//
//   后端 GET /user/b/list?pageNum=&nickName=&userId=
//        → UserListVO extends BasePageVO<UserVO>
//          { total, pages, pageNum, pageSize, list: UserVO[] }
//   每页条数由后端 CommonConstants.PAGE_SIZE 决定（10），前端不传 pageSize。
//
// 终止条件直接用后端返回的 pages：
//   这里后端是普通的 PageHelper 分页（selectCount 真查了一次），不像题库那套
//   Redis 缓存会出现 total/pages 失真，所以 pages 可信；真拿不到 pages 时
//   再退回「本页是否满页」的兜底判断。
//
// 条件变化（nickName / userId / nonce）→ 清空并从第 1 页重来；
// 用自增 seq 让在途的旧请求作废，避免切条件或快速滚动时把过期数据拼进列表。
export function useAdminUserList({ nickName = '', userId = '', nonce = 0 } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [pages, setPages] = useState(null);
  const [loading, setLoading] = useState(true); // 第一页（首屏 / 重置）
  const [loadingMore, setLoadingMore] = useState(false); // 后续页
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const busyRef = useRef(false);
  const seqRef = useRef(0);
  // 每次渲染都把最新条件存进 ref，这样 loadNext 不必依赖条件、引用保持稳定
  const queryRef = useRef({ nickName, userId });
  queryRef.current = { nickName, userId };

  const reset = useCallback(() => {
    seqRef.current += 1; // 让在途请求作废
    busyRef.current = false;
    pageRef.current = 0;
    hasMoreRef.current = true;
    setItems([]);
    setTotal(null);
    setPages(null);
    setError(null);
    setHasMore(true);
    setLoading(true);
    setLoadingMore(false);
  }, []);

  const loadNext = useCallback(async () => {
    if (busyRef.current || !hasMoreRef.current) return;
    busyRef.current = true;
    const seq = ++seqRef.current;
    const next = pageRef.current + 1;
    if (next === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const { nickName: nk, userId: uid } = queryRef.current;
      const d = await fetchUserList({
        pageNum: next,
        nickName: nk || undefined,
        userId: uid || undefined,
      });
      // 期间重置过或换了条件：这次结果作废
      if (seq !== seqRef.current) return;

      const list = Array.isArray(d?.list) ? d.list : [];
      const pageSize = Number(d?.pageSize) > 0 ? Number(d.pageSize) : list.length;

      pageRef.current = next;
      setItems((prev) => (next === 1 ? list : prev.concat(list)));
      if (typeof d?.total === 'number') setTotal(d.total);
      if (typeof d?.pages === 'number') setPages(d.pages);

      const more =
        typeof d?.pages === 'number'
          ? next < d.pages
          : pageSize > 0
            ? list.length >= pageSize
            : list.length > 0;
      hasMoreRef.current = more;
      setHasMore(more);
    } catch (e) {
      if (seq !== seqRef.current) return;
      setError(e?.message || '用户列表加载失败');
      // 出错就先停住，免得滚动时反复打接口；重试走 reload()
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      // 只有「当前这次」才解锁并收尾：
      // 过期请求的 finally 不能把 busyRef 关掉，否则它的后续（滚动/补页）
      // 会在新请求还没回来时再发一次同一页，把重复数据拼进列表。
      if (seq === seqRef.current) {
        busyRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  // 重置 + 从第 1 页重新加载
  const reload = useCallback(() => {
    reset();
    loadNext();
  }, [reset, loadNext]);

  // 条件变化 → 清空重来
  useEffect(() => {
    reset();
    loadNext();
  }, [nickName, userId, nonce, reset, loadNext]);

  // 就地改一行：拉黑/解封后不重拉列表，否则滚动位置会丢、已加载的页还要重拼一遍
  const patchItem = useCallback((id, patch) => {
    setItems((prev) =>
      prev.map((u) => (String(u.userId) === String(id) ? { ...u, ...patch } : u))
    );
  }, []);

  return {
    items,
    total,
    pages,
    loading,
    loadingMore,
    error,
    hasMore,
    loadNext,
    reload,
    patchItem,
  };
}
