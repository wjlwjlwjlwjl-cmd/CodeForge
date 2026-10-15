import { useCallback, useEffect, useState } from 'react';
import {
  adminLogin,
  adminLogout,
  fetchAdminInfo,
  getAdminToken,
  setAdminToken,
} from '../api/admin.js';

// B 端登录态
//
// token 存在 localStorage['cf:adminToken']（与 C 端的 cf:token 完全独立）。
// 拿到 token 后拉一次 /system/b/info 作为「当前管理员信息」；
// 若接口返回 3001（未授权）说明 token 失效，直接清掉回到登录页。
export function useAdminSession() {
  const [token, setToken] = useState(getAdminToken);
  const [info, setInfo] = useState(null);
  // 一开始就带着 token → 直接进入「验证中」，避免闪一下登录表单
  const [loading, setLoading] = useState(() => !!getAdminToken());
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadInfo = useCallback(async () => {
    if (!getAdminToken()) {
      setInfo(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminInfo();
      setInfo(data || null);
      return data;
    } catch (e) {
      setInfo(null);
      // /system/b/info 是登录态探针：只要拿不到管理员信息，后台就用不了，
      // 一律退回登录页。后端对失效 token 的表现并不统一
      // （网关 401/400、业务码 3001、甚至 2000 服务繁忙），所以不做细分。
      // 唯一例外是纯网络异常：登录态未知，保留 token，等网络恢复后刷新即可。
      if (e?.code === 'NETWORK') {
        setError('无法连接服务，请检查网络后重试');
      } else {
        setAdminToken('');
        setToken('');
        setError('登录状态已失效，请重新登录');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadInfo();
    else setInfo(null);
  }, [token, loadInfo]);

  const login = useCallback(async ({ userAccount, password }) => {
    const data = await adminLogin({ userAccount, password });
    const next = data?.token || '';
    setAdminToken(next);
    setToken(next);
    return next;
  }, []);

  // 退出登录：先带着当前 token 调 DELETE /system/b/logout 让后端删除登录态，
  // 无论成功与否都要清掉本地 token（否则会卡在「看起来已登录但接口全 3001」）
  const logout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      if (getAdminToken()) await adminLogout();
    } catch (e) {
      // 网络异常等情况不阻塞本地登出
      console.warn('[admin] 退出登录接口失败（本地仍会登出）:', e?.message);
    } finally {
      setAdminToken('');
      setToken('');
      setInfo(null);
      setLoggingOut(false);
    }
  }, [loggingOut]);

  return {
    token,
    info,
    loading,
    error,
    loggingOut,
    login,
    logout,
    reload: loadInfo,
  };
}
