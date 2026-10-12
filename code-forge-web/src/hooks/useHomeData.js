import { useCallback, useEffect, useState } from 'react';
import { fetchUserInfo, fetchOngoingContests } from '../api/home.js';

// 首页数据：全部来自真实接口，不再使用任何 mock。
//   用户信息     GET /user/detail
//   进行中竞赛   GET /user/exam/list/queue?option=1
//
// 头像是独立的全局存储（见 avatarStore / useAvatar），这里不等待它。
export function useHomeData() {
  const [user, setUser] = useState(null);
  const [ongoing, setOngoing] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    // 用户信息
    try {
      const info = await fetchUserInfo();
      setUser(info || null);
    } catch (e) {
      setUser(null);
    }

    // 进行中的竞赛
    try {
      // pageNum 从 1 开始（后端传 0 会取到最后一页）
      const data = await fetchOngoingContests({ option: 1, pageNum: 1 });
      setOngoing(Array.isArray(data?.list) ? data.list : []);
    } catch (e) {
      setOngoing([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { user, ongoing, loading, reload: load };
}
