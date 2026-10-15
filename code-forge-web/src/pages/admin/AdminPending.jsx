import { EmptyState } from './AdminBits.jsx';

// 未接入的区块占位
// 不画假表格、不放假装能用的按钮，只如实列出「还没做的操作」。
// 注意：界面上不出现任何接口路径/方法，那是给开发者看的，不属于页面内容。
export default function AdminPending({ title, note, actions }) {
  return (
    <>
      <h1 className="admin-h1">{title}</h1>
      <p className="admin-sub">{note}</p>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-h2">待接入的操作</h2>
        </div>
        <div className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>操作</th>
                  <th style={{ width: 80 }} className="col-actions">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody>
                {actions.map((name) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td className="col-actions col-muted">待接入</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <EmptyState>页面内容暂无数据</EmptyState>
        </div>
      </section>
    </>
  );
}
