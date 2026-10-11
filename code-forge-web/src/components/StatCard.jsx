// 数据概览卡片：数字用橙色大字，标签用次要文字色
// props: label, value, hint, progress(0~100，为数字时显示橙色渐变进度条)
export default function StatCard({ label, value, hint, progress, delay = 0, accent = false }) {
  const pct = typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : null;

  return (
    <div
      className={`stat-card${accent ? ' accent' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className="stat-hint">{hint}</div>}
      {pct != null && (
        <div className="stat-progress" role="progressbar" aria-valuenow={pct}>
          <div className="stat-progress-bar" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
