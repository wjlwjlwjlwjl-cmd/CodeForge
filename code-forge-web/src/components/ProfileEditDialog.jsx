import { useEffect, useRef, useState } from 'react';
import { addInfo } from '../api/user.js';
import { handleApiError } from '../config.js';

// 字段长度上限：与后端 UserAddInfoDTO 的 @Length 保持一致
//   schoolName @Length(max=20)
//   majorName  @Length(max=20)
//   introduce  @Length(max=100)
// 后端 @Length 按 Java char（UTF-16 单元）计数，与 JS 的 str.length 语义一致
export const FIELD_LIMITS = {
  schoolName: 20,
  majorName: 20,
  introduce: 100,
};

// 编辑个人资料弹窗：学校 / 专业 / 自我介绍
export default function ProfileEditDialog({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    schoolName: user?.schoolName || '',
    majorName: user?.majorName || '',
    introduce: user?.introduce || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const firstRef = useRef(null);

  // 打开时聚焦第一个输入框；Esc 关闭
  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // 输入时即刻消除该字段的错误提示
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  // 与后端注解对齐的前端校验
  const validate = () => {
    const next = {};
    const school = form.schoolName.trim();
    const major = form.majorName.trim();
    const intro = form.introduce.trim();

    if (school.length > FIELD_LIMITS.schoolName) {
      next.schoolName = `学校名称不得超过 ${FIELD_LIMITS.schoolName} 个字符`;
    }
    if (major.length > FIELD_LIMITS.majorName) {
      next.majorName = `专业名称不得超过 ${FIELD_LIMITS.majorName} 个字符`;
    }
    if (intro.length > FIELD_LIMITS.introduce) {
      next.introduce = `自我介绍应在 ${FIELD_LIMITS.introduce} 字符内`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      // 后端是全量覆盖：未填的字段传空串（而非 undefined），语义明确
      await addInfo({
        schoolName: form.schoolName.trim(),
        majorName: form.majorName.trim(),
        introduce: form.introduce.trim(),
      });
      onSaved?.({
        schoolName: form.schoolName.trim(),
        majorName: form.majorName.trim(),
        introduce: form.introduce.trim(),
      });
    } catch (err) {
      // 3002 → 后端校验失败的提示；其他错误统一弹窗
      const msg = handleApiError(err, '保存失败，请稍后重试');
      if (msg !== null) setNotice(msg);
      setSubmitting(false);
    }
  };

  const introLeft = FIELD_LIMITS.introduce - form.introduce.length;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="编辑个人资料"
        onSubmit={handleSubmit}
      >
        <div className="modal-head">
          <h2 className="modal-title">编辑个人资料</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="关闭"
            onClick={() => onClose?.()}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <Field
            label="学校"
            hint="例如 Fudan University"
            value={form.schoolName}
            limit={FIELD_LIMITS.schoolName}
            error={errors.schoolName}
            inputRef={firstRef}
            onChange={(v) => setField('schoolName', v)}
          />
          <Field
            label="专业"
            hint="例如 CS"
            value={form.majorName}
            limit={FIELD_LIMITS.majorName}
            error={errors.majorName}
            onChange={(v) => setField('majorName', v)}
          />

          {/* 自我介绍：大编辑区 + 右下角字数 */}
          <div className="form-row">
            <label className="form-label" htmlFor="pe-introduce">
              自我介绍
            </label>
            <div className={`form-textarea-wrap ${errors.introduce ? 'has-error' : ''}`}>
              <textarea
                id="pe-introduce"
                className="form-textarea"
                rows={6}
                placeholder="介绍一下自己吧，比如擅长的语言、正在学的方向…"
                value={form.introduce}
                onChange={(e) => setField('introduce', e.target.value)}
              />
              <span
                className={`form-counter ${introLeft < 0 ? 'over' : ''}`}
                aria-live="polite"
              >
                {form.introduce.length} / {FIELD_LIMITS.introduce}
              </span>
            </div>
            {errors.introduce && (
              <p className="form-error">{errors.introduce}</p>
            )}
          </div>
        </div>

        <div className="modal-foot">
          <button
            type="button"
            className="modal-btn"
            onClick={() => onClose?.()}
            disabled={submitting}
          >
            取消
          </button>
          <button type="submit" className="modal-btn primary" disabled={submitting}>
            {submitting ? '保存中…' : '保存'}
          </button>
        </div>
      </form>

      {notice && (
        <div
          className="dialog-backdrop"
          style={{ zIndex: 90 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setNotice(null);
          }}
        >
          <div className="dialog" role="alertdialog">
            <div className="dialog-title">保存失败</div>
            <div className="dialog-body">{notice}</div>
            <div className="dialog-actions">
              <button type="button" className="dialog-ok" onClick={() => setNotice(null)}>
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 单行输入框（带右下角字数）
function Field({ label, hint, value, limit, error, onChange, inputRef }) {
  const id = `pe-${label}`;
  return (
    <div className="form-row">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div className={`form-input-wrap ${error ? 'has-error' : ''}`}>
        <input
          id={id}
          ref={inputRef}
          className="form-input"
          type="text"
          placeholder={hint}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className={`form-counter ${value.length > limit ? 'over' : ''}`}>
          {value.length} / {limit}
        </span>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
