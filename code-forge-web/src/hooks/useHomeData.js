import { useCallback, useEffect, useState } from 'react';
import {
  fetchUserInfo,
  fetchSubmitInfo,
  fetchOngoingContests,
  fetchMyContests,
} from '../api/home.js';
import { formatStatCount, formatPassRate } from '../utils/format.js';

// 首页数据：全部来自真实接口，不再使用任何 mock。
//   用户信息     GET /user/detail
//   数据概览     GET /user/submitInfo      （字段不合法 → N/A）
//   进行中竞赛   GET /user/exam/list/queue?option=1
//   我参加的竞赛 GET /user/exam/list/mine
//
// 头像是独立的全局存储（见 avatarStore / useAvatar），这里不等待它。
export function useHomeData() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [ongoing, setOngoing] = useState([]);
  const [mine, setMine] = useState([]);
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

    // 数据概览：通过数 / 通过率 / 总提交数
    // 接口不可用或字段不合法时，对应项展示 N/A
    try {
      const info = await fetchSubmitInfo();
      const rate = formatPassRate(info?.passRate);
      setStats({
        passSum: formatStatCount(info?.passSum),
        submitSum: formatStatCount(info?.submitSum),
        passRate: rate.text,
        passRatePercent: rate.percent,
      });
    } catch (e) {
      setStats({
        passSum: 'N/A',
        submitSum: 'N/A',
        passRate: 'N/A',
        passRatePercent: null,
      });
    }

    // 进行中的竞赛
    try {
      const data = await fetchOngoingContests({ option: 1, pageNum: 0 });
      setOngoing(Array.isArray(data?.list) ? data.list : []);
    } catch (e) {
      setOngoing([]);
    }

    // 我参加的竞赛（后端无数据时返回 data:null）
    try {
      const data = await fetchMyContests({ pageNum: 0 });
      setMine(Array.isArray(data?.list) ? data.list : []);
    } catch (e) {
      setMine([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { user, stats, ongoing, mine, loading, reload: load };
}
