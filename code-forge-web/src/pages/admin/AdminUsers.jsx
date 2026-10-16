import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchUserList, updateUserStatus } from '../../api/admin.js';
import { useAdminPagedList } from '../../hooks/useAdminPagedList.js';
import { StatusDot, EmptyState, Notice } from './AdminBits.jsx';
import { formatDateTime } from '../../utils/format.js';

// B 端用户管理
//   GET  /user/b/list?pageNum=&nickName=&userId=  → UserListVO（后端 PageHelper 分页）
//   POST /user/b/update?userId=&status=           → 拉黑(0) / 解封(1)
//   status 语义见 01-init.sql：0-拉黑 1-正常
//
// 列表形态 = 「区内无限滚动」：
//   区域高度固定（见 admin.css 的 .admin-scroll-area），在区域里向下滚到底就
//   自动拉下一页追加，而不是整页无限下拉，也不是上一页/下一页翻页。
//
// 拉黑 / 解封成功后只就地改这一行（patchItem），不整表重拉：
//   无限列表重拉会丢滚动位置，还得把已经加载的几页重新拼一遍。
const SCROLL_EDGE = 80; // 距底部还有多少像素就开始加载下一页

export default function AdminUsers() {
  const [filters, setFilters] = useState({ nickName: '', userId: '' });
  const [applied, setApplied] = useState({ nickName: '', userId: '' });
  // 点「查询 / 重置」时 +1：条件没变也能重新拉一次
  const [nonce, setNonce] = useState(0);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const areaRef = useRef(null);

  const {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadNext,
    reload,
    setItems,
  } = useAdminPagedList(
    (pageNum) =>
      fetchUserList({
        pageNum,
        nickName: applied.nickName || undefined,
        userId: applied.userId || undefined,
      }),
    // 条件指纹：查询/重置会 +nonce，条件没变也能重新拉
    `${applied.nickName}\u0000${applied.userId}\u0000${nonce}`
  );

  // 换条件后把滚动区域拉回顶部
  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = 0;
  }, [applied, nonce]);

  // 内容不足一屏时自动再拉一页（否则没有滚动条，就永远触发不了滚动加载）
  useEffect(() => {
    if (loading || loadingMore || !hasMore || error) return;
    const el = areaRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 4) loadNext();
  }, [items, loading, loadingMore, hasMore, error, loadNext]);

  const onScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_EDGE) {
        loadNext();
      }
    },
    [loadNext]
  );

  const search = (e) => {
    e.preventDefault();
    setApplied({ nickName: filters.nickName.trim(), userId: filters.userId.trim() });
    setNonce((n) => n + 1);
  };

  const reset = () => {
    setFilters({ nickName: '', userId: '' });
    setApplied({ nickName: '', userId: '' });
    setNonce((n) => n + 1);
  };

  const toggleStatus = async (row) => {
    const next = row.status === 1 ? 0 : 1;
    setBusyId(row.userId);
    setNotice(null);
    try {
      await updateUserStatus({ userId: row.userId, status: next });
      // 只就地改这一行，不重拉列表（否则滚动位置会丢、已加载的页还要重拼）
      setItems((prev) =>
        prev.map((u) =>
          String(u.userId) === String(row.userId) ? { ...u, status: next } : u
        )
      );
      setNotice(
        `已将用户 ${row.nickName || row.userId} 设为${next === 0 ? '黑名单' : '正常'}`
      );
    } catch (e) {
      setNotice(e?.message || '更新失败');
    } finally {
      setBusyId(null);
    }
  };

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
        </form>

        {notice && <Notice onClose={() => setNotice(null)}>{notice}</Notice>}

        <div className="admin-panel">
          {/* 列表区：高度固定，区内滚动加载 */}
          <div className="admin-scroll-area" ref={areaRef} onScroll={onScroll}>
            <table className="admin-table admin-table-users">
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
                {items.map((u) => {
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

            {/* 首屏加载 / 空态 / 首屏出错 */}
            {loading && <EmptyState>加载中…</EmptyState>}
            {!loading && !items.length && !error && <EmptyState>暂无数据</EmptyState>}
            {!loading && !items.length && error && (
              <EmptyState>
                {error}
                <button type="button" className="admin-btn link" onClick={reload}>
                  重试
                </button>
              </EmptyState>
            )}

            {/* 滚到底的反馈：加载中 / 已到底 / 后续页出错 */}
            {loadingMore && <div className="admin-list-more">加载中…</div>}
            {!loading && !loadingMore && !hasMore && items.length > 0 && (
              <div className="admin-list-more">已加载全部 {items.length} 条</div>
            )}
            {!loading && items.length > 0 && error && (
              <div className="admin-list-more is-error">
                {error}
                <button type="button" className="admin-btn link" onClick={reload}>
                  重试
                </button>
              </div>
            )}
          </div>

          <div className="admin-listfoot">
            <span>
              共 <span className="admin-num">{total ?? '—'}</span> 条，已加载{' '}
              <span className="admin-num">{items.length}</span> 条
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
