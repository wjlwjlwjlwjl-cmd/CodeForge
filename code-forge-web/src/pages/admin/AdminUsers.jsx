import { useCallback, useEffect, useState } from 'react';
import { fetchUserList, updateUserStatus } from '../../api/admin.js';
import { StatusDot, EmptyState, Notice } from './AdminBits.jsx';
import { formatDateTime } from '../../utils/format.js';

// B 端用户管理
//   GET  /user/b/list?pageNum=&nickName=&userId=  → BasePageVO<UserVO>
//   POST /user/b/update?userId=&status=           → 拉黑(0) / 解封(1)
//   status 语义见 01-init.sql：0-拉黑 1-正常
export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ nickName: '', userId: '' });
  const [applied, setApplied] = useState({ nickName: '', userId: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchUserList({
        pageNum: page,
        nickName: applied.nickName || undefined,
        userId: applied.userId || undefined,
      });
      setData(d || null);
    } catch (e) {
      setError(e?.message || '用户列表加载失败');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => {
    load();
  }, [load]);

  const search = (e) => {
    e.preventDefault();
    setPage(1);
    setApplied({ nickName: filters.nickName.trim(), userId: filters.userId.trim() });
  };

  const reset = () => {
    setFilters({ nickName: '', userId: '' });
    setApplied({ nickName: '', userId: '' });
    setPage(1);
  };

  const toggleStatus = async (row) => {
    const next = row.status === 1 ? 0 : 1;
    setBusyId(row.userId);
    setNotice(null);
    try {
      await updateUserStatus({ userId: row.userId, status: next });
      setNotice(`已将用户 ${row.nickName || row.userId} 设为${next === 0 ? '黑名单' : '正常'}`);
      await load();
    } catch (e) {
      setNotice(e?.message || '更新失败');
    } finally {
      setBusyId(null);
    }
  };

  const list = Array.isArray(data?.list) ? data.list : [];
  const total = typeof data?.total === 'number' ? data.total : null;
  const pages = typeof data?.pages === 'number' ? data.pages : null;

  return (
    <>
      <h1 className="admin-h1">用户管理</h1>
      <p className="admin-sub">B 端注册用户列表，可执行拉黑 / 解封。</p>

      <section className="admin-section">
        <form className="admin-toolbar" onSubmit={search}>
          <input
            className="admin-input w-md"
            type="text"
            placeholder="昵称（模糊匹配）"
            value={filters.nickName}
            onChange={(e) => setFilters((p) => ({ ...p, nickName: e.target.value }))}
          />
          <input
            className="admin-input"
            type="text"
            inputMode="numeric"
            placeholder="用户 ID"
            style={{ width: 110 }}
            value={filters.userId}
            onChange={(e) => setFilters((p) => ({ ...p, userId: e.target.value }))}
          />
          <button type="submit" className="admin-btn primary" disabled={loading}>
            查询
          </button>
          <button type="button" className="admin-btn" onClick={reset}>
            重置
          </button>
          <span className="admin-hint">共 {total ?? '—'} 条</span>
        </form>

        {error && <Notice kind="error">{error}</Notice>}
        {notice && (
          <Notice onClose={() => setNotice(null)}>{notice}</Notice>
        )}

        <div className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th style={{ width: 130 }}>昵称</th>
                  <th>邮箱</th>
                  <th style={{ width: 150 }}>学校</th>
                  <th style={{ width: 120 }}>专业</th>
                  <th style={{ width: 90 }}>状态</th>
                  <th style={{ width: 165 }}>注册时间</th>
                  <th style={{ width: 90 }} className="col-actions">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => {
                  const ok = u.status === 1;
                  return (
                    <tr key={u.userId}>
                      <td className="col-num">{u.userId}</td>
                      <td>{u.nickName || '—'}</td>
                      <td className="cell-ellipsis" title={u.email || ''}>
                        {u.email || '—'}
                      </td>
                      <td className="cell-ellipsis" title={u.schoolName || ''}>
                        {u.schoolName || '—'}
                      </td>
                      <td className="cell-ellipsis" title={u.majorName || ''}>
                        {u.majorName || '—'}
                      </td>
                      <td>
                        <StatusDot kind={ok ? 'ok' : 'bad'}>
                          {ok ? '正常' : '黑名单'}
                        </StatusDot>
                      </td>
                      <td className="col-num col-muted">
                        {formatDateTime(u.createTime)}
                      </td>
                      <td className="col-actions">
                        <button
                          type="button"
                          className={`admin-btn${ok ? ' danger' : ''}`}
                          disabled={busyId === u.userId}
                          onClick={() => toggleStatus(u)}
                        >
                          {busyId === u.userId ? '处理中…' : ok ? '拉黑' : '解封'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && !list.length && (
              <EmptyState>{error ? '加载失败' : '暂无数据'}</EmptyState>
            )}
            {loading && <EmptyState>加载中…</EmptyState>}
          </div>

          <div className="admin-pager">
            <span>
              第 <span className="admin-num">{data?.pageNum ?? page}</span>
              {pages ? (
                <>
                  {' / '}
                  <span className="admin-num">{pages}</span>
                </>
              ) : null}{' '}
              页
              {total != null && (
                <>
                  ，共 <span className="admin-num">{total}</span> 条
                </>
              )}
            </span>
            <span className="admin-pager-right">
              <button
                type="button"
                className="admin-btn"
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </button>
              <button
                type="button"
                className="admin-btn"
                disabled={loading || (pages != null && page >= pages)}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </button>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
