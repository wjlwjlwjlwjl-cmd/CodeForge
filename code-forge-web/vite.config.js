import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

// monaco-editor 的 marked.js 末尾带有一行指向不存在文件（marked.umd.js.map）的
// sourceMappingURL 注释，Vite dev 读取该文件时会尝试加载 source map 并报错。
// 这里只拦截这一个文件、仅移除那行注释，避免像之前那样接管全部 monaco 源码。
// 其他文件一律返回 null 交给 Vite 默认处理，保证不影响 worker 与模块图。
function stripMonacoMarkedSourceMap() {
  const TARGET = 'monaco-editor/esm/vs/base/common/marked/marked.js';
  return {
    name: 'strip-monaco-marked-sourcemap',
    enforce: 'pre',
    async load(id) {
      const filePath = id.split(/[?#]/)[0];
      if (!filePath.endsWith(TARGET)) return null;
      let code;
      try {
        code = await readFile(filePath, 'utf-8');
      } catch {
        return null;
      }
      return code.replace(/\/\/#\s*sourceMappingURL=.*$/gm, '');
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), stripMonacoMarkedSourceMap()],
  server: {
    port: 5173,
    host: true,
  },
  // monaco-editor 必须与 monaco-vim 共用同一个模块实例，
  // 否则 Vim 键位会注册到另一个 Monaco 实例上而失效。
  // 排除预构建，让二者走同一份 ESM 源码图。
  optimizeDeps: {
    exclude: ['monaco-editor', 'monaco-vim'],
  },
  resolve: {
    // monaco-vim 的 package.json exports 中 'browser' 条件指向 UMD 版本
    // （无 named export），会导致 import { initVimMode } 报错白屏。
    // 用 alias 强制指向 ESM 版本。
    alias: {
      'monaco-vim': fileURLToPath(
        new URL('./node_modules/monaco-vim/dist/index.mjs', import.meta.url)
      ),
    },
  },
});
