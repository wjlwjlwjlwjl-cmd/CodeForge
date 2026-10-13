import { EmptyState } from './AdminBits.jsx';

// 未接入的区块占位
// 不画假表格、不放假装能用的按钮，只如实列出已就绪的接口与操作。
export default function AdminPending({ title, note, apis }) {
  return (
    <>
      <h1 className="admin-h1">{title}</h1>
      <p className="admin-sub">{note}</p>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-h2">待接入的操作</h2>
          <span className="admin-hint">接口已就绪，界面尚未实现</span>
        </div>
        <div className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>方法</th>
                  <th style={{ width: 300 }}>接口</th>
                  <th>说明</th>
                  <th style={{ width: 80 }} className="col-actions">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody>
                {apis.map(([method, path, desc]) => (
                  <tr key={`${method} ${path}`}>
                    <td className="col-num">{method}</td>
                    <td className="col-num" title={path}>
                      {path}
                    </td>
                    <td>{desc}</td>
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
