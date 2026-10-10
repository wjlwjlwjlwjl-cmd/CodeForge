// 提交时间：后端返回 ISO 字符串（如 2026-10-09T18:18:03）→ 2026-10-09 18:18:03
export function formatDateTime(t) {
  if (!t) return '—';
  return String(t).replace('T', ' ').slice(0, 19);
}

// 执行用时：仅「通过」展示，其余为 N/A
export function formatRunTime(pass, runTime) {
  if (pass === 4 && runTime != null) return `${runTime} ms`;
  return 'N/A';
}

// 运行时间（判题结果）：有值则 xxx ms，否则 N/A
export function formatRuntime(runTime) {
  return runTime != null ? `${runTime} ms` : 'N/A';
}