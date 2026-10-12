import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage.js';
import { useTheme, THEME_STORAGE_KEY } from './useTheme.js';

// 全局偏好设置，统一持久化到 localStorage
//   - 外观: 'system' | 'light' | 'dark'（见 useTheme，key 为 cf:theme）
//   - editorFontSize: 编辑器字号
//   - zoom: 整体 UI 缩放比例（0.8 ~ 1.5）
//   - splitRatio: 左侧题面宽度占比（0 ~ 1）
const KEYS = {
  theme: THEME_STORAGE_KEY,
  editorFontSize: 'cf:editorFontSize',
  zoom: 'cf:zoom',
  splitRatio: 'cf:splitRatio',
  vimMode: 'cf:vimMode',
};

const DEFAULTS = {
  editorFontSize: 14,
  zoom: 1,
  splitRatio: 0.4,
  vimMode: false,
};

export const ZOOM_MIN = 0.8;
export const ZOOM_MAX = 1.5;
export const ZOOM_STEP = 0.1;

export function usePreferences() {
  // 外观：mode 是用户选的（含跟随系统），theme 是解析后的实际亮/暗
  const { mode: themeMode, setMode: setThemeMode, theme, toggleTheme } =
    useTheme();
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

  const changeZoom = useCallback(
    (delta) => {
      setZoom((prev) =>
        Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((prev + delta) * 10) / 10))
      );
    },
    [setZoom]
  );

  return {
    // 解析后的实际主题：'light' | 'dark'
    theme,
    // 用户选择的外观：'system' | 'light' | 'dark'
    themeMode,
    setThemeMode,
    // 编辑器主题跟随页面主题：浅色用 light，深色用 vs-dark
    monacoTheme: theme === 'dark' ? 'vs-dark' : 'light',
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
