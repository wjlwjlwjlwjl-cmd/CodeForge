import { useEffect, useState } from 'react';
import { addQuestion, editQuestion, fetchQuestionDetail } from '../../api/admin.js';
import { toast } from './AdminToast.jsx';

// B 端「新增题目 / 编辑题目」弹窗
//
//   GET  /question/detail?id=  → QuestionDetailVO（编辑时先拉详情回填）
//   POST /question/b/add       → AddQuestionDTO，8 个字段全部必填
//   POST /question/b/edit      → QuestionEditDTO，id 必填 + 其余字段
//
// 长度上限按数据库列宽来（超长会被 MySQL 拒掉、后端只报「服务繁忙」，很难查）：
//   tb_question.title varchar(100) / content varchar(1000) /
//   question_case varchar(1000) / default_code varchar(500) / main_fuc text
//
// 单位沿用 C 端展示口径：timeLimit 毫秒（ms）、spaceLimit KB。
const LIMITS = {
  title: 100,
  content: 1000,
  questionCase: 1000,
  defaultCode: 500,
};

const DEFAULT_FORM = {
  title: '',
  difficulty: '1',
  timeLimit: '1000',
  spaceLimit: '65536',
  content: '',
  questionCase: '',
  defaultCode: '',
  mainFuc: '',
};

const DIFFICULTY_OPTIONS = [
  { value: '1', label: '简单' },
  { value: '2', label: '中等' },
  { value: '3', label: '困难' },
];

// 详情 → 表单（数字转字符串，方便输入框里出现空值）
function toForm(d) {
  return {
    title: d?.title ?? '',
    difficulty: d?.difficulty == null ? '1' : String(d.difficulty),
    timeLimit: d?.timeLimit == null ? '' : String(d.timeLimit),
    spaceLimit: d?.spaceLimit == null ? '' : String(d.spaceLimit),
    content: d?.content ?? '',
    questionCase: d?.questionCase ?? '',
    defaultCode: d?.defaultCode ?? '',
    mainFuc: d?.mainFuc ?? '',
  };
}

// 校验规则与后端 DTO 注解保持一致（AddQuestionDTO 全 @NotBlank / @NotNull / 难度 @Min(1)@Max(3)）
function validate(form) {
  if (!form.title.trim()) return '题目标题不能为空';
  if (form.title.length > LIMITS.title) {
    return `题目标题不能超过 ${LIMITS.title} 个字符`;
  }
  if (!DIFFICULTY_OPTIONS.some((o) => o.value === form.difficulty)) {
    return '难度只能是 简单 / 中等 / 困难';
  }
  const nums = [
    ['timeLimit', '时间限制'],
    ['spaceLimit', '空间限制'],
  ];
  for (const [key, label] of nums) {
    const raw = form[key].trim();
    const n = Number(raw);
    if (!raw || !Number.isInteger(n) || n <= 0) {
      return `${label}必须是大于 0 的整数`;
    }
  }
  const texts = [
    ['content', '题目描述'],
    ['questionCase', '测试用例'],
    ['defaultCode', '默认代码'],
    ['mainFuc', '主函数'],
  ];
  for (const [key, label] of texts) {
    if (!form[key].trim()) return `${label}不能为空`;
    if (LIMITS[key] && form[key].length > LIMITS[key]) {
      return `${label}不能超过 ${LIMITS[key]} 个字符`;
    }
  }
  return '';
}

function CharCount({ value, limit }) {
  if (!limit) return null;
  const over = value.length > limit;
  return (
    <span className={`admin-q-count${over ? ' is-over' : ''}`}>
      {value.length} / {limit}
    </span>
  );
}

