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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      if (e?.code === 3001) {
        setAdminToken('');
        setToken('');
        setInfo(null);
      } else {
        setError(e?.message || '管理员信息加载失败');
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

  const logout = useCallback(async () => {
    try {
      if (getAdminToken()) await adminLogout();
    } catch (e) {
      // 后端登出失败不阻塞本地登出
    }
    setAdminToken('');
    setToken('');
    setInfo(null);
  }, []);

  return { token, info, loading, error, login, logout, reload: loadInfo };
}
