import { DIFFICULTY } from '../config.js';

// 题目列表项：序号 + 题目名 + 难度标签（简单绿 / 中等橙 / 困难红）
// props: index(1 起，可选), id, title, difficulty, onClick
export default function ProblemItem({ index, id, title, difficulty, onClick }) {
  const diff = DIFFICULTY[difficulty] || { text: '未知', kind: 'muted' };

  return (
    <button type="button" className="problem-item" onClick={() => onClick?.(id)}>
      {index != null && <span className="problem-item-index">{index}</span>}
      <span className="problem-item-title">{title}</span>
      <span className={`difficulty-tag difficulty-${diff.kind}`}>{diff.text}</span>
    </button>
  );
}
