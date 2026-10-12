import React from 'react';
import ReactDOM from 'react-dom/client';
import './monaco-setup.js';
import App from './App.jsx';
import { guardRoute } from './routeGuard.js';
import './styles/theme.css';

// 先做路由守卫（未登录跳登录页；已登录访问登录页则跳走）。
// 放在 render 之前，这样不会先画出页面内容再跳转（避免闪一下）。
if (guardRoute()) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
