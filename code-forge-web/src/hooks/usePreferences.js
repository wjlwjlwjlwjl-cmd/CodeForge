import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

// 全局偏好设置，统一持久化到 localStorage
//   - theme: 'light' | 'dark'
//   - editorFontSize: 编辑器字号
//   - zoom: 整体 UI 缩放比例（0.8 ~ 1.5）
//   - splitRatio: 左侧题面宽度占比（0 ~ 1）
const KEYS = {
  theme: 'cf:theme',
  editorFontSize: 'cf:editorFontSize',
  zoom: 'cf:zoom',
  splitRatio: 'cf:splitRatio',
  vimMode: 'cf:vimMode',
};

const DEFAULTS = {
  theme: 'light',
  editorFontSize: 14,
  zoom: 1,
  splitRatio: 0.4,
  vimMode: false,
};

export const ZOOM_MIN = 0.8;
export const ZOOM_MAX = 1.5;
export const ZOOM_STEP = 0.1;

export function usePreferences() {
  const [theme, setTheme] = useLocalStorage(KEYS.theme, DEFAULTS.theme);
  const [editorFontSize, setEditorFontSize] = useLocalStorage(
    KEYS.editorFontSize,
    DEFAULTS.editorFontSize
  );
  const [zoom, setZoom] = useLocalStorage(KEYS.zoom, DEFAULTS.zoom);
  const [splitRatio, setSplitRatio] = useLocalStorage(
    KEYS.splitRatio,
    DEFAULTS.splitRatio
  );
  const [vimMode, setVimMode] = useLocalStorage(
    KEYS.vimMode,
    DEFAULTS.vimMode
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  const changeZoom = useCallback(
    (delta) => {
      setZoom((prev) =>
        Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((prev + delta) * 10) / 10))
      );
    },
    [setZoom]
  );

  return {
    theme,
    // LeetCode 编辑器始终为暗色，固定使用 vs-dark
    monacoTheme: 'vs-dark',
    toggleTheme,
    editorFontSize,
    setEditorFontSize,
    zoom,
    changeZoom,
    splitRatio,
    setSplitRatio,
    vimMode,
    setVimMode,
  };
}
