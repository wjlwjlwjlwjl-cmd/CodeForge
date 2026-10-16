import { useCallback, useEffect, useState } from 'react';
import { addAdmin, deleteAdmin, fetchAdminList } from '../../api/admin.js';
import { ConfirmDialog, EmptyState } from './AdminBits.jsx';
import { toast } from './AdminToast.jsx';

import { formatDateTime } from '../../utils/format.js';

// 管理员管理
//   GET    /system/b/list                     → { list: SysUserVO[] }
//   POST   /system/b/add   { nickname, password } → { userAccount }（账号由后端生成，如 U12345678）
//   DELETE /system/b/delete/{userAccount}
//
// SysUserVO 里只有 userId（这个管理员自己的用户 ID），没有自增主键 id；
// 列表里不展示它（用账号/昵称就够认人），只在详情弹窗里能看到。
//
// ⚠️ 后端的 SysUserController#add 没有加 @Validated，
//    所以 AddAdminDTO 上的 @NotEmpty / @Length(6,12) 实际不会生效
//    （实测传空昵称、3 位密码都能建成功）。因此前端这套校验是唯一的把关：
//      · 昵称：非空（对齐 @NotEmpty），且 ≤32（tb_sys_user.nick_name 是 varchar(32)，
//        超长会在后端被 catch 成 2000 服务繁忙，这里提前拦下）
//      · 密码：6~12 位（对齐 @Length）
//    昵称重复时后端返回 3101「用户已存在」，直接把该文案透出给用户。
const PWD_MIN = 6;
const PWD_MAX = 12;
const NICK_MAX = 32;

export default function AdminAdmins({ selfAccount }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ nickname: '', password: '' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // 刚创建出来的管理员：把生成的账号显式留在界面上（这是登录要用的账号）
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchAdminList();
      setRows(Array.isArray(d?.list) ? d.list : []);
    } catch (e) {
      setError(e?.message || '管理员列表加载失败');
      toast.error(e?.message || '管理员列表加载失败');
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
    if (nickname.length > NICK_MAX) {
      setFormError(`昵称长度不能超过 ${NICK_MAX} 个字符`);
      return;
    }
    if (password.length < PWD_MIN || password.length > PWD_MAX) {
      setFormError(`密码长度必须在 ${PWD_MIN}-${PWD_MAX} 之间`);
      return;
    }

    setSaving(true);
    setFormError(null);
    setCopied(false);
    try {
      const d = await addAdmin({ nickname, password });
      // 账号是后端生成的，必须显式展示出来（管理员要靠它登录）
      setCreated({ userAccount: d?.userAccount || '', nickname });
      setForm({ nickname: '', password: '' });
      toast.success(`已创建管理员 ${nickname}`);
      await load();
    } catch (err) {
      // 昵称重复（3101）等后端错误直接透出
      toast.error(err?.message || '添加失败');
    } finally {
      setSaving(false);
    }
  };

  const copyAccount = async () => {
    const acc = created?.userAccount;
    if (!acc) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(acc);
      ok = true;
    } catch (e) {
      // 非安全上下文等情况下回退
      try {
        const ta = document.createElement('textarea');
        ta.value = acc;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e2) {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteAdmin(pendingDelete.userAccount);
      toast.success(`已删除管理员：${pendingDelete.userAccount}`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(err?.message || '删除失败');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <h1 className="admin-h1">管理员管理</h1>

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
                    <th style={{ width: 160 }}>昵称</th>
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
                      <tr key={a.userId ?? a.userAccount}>
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

            {/* 创建成功后把生成的账号留在界面上 */}
            {created && (
              <div className="admin-created">
                <div className="admin-created-head">
                  <span>已创建管理员</span>
                  <button
                    type="button"
                    className="admin-btn link"
                    onClick={() => setCreated(null)}
                  >
                    关闭
                  </button>
                </div>
                <dl className="admin-kv">
                  <dt>账号</dt>
                  <dd>
                    <span className="admin-num">{created.userAccount}</span>
                    <button
                      type="button"
                      className="admin-btn admin-copy-btn"
                      onClick={copyAccount}
                    >
                      {copied ? '已复制 ✓' : '复制账号'}
                    </button>
                  </dd>
                  <dt>昵称</dt>
                  <dd>{created.nickname}</dd>
                </dl>
                <p className="admin-hint">
                  账号由系统生成，请把这个账号交给该管理员用于登录后台。
                </p>
              </div>
            )}
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
