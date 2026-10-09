export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      title={isDark ? '切换到亮色' : '切换到暗色'}
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  );
}
