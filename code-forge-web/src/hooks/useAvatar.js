import { useEffect, useState } from 'react';
import {
  ensureAvatar,
  getAvatarState,
  subscribeAvatar,
} from '../api/avatarStore.js';

// 订阅全局头像状态
//
// 用法：
//   const avatarUrl = useAvatar();          // 仅读取（不触发拉取）
//   const avatarUrl = useAvatar({ load: true }); // 挂载时异步拉取（首页用）
//
// 所有展示头像的地方都从这里取，保证用的是同一次获取的头像。
export function useAvatar({ load = false } = {}) {
  const [state, setState] = useState(getAvatarState);

  useEffect(() => subscribeAvatar(setState), []);

  useEffect(() => {
    if (load) ensureAvatar();
  }, [load]);

  return {
    avatarUrl: state.url,
    status: state.status, // 'idle' | 'loading' | 'ready' | 'none'
    loading: state.status === 'loading',
    ensureAvatar,
  };
}
