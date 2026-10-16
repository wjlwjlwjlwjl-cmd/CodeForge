import { useEffect, useState } from 'react';
import { addExam } from '../../api/admin.js';
import { Notice } from './AdminBits.jsx';

// 「新增竞赛」弹窗
//
//   POST /exam/b/add  参数 ExamAddDTO { title, startTime, endTime }
//
// 前端把后端 ExamService#examAdd 的校验原样搬过来先做一遍（省一次往返）：
//   · 开始时间早于当前时间 → 3201「竞赛开始时间不能早于当前时间」
//   · 开始时间晚于结束时间 → 3202「竞赛开始时间不能晚于竞赛结束时间」
// 另外补两条后端没做、但直接落库会有问题的：
//   · 标题非空（后端没有 @NotBlank，空标题也能入库）
//   · 标题 ≤ 100（tb_exam.title 是 varchar(100)，超长会被 MySQL 拒掉、只报「服务繁忙」）
//
// 新建出来的竞赛 status = 0（未发布），要点了「发布」C 端才看得到。
const TITLE_MAX = 100;

// Date → <input type="datetime-local"> 需要的 "YYYY-MM-DDTHH:mm"
function toInputValue(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

// 默认给个能直接提交的区间：明天 09:00 ~ 后天 21:00（与库里现有竞赛时段一致）
function defaultForm() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(21, 0, 0, 0);
  return { title: '', startTime: toInputValue(start), endTime: toInputValue(end) };
}

function validate(form) {
  const title = form.title.trim();
  if (!title) return '竞赛标题不能为空';
  if (form.title.length > TITLE_MAX) {
    return `竞赛标题不能超过 ${TITLE_MAX} 个字符`;
  }
  if (!form.startTime) return '请选择开始时间';
  if (!form.endTime) return '请选择结束时间';

  const start = new Date(form.startTime).getTime();
  const end = new Date(form.endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return '时间格式不正确';

  // 与后端一致，且都是「不能早于 / 不能晚于」的严格比较（相等是允许的）
  if (start < Date.now()) return '竞赛开始时间不能早于当前时间';
  if (start > end) return '竞赛开始时间不能晚于竞赛结束时间';
  return '';
}

export default function AdminExamDialog({ onClose, onSaved }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((p) => ({ ...p, [key]: value }));
    setError(null);
  };

  const submit = async () => {
    if (saving) return;
    const msg = validate(form);
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const title = form.title.trim();
      await addExam({
        title,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      onSaved?.({ title });
    } catch (e) {
      // 3201 / 3202 等后端校验仍然以它为准（例如刚好卡在当前时间上）
      setError(e?.message || '添加失败');
    } finally {
      setSaving(false);
    }
  };

  const nowInput = toInputValue(new Date());

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="dialog admin-exam-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="新增竞赛"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-title">新增竞赛</div>

        <div className="admin-q-body">
          <div className="admin-field">
            <label htmlFor="exam-title">
              <span>
                竞赛标题 <em className="admin-q-req">*</em>
              </span>
              <span
                className={`admin-q-count${
                  form.title.length > TITLE_MAX ? ' is-over' : ''
                }`}
              >
                {form.title.length} / {TITLE_MAX}
              </span>
            </label>
            <input
              id="exam-title"
              className="admin-input w-lg"
              type="text"
              placeholder="如：入门周·算术与输入输出"
              value={form.title}
              onChange={set('title')}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="exam-start">
              <span>
                开始时间 <em className="admin-q-req">*</em>
              </span>
            </label>
            <input
              id="exam-start"
              className="admin-input w-lg"
              type="datetime-local"
              min={nowInput}
              value={form.startTime}
              onChange={set('startTime')}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="exam-end">
              <span>
                结束时间 <em className="admin-q-req">*</em>
              </span>
            </label>
            <input
              id="exam-end"
              className="admin-input w-lg"
              type="datetime-local"
              min={form.startTime || nowInput}
              value={form.endTime}
              onChange={set('endTime')}
            />
          </div>

          {error && <Notice kind="error">{error}</Notice>}
        </div>

        <div className="dialog-actions">
          <button
            type="button"
            className="dialog-ok"
            onClick={onClose}
            disabled={saving}
          >
            取消
          </button>
          <button
            type="button"
            className="admin-btn primary"
            onClick={submit}
            disabled={saving}
          >
            {saving ? '提交中…' : '添加'}
          </button>
        </div>
      </div>
    </div>
  );
}
