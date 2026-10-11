// 提交时间：后端返回 ISO 字符串（如 2026-10-09T18:18:03）→ 2026-10-09 18:18:03
export function formatDateTime(t) {
  if (!t) return '—';
  return String(t).replace('T', ' ').slice(0, 19);
}

// 日期（中文）：2026-10-11T15:59:39 → 2026年10月11日
export function formatDateCN(t) {
  if (!t) return 'N/A';
  const s = String(t).slice(0, 10); // yyyy-MM-dd
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return 'N/A';
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`;
}

// 【提交记录/提交详情】执行用时：只有「通过」(pass===4) 且有值才展示，否则 N/A
// 参数是 (pass, runTime) —— 传错参数会直接显示错数字，注意别用成 formatJudgeRuntime
export function formatRunTime(pass, runTime) {
  if (pass === 4 && runTime != null) return `${runTime} ms`;
  return 'N/A';
}

// 【判题结果页】运行时间：后端已判定本次运行，有值即展示
// 注意只接收 runTime 一个参数（与 formatRunTime 区分）
export function formatJudgeRuntime(runTime) {
  return runTime != null ? `${runTime} ms` : 'N/A';
}

// 无数据占位
// 注：N/A 是本项目统一的「无数据」展示文案
export const NA = 'N/A';

// 统计计数（通过数 / 总提交数）
// 合法（可转为非负数字）则返回整数字符串，否则 N/A
export function formatStatCount(v) {
  if (v == null || v === '') return NA;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return NA;
  return String(Math.trunc(n));
}

// 通过率
// 后端 /user/submitInfo 返回的是「比值」字符串（如 "0.20" 表示 20%），
// 这里统一转成百分数展示。
// 返回 { text, percent }；无法解析时 text = 'N/A'，percent = null
//   - text    ：展示文案，如 "20.00%" 或 "N/A"
//   - percent ：0~100 的数字，用于进度条（不可用时为 null）
export function formatPassRate(v) {
  if (v == null || v === '') return { text: NA, percent: null };
  const raw = Number(String(v).replace('%', '').trim());
  if (!Number.isFinite(raw) || raw < 0) return { text: NA, percent: null };

  // <=1 视为比值（0.20 → 20%）；>1 视为已经是百分数（20 → 20%）
  const percent = raw <= 1 ? raw * 100 : raw;
  return {
    text: `${percent.toFixed(2)}%`,
    percent: Math.min(100, percent),
  };
}