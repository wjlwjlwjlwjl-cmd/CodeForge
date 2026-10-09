import { useMemo } from 'react';
import MarkdownIt from 'markdown-it';

// 轻量 markdown 渲染：标题、段落、列表、代码块、行内 code、加粗/斜体、链接、表格
const md = new MarkdownIt({
  html: false, // 禁用原始 HTML，避免 XSS
  linkify: true,
  breaks: false,
});

export default function MarkdownRenderer({ content }) {
  const html = useMemo(() => {
    if (!content) return '';
    return md.render(content);
  }, [content]);

  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
