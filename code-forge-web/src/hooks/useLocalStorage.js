import { useCallback, useState } from 'react';

// 通用的 localStorage 持久化 state hook
// 首次读取 localStorage，无则用默认值；每次 set 时同步写入 localStorage
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // 解析失败则回退默认值
    }
    return defaultValue;
  });

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved =
          typeof next === 'function' ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch (e) {
          // 存储失败（如隐私模式）忽略
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, set];
}
