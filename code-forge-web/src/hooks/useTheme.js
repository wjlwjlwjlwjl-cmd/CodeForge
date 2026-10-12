import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

// 外观（主题）设置
//
// mode 有三种：'system' | 'light' | 'dark'，持久化在 localStorage['cf:theme']
//   · 跟随系统：实时读 prefers-color-scheme，系统切换时页面跟着变
//   · 浅色 / 深色：固定
// theme 是解析后的实际主题（'light' | 'dark'），CSS 与 Monaco 都只看它。
//
// 注意：index.html 里有一段同步脚本要先按同样的规则把 data-theme 写到 <html>
// 上（避免整页跳转时闪白），两边逻辑必须保持一致。

export const THEME_STORAGE_KEY = 'cf:theme';

export const THEME_MODES = [
  { key: 'system', label: '跟随系统' },
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '深色' },
];

const DARK_QUERY = '(prefers-color-scheme: dark)';

function systemPrefersDark() {
  try {
    return window.matchMedia(DARK_QUERY).matches;
  } catch (e) {
    return false;
  }
}

function normalizeMode(mode) {
  return mode === 'light' || mode === 'dark' || mode === 'system'
    ? mode
    : 'system';
}

export function useTheme() {
  const [stored, setStored] = useLocalStorage(THEME_STORAGE_KEY, 'system');
  const mode = normalizeMode(stored);

  // 系统是否为深色（跟随系统模式下用）
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // 系统主题变化时实时跟随
  useEffect(() => {
    let mq;
    try {
      mq = window.matchMedia(DARK_QUERY);
    } catch (e) {
      return undefined;
    }
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const theme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  // 写到 <html> 上，:root 变量、body 底色、原生滚动条配色都靠它
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  const setMode = useCallback(
    (next) => {
      setStored(normalizeMode(next));
    },
    [setStored]
  );

  // 在浅/深之间直接切换（登录页那个小按钮用；不影响「跟随系统」选项）
  const toggleTheme = useCallback(() => {
    setStored(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setStored]);

  return {
    mode,
    setMode,
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };
}
