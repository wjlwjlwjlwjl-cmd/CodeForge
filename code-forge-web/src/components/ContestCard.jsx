import { formatDateTime } from '../utils/format.js';

// 竞赛卡片
// 两种形态：
//   1) 可报名/进入（进行中的竞赛）→ actionLabel + onAction
//   2) 已参加（我的竞赛）→ 状态标签 + 我的排名（含排名获取时间）
export default function ContestCard({
  title,
  startTime,
  endTime,
  actionLabel,
  onAction,
  actionDisabled,
  statusText,
  statusKind,
  rank,
  rankTime,
  delay = 0,
}) {
  const hasAction = !!actionLabel;

  return (
    <div className="contest-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="contest-card-main">
        <div className="contest-card-head">
          <span className="contest-title">{title}</span>
          {statusText && (
            <span className={`contest-status status-${statusKind || 'muted'}`}>
              {statusText}
            </span>
          )}
        </div>

        <div className="contest-time">
          {formatDateTime(startTime)} ~ {formatDateTime(endTime)}
        </div>

        {rank != null && (
          <div className="contest-rank">
            <span className="contest-rank-value">#{rank}</span>
            {rankTime && (
              <span className="contest-rank-time">
                排名更新于 {formatDateTime(rankTime)}
              </span>
            )}
          </div>
        )}
      </div>

      {hasAction && (
        <button
          type="button"
          className="contest-action"
          onClick={onAction}
          disabled={actionDisabled}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
