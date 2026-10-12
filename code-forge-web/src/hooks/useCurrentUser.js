import { useEffect, useState } from 'react';
import { fetchUserInfo } from '../api/home.js';

// 当前登录用户信息（GET /user/detail）
//
// 编辑器页的顶栏只需要昵称/邮箱来渲染用户下拉，这里做一层模块级缓存，
// 保证整个会话只拉一次，并且登录/退出时清掉避免串号。
let cache = null;
let inflight = null;

export function clearCurrentUser() {
  cache = null;
  inflight = null;
}

export function useCurrentUser({ enabled = true } = {}) {
  const [user, setUser] = useState(cache);

  useEffect(() => {
    if (!enabled) return undefined;
    if (cache) {
      setUser(cache);
      return undefined;
    }

    let cancelled = false;
    if (!inflight) {
      inflight = fetchUserInfo()
        .then((info) => {
          cache = info || null;
          return cache;
        })
        .catch(() => null)
        .finally(() => {
          inflight = null;
        });
    }
    inflight.then((info) => {
      if (!cancelled) setUser(info);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return user;
}
