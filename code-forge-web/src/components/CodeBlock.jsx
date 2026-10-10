import { useState } from 'react';
import Editor from '@monaco-editor/react';

// 只读 + 高亮代码块：高度随代码内容自动撑开
export default function CodeBlock({ code, language, theme, fontSize }) {
  const [height, setHeight] = useState(120);

  const handleMount = (editor) => {
    const update = () => setHeight(editor.getContentHeight());
    update();
    editor.onDidContentSizeChange(update);
  };

  return (
    <Editor
      height={height}
      language={language}
      theme={theme}
      value={code}
      onMount={handleMount}
      options={{
        readOnly: true,
        domReadOnly: true,
        minimap: { enabled: false },
        fontSize,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        wordWrap: 'off',
        overviewRulerLanes: 0,
        renderLineHighlight: 'none',
        contextmenu: false,
        folding: false,
        glyphMargin: false,
        scrollbar: {
          vertical: 'hidden',
          horizontal: 'auto',
          handleMouseWheel: false,
          alwaysConsumeMouseWheel: false,
        },
        padding: { top: 12, bottom: 12 },
      }}
    />
  );
}