import { useAdminStats } from '../../hooks/useAdminStats.js';
import { formatDateTime } from '../../utils/format.js';
import { AdminIcon, EmptyState } from './AdminBits.jsx';

// 概览：横向统计条 + 快捷入口 + 暂无数据的占位区块
// 数字全部来自真实接口，拿不到就显示「—」，不编造。
export default function AdminOverview({ info, onGo }) {
  const { stats, loading } = useAdminStats();

  const num = (v) => (loading ? '…' : v == null ? '—' : v);
  const muted = (v) => !loading && v == null;

  const quick = [
    { key: 'questions', icon: 'questions', label: '添加题目', hint: '题库维护' },
    { key: 'exams', icon: 'exams', label: '新增竞赛', hint: '赛事管理' },
    { key: 'admins', icon: 'admins', label: '添加管理员', hint: '权限账户' },
    { key: 'users', icon: 'users', label: '查看用户列表', hint: 'B 端用户' },
  ];

  return (
    <>
      <h1 className="admin-h1">概览</h1>
      <p className="admin-sub">
        当前登录管理员 {info?.nickName || '—'}，数据实时取自后端接口。
      </p>

      {/* 数据概览：一条横向统计条，不做等宽模板卡 */}
      <section className="admin-section">
        <div className="admin-statbar">
          <div className="admin-stat w-sm">
            <span className="admin-stat-label">管理员</span>
            <span
              className={`admin-stat-value admin-num${muted(stats.admins) ? ' is-muted' : ''}`}
            >
              {num(stats.admins)}
            </span>
          </div>
          <div className="admin-stat w-md">
            <span className="admin-stat-label">B 端用户</span>
            <span
              className={`admin-stat-value admin-num${muted(stats.users) ? ' is-muted' : ''}`}
            >
              {num(stats.users)}
              <span className="admin-stat-unit">人</span>
            </span>
          </div>
          <div className="admin-stat w-md">
            <span className="admin-stat-label">黑名单</span>
            <span className="admin-stat-value admin-num is-muted">—</span>
            <span className="admin-stat-note">接口未提供状态筛选</span>
          </div>
          <div className="admin-stat w-md">
            <span className="admin-stat-label">题目</span>
            <span
              className={`admin-stat-value admin-num${muted(stats.questions) ? ' is-muted' : ''}`}
            >
              {num(stats.questions)}
            </span>
          </div>
          <div className="admin-stat w-lg">
            <span className="admin-stat-label">竞赛</span>
            <span
              className={`admin-stat-value admin-num${muted(stats.exams) ? ' is-muted' : ''}`}
            >
              {num(stats.exams)}
            </span>
          </div>
        </div>
      </section>

      {/* 快捷入口 */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-h2">快捷入口</h2>
        </div>
        <div className="admin-quick">
          {quick.map((q) => (
            <button
              key={q.key}
              type="button"
              className="admin-quick-item"
              onClick={() => onGo(q.key)}
            >
              <AdminIcon name={q.icon} />
              <span>
                {q.label}
                <small>{q.hint}</small>
              </span>
              <span className="admin-quick-arrow" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="admin-overview-cols">
        {/* 最近操作 / 待办：没有对应接口，占位 */}
        <section className="admin-section">
          <div className="admin-section-head">
            <h2 className="admin-h2">最近操作</h2>
            <span className="admin-hint">后端暂未提供操作日志接口</span>
          </div>
          <div className="admin-panel">
            <EmptyState>暂无数据</EmptyState>
          </div>
        </section>

        {/* 当前管理员信息卡：GET /system/b/info */}
        <section className="admin-section">
          <div className="admin-section-head">
            <h2 className="admin-h2">当前管理员</h2>
            <span className="admin-hint">GET /system/b/info</span>
          </div>
          <div className="admin-panel admin-panel-pad">
            <dl className="admin-kv">
              <dt>昵称</dt>
              <dd>{info?.nickName || '—'}</dd>
              <dt>账号</dt>
              <dd className="admin-num">{info?.userAccount || '—'}</dd>
              <dt>角色</dt>
              <dd className="admin-muted" title="接口未返回角色字段">
                —（接口未返回）
              </dd>
              <dt>创建时间</dt>
              <dd className="admin-num">{formatDateTime(info?.createTime)}</dd>
            </dl>
          </div>
        </section>
      </div>
    </>
  );
}
