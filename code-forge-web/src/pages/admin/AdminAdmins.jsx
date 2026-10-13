import { useCallback, useEffect, useState } from 'react';
import { addAdmin, deleteAdmin, fetchAdminList } from '../../api/admin.js';
import { ConfirmDialog, EmptyState, Notice } from './AdminBits.jsx';
import { formatDateTime } from '../../utils/format.js';

// 管理员管理
//   GET    /system/b/list                     → { list: SysUserVO[] }
//   POST   /system/b/add   { nickname, password } → { userAccount }
//   DELETE /system/b/delete/{userAccount}
// 前端校验对齐后端 AddAdminDTO：昵称非空、密码 6~12 位
const PWD_MIN = 6;
const PWD_MAX = 12;

export default function AdminAdmins({ selfAccount }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [form, setForm] = useState({ nickname: '', password: '' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchAdminList();
      setRows(Array.isArray(d?.list) ? d.list : []);
    } catch (e) {
      setError(e?.message || '管理员列表加载失败');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const nickname = form.nickname.trim();
    const password = form.password;

    if (!nickname) {
      setFormError('昵称不能为空');
      return;
    }
    if (password.length < PWD_MIN || password.length > PWD_MAX) {
      setFormError(`密码长度必须在 ${PWD_MIN}-${PWD_MAX} 之间`);
      return;
    }

    setSaving(true);
    setFormError(null);
    setNotice(null);
    try {
      const d = await addAdmin({ nickname, password });
      setNotice(`已添加管理员${d?.userAccount ? `：${d.userAccount}` : ''}`);
      setForm({ nickname: '', password: '' });
      await load();
    } catch (err) {
      setFormError(err?.message || '添加失败');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdmin(pendingDelete.userAccount);
      setNotice(`已删除管理员：${pendingDelete.userAccount}`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setNotice(err?.message || '删除失败');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <h1 className="admin-h1">管理员管理</h1>
      <p className="admin-sub">
        后台管理员的增删查。数据来自 GET /system/b/list。
      </p>

      {error && <Notice kind="error">{error}</Notice>}
      {notice && <Notice onClose={() => setNotice(null)}>{notice}</Notice>}

      <div className="admin-admins-cols">
        {/* 管理员列表 */}
        <section className="admin-section">
          <div className="admin-section-head">
            <h2 className="admin-h2">管理员列表</h2>
            <span className="admin-hint">共 {loading ? '…' : rows.length} 个</span>
          </div>
          <div className="admin-panel">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>ID</th>
                    <th style={{ width: 120 }}>昵称</th>
                    <th>账号</th>
                    <th style={{ width: 165 }}>创建时间</th>
                    <th style={{ width: 80 }} className="col-actions">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => {
                    const isSelf = a.userAccount === selfAccount;
                    return (
                      <tr key={a.id ?? a.userAccount}>
                        <td className="col-num">{a.id}</td>
                        <td>{a.nickName || '—'}</td>
                        <td className="cell-ellipsis" title={a.userAccount}>
                          {a.userAccount}
                        </td>
                        <td className="col-num col-muted">
                          {formatDateTime(a.createTime)}
                        </td>
                        <td className="col-actions">
                          <button
                            type="button"
                            className="admin-btn danger"
                            disabled={isSelf}
                            title={isSelf ? '不能删除当前登录账号' : '删除该管理员'}
                            onClick={() => setPendingDelete(a)}
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!loading && !rows.length && (
                <EmptyState>{error ? '加载失败' : '暂无数据'}</EmptyState>
              )}
              {loading && <EmptyState>加载中…</EmptyState>}
            </div>
          </div>
        </section>

        {/* 添加管理员 */}
        <section className="admin-section">
          <div className="admin-section-head">
            <h2 className="admin-h2">添加管理员</h2>
            <span className="admin-hint">POST /system/b/add</span>
          </div>
          <div className="admin-panel admin-panel-pad">
            <form onSubmit={submit}>
              <div className="admin-field">
                <label htmlFor="admin-new-nick">昵称</label>
                <input
                  id="admin-new-nick"
                  className="admin-input w-lg"
                  type="text"
                  placeholder="管理员昵称"
                  value={form.nickname}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, nickname: e.target.value }));
                    setFormError(null);
                  }}
                />
              </div>
              <div className="admin-field">
                <label htmlFor="admin-new-pwd">
                  密码（{PWD_MIN}~{PWD_MAX} 位）
                </label>
                <input
                  id="admin-new-pwd"
                  className="admin-input w-lg"
                  type="password"
                  autoComplete="new-password"
                  placeholder="初始密码"
                  value={form.password}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, password: e.target.value }));
                    setFormError(null);
                  }}
                />
              </div>
              {formError && <p className="admin-field-error">{formError}</p>}
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn primary" disabled={saving}>
                  {saving ? '提交中…' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="删除管理员"
          body={`确定删除管理员 ${pendingDelete.userAccount} 吗？该操作不可撤销。`}
          confirmText="删除"
          danger
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
