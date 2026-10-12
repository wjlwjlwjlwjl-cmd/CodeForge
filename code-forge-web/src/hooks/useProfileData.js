import { useCallback, useEffect, useState } from 'react';
import { fetchUserInfo, fetchSubmitInfo } from '../api/home.js';
import { formatStatCount, formatPassRate } from '../utils/format.js';

// 用户主页数据
//   用户信息   GET /user/detail      → { nickName, sex, email, avatarName, schoolName, majorName, introduce }
//   提交信息   GET /user/submitInfo  → { submitSum, passSum, passRate }
//               字段不合法 → N/A
//   头像走全局存储（avatarStore / useAvatar），这里不等它
export function useProfileData() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // silent = true 时不显示 loading（用于保存后的静默刷新）
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const info = await fetchUserInfo();
      setUser(info || null);
    } catch (e) {
      setUser(null);
    }

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

    setLoading(false);
  }, []);

  // 本地合并字段（保存成功后立即回显，随后再静默拉一次以对齐服务端）
  const patchUser = useCallback((patch) => {
    setUser((prev) => ({ ...(prev || {}), ...patch }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { user, stats, loading, reload: load, patchUser };
}