export default function AdminQuestionDialog({ mode, id, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    setLoading(true);
    fetchQuestionDetail(id)
      .then((d) => {
        if (!cancelled) setForm(toForm(d));
      })
      .catch((e) => {
        if (!cancelled) toast.error(e?.message || '题目详情加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, id]);

  // Esc 关闭（AdminApp 的收起导航也会让路，见那边的 dialog 判断）
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
  };

  const submit = async () => {
    if (saving || loading) return;
    const msg = validate(form);
    if (msg) {
      toast.info(msg);
      return;
    }
    const payload = {
      title: form.title.trim(),
      difficulty: Number(form.difficulty),
      timeLimit: Number(form.timeLimit.trim()),
      spaceLimit: Number(form.spaceLimit.trim()),
      content: form.content,
      questionCase: form.questionCase,
      defaultCode: form.defaultCode,
      mainFuc: form.mainFuc,
    };

    setSaving(true);
    try {
      // 后端返回的文案是「添加成功，题目编号：108」这种带自增 id 的，
      // 界面上不用它（id 对使用的人没意义），把标题交给页面去拼提示
      if (isEdit) await editQuestion({ id: Number(id), ...payload });
      else await addQuestion(payload);
      onSaved?.({ mode: isEdit ? 'edit' : 'add', title: payload.title });
    } catch (e) {
      toast.error(e?.message || (isEdit ? '保存失败' : '添加失败'));
    } finally {
      setSaving(false);
    }
  };

  // 标题不带题目 id：id 是数据库自增主键，界面上没有展示的必要
  const title = isEdit ? '编辑题目' : '新增题目';

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="dialog admin-q-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-title">{title}</div>

        <div className="admin-q-body">
          {loading ? (
            <p className="admin-detail-state">读取中…</p>
          ) : (
            <>
              <div className="admin-field">
                <label htmlFor="q-title">
                  <span>
                    题目标题 <em className="admin-q-req">*</em>
                  </span>
                  <CharCount value={form.title} limit={LIMITS.title} />
                </label>
                <input
                  id="q-title"
                  className="admin-input w-lg"
                  type="text"
                  placeholder="如：两数之和"
                  value={form.title}
                  onChange={set('title')}
                />
              </div>

              <div className="admin-q-row">
                <div className="admin-field">
                  <label htmlFor="q-difficulty">
                    <span>
                      难度 <em className="admin-q-req">*</em>
                    </span>
                  </label>
                  <select
                    id="q-difficulty"
                    className="admin-select"
                    value={form.difficulty}
                    onChange={set('difficulty')}
                  >
                    {DIFFICULTY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label htmlFor="q-time">
                    <span>
                      时间限制 <em className="admin-q-req">*</em>
                    </span>
                    <span className="admin-q-unit">ms</span>
                  </label>
                  <input
                    id="q-time"
                    className="admin-input w-lg"
                    type="text"
                    inputMode="numeric"
                    value={form.timeLimit}
                    onChange={set('timeLimit')}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="q-space">
                    <span>
                      空间限制 <em className="admin-q-req">*</em>
                    </span>
                    <span className="admin-q-unit">KB</span>
                  </label>
                  <input
                    id="q-space"
                    className="admin-input w-lg"
                    type="text"
                    inputMode="numeric"
                    value={form.spaceLimit}
                    onChange={set('spaceLimit')}
                  />
                </div>
              </div>

              <div className="admin-field">
                <label htmlFor="q-content">
                  <span>
                    题目描述 <em className="admin-q-req">*</em>
                  </span>
                  <CharCount value={form.content} limit={LIMITS.content} />
                </label>
                <textarea
                  id="q-content"
                  className="admin-textarea"
                  rows={6}
                  placeholder={'题目描述：\n…\n\n示例 1：\n输入：…\n输出：…'}
                  value={form.content}
                  onChange={set('content')}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="q-case">
                  <span>
                    测试用例 <em className="admin-q-req">*</em>
                  </span>
                  <CharCount value={form.questionCase} limit={LIMITS.questionCase} />
                </label>
                <textarea
                  id="q-case"
                  className="admin-textarea"
                  rows={4}
                  placeholder="判题用的输入 / 期望输出"
                  value={form.questionCase}
                  onChange={set('questionCase')}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="q-default">
                  <span>
                    默认代码 <em className="admin-q-req">*</em>
                  </span>
                  <CharCount value={form.defaultCode} limit={LIMITS.defaultCode} />
                </label>
                <textarea
                  id="q-default"
                  className="admin-textarea mono"
                  rows={5}
                  placeholder="编辑器里预填的代码"
                  value={form.defaultCode}
                  onChange={set('defaultCode')}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="q-main">
                  <span>
                    主函数 <em className="admin-q-req">*</em>
                  </span>
                </label>
                <textarea
                  id="q-main"
                  className="admin-textarea mono"
                  rows={4}
                  placeholder="判题时拼在用户代码后面的 main"
                  value={form.mainFuc}
                  onChange={set('mainFuc')}
                />
              </div>

            </>
          )}
        </div>

        <div className="dialog-actions">
          <button
            type="button"
            className="dialog-ok"
            onClick={() => onClose()}
            disabled={saving}
          >
            取消
          </button>
          <button
            type="button"
            className="admin-btn primary"
            onClick={submit}
            disabled={saving || loading}
          >
            {saving ? '保存中…' : isEdit ? '保存' : '添加'}
          </button>
        </div>
      </div>
    </div>
  );
}
