import { useEffect, useState } from 'react';
import { fetchAdminList } from '../api/admin.js';

// 管理员 userId → 昵称 的映射
//
// 列表接口里的 createBy / updateBy 存的是「用户 ID」（如 1），直接显示没什么信息量。
// GET /system/b/list 一次就能拿到全部管理员，所以用它把 ID 翻译成昵称。
// 模块级缓存：整个会话只拉一次；拉失败就退回显示 #id，不影响列表本身。
let cache = null;
let inflight = null;

export function useAdminNameMap() {
  const [map, setMap] = useState(cache);

  useEffect(() => {
    let cancelled = false;
    if (cache) {
      setMap(cache);
      return undefined;
    }
    if (!inflight) {
      inflight = fetchAdminList()
        .then((d) => {
          const next = {};
          for (const a of Array.isArray(d?.list) ? d.list : []) {
            if (a?.userId == null) continue;
            next[String(a.userId)] = a.nickName || a.userAccount || '';
          }
          cache = next;
          return next;
        })
        .catch(() => ({}))
        .finally(() => {
          inflight = null;
        });
    }
    inflight.then((m) => {
      if (!cancelled) setMap(m);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return map;
}

// userId → 显示名；拿不到映射就退回 #id
export function adminNameOf(map, userId) {
  if (userId == null) return '';
  return map?.[String(userId)] || `#${userId}`;
}
