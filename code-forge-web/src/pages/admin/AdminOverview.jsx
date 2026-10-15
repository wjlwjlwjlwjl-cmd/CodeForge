import { useAdminStats } from '../../hooks/useAdminStats.js';
import {
  AdminIcon,
  EmptyState,
  SYS_USER_FIELDS,
  SysUserFields,
  sysUserCellClass,
  sysUserText,
} from './AdminBits.jsx';

// 概览：横向统计条 + 快捷入口 + 当前管理员 + 其他管理员
// 数字全部来自真实接口，拿不到就显示「—」，不编造。
//
// 管理员信息统一按后端 SysUserVO 的字段展示（见 AdminBits 的 SYS_USER_FIELDS）:
//   · 「当前管理员」= GET /system/b/info（token 绑定的那一个）
//   · 「其他管理员」= GET /system/b/list 里除自己以外的那些
// 两者字段与顺序完全一致。

// 表格列宽（按 SysUserVO 的字段给，合计约 980px，内容区 1032px）
const COL_W = {
  userId: 160,
  userAccount: 120,
  nickName: 120,
  createBy: 135,
  updateBy: 135,
  createTime: 155,
  updateTime: 155,
};

export default function AdminOverview({ info, onGo }) {
  const { stats, admins, loading } = useAdminStats();

  const num = (v) => (loading ? '…' : v == null ? '—' : v);
  const muted = (v) => !loading && v == null;

  const quick = [
    { key: 'questions', icon: 'questions', label: '添加题目', hint: '题库维护' },
    { key: 'exams', icon: 'exams', label: '新增竞赛', hint: '赛事管理' },
    { key: 'admins', icon: 'admins', label: '添加管理员', hint: '权限账户' },
    { key: 'users', icon: 'users', label: '查看用户列表', hint: 'B 端用户' },
  ];

  // 其他管理员：列表里除了当前登录的这个
  const others = admins.filter((a) => a.userAccount !== info?.userAccount);

  return (
    <>
      <h1 className="admin-h1">概览</h1>

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

      {/* 当前管理员信息卡：按 SysUserVO 展示 */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-h2">当前管理员</h2>
        </div>
        <div className="admin-panel admin-panel-pad admin-overview-admin">
          <SysUserFields user={info} />
        </div>
      </section>

      {/* 其他管理员：同一个 SysUserVO 字段集，用表格装（人多了也不会拉很长） */}
      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-h2">其他管理员</h2>
          <span className="admin-hint">
            共 {loading ? '…' : others.length} 个
          </span>
        </div>
        <div className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-vo">
              <thead>
                <tr>
                  {SYS_USER_FIELDS.map(([label, key]) => (
                    <th key={key} style={{ width: COL_W[key] }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {others.map((a) => (
                  <tr key={a.userId ?? a.userAccount}>
                    {SYS_USER_FIELDS.map(([, key, kind]) => (
                      <td
                        key={key}
                        className={sysUserCellClass(kind)}
                        title={kind === 'num' ? sysUserText(a, key, kind) : undefined}
                      >
                        {sysUserText(a, key, kind)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !others.length && (
              <EmptyState>暂无其他管理员</EmptyState>
            )}
            {loading && <EmptyState>加载中…</EmptyState>}
          </div>
        </div>
      </section>
    </>
  );
}
