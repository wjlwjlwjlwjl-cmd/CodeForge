// B 端「管理员详情」弹窗
//
// 数据来源：GET /system/b/info（后端注释是「获取当前用户信息」）。
//
// SysUserVO 字段：userId / userAccount / nickName / createBy / updateBy /
//                createTime / updateTime。
// 注意它没有自增主键 id —— userId 就是这个管理员自己的用户 ID，
// createBy / updateBy 存的也是用户 ID（同一个 ID 空间），不是名字。
//
// ⚠️ 这个接口是 token 绑定的：它只有 Authorization 头，没有任何 userId /
//    userAccount 参数，所以它只能返回「当前登录的这个管理员」，看不了别人。
//    —— 想做到「点管理员列表任意一行看详情」，需要后端再提供一个按账号
//    查询的接口；在那之前，详情弹窗展示的永远是「我」。
//
// 打开时重新拉一次而不是复用登录时那份缓存，这样看到的是最新值；
// 拉取失败就如实报错（可退回登录时那份，但会明确标注，不冒充最新数据）。
import { useCallback, useEffect, useState } from 'react';
import { fetchAdminInfo } from '../../api/admin.js';
import { SysUserFields } from './AdminBits.jsx';
import { toast } from './AdminToast.jsx';


export default function AdminDetailDialog({ fallback, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchAdminInfo());
    } catch (e) {
      setError(e?.message || '读取失败');
      toast.error(e?.message || '读取失败');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Esc 关闭（外壳 AdminApp 也监听了 Esc 收导航，那边会先让路）
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 接口拿不到时退回登录时那份，并标注出来
  const stale = !loading && !data && !!fallback;
  const view = data || (stale ? fallback : null);
  const nick = view?.nickName || '—';

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={() => onClose()}
    >
      <div
        className="dialog admin-detail"
        role="dialog"
        aria-modal="true"
        aria-label="管理员详情"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-title">管理员详情</div>

        <div className="dialog-body">
          {loading && <p className="admin-detail-state">读取中…</p>}

          {!loading && !view && (
            <p className="admin-detail-state">{error || '读取失败'}</p>
          )}

          {!loading && view && (
            <>
              <div className="admin-detail-head">
                <span className="admin-detail-avatar">
                  {(nick[0] || '?').toUpperCase()}
                </span>
                <span className="admin-detail-name">
                  <strong>{nick}</strong>
                  <em>{view.userAccount || '—'}</em>
                </span>
              </div>

              <SysUserFields user={view} />

              {stale && (
                <p className="admin-detail-note">
                  最新数据读取失败（{error}），以上为登录时获取的信息。
                </p>
              )}
            </>
          )}
        </div>

        <div className="dialog-actions">
          <button
            type="button"
            className="dialog-ok"
            onClick={load}
            disabled={loading}
          >
            {loading ? '读取中…' : '刷新'}
          </button>
          <button type="button" className="admin-btn primary" onClick={() => onClose()}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
