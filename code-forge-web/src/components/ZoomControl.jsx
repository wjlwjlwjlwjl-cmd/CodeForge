import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../hooks/usePreferences.js';

// 整体 UI 缩放控制：放大 / 缩小 / 重置 / 显示当前百分比
export default function ZoomControl({ zoom, onChange }) {
  const pct = Math.round(zoom * 100);

  return (
    <div className="zoom-control">
      <button
        type="button"
        onClick={() => onChange(-ZOOM_STEP)}
        disabled={zoom <= ZOOM_MIN}
        title="缩小"
        aria-label="缩小页面"
      >
        −
      </button>
      <span className="zoom-value" onClick={() => onChange(1 - zoom)} title="点击重置为 100%">
        {pct}%
      </span>
      <button
        type="button"
        onClick={() => onChange(ZOOM_STEP)}
        disabled={zoom >= ZOOM_MAX}
        title="放大"
        aria-label="放大页面"
      >
        +
      </button>
    </div>
  );
}
