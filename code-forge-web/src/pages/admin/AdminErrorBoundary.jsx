import { Component } from 'react';
import { Notice } from './AdminBits.jsx';

// 后台渲染兜底
//
// React 遇到渲染期异常会把整棵树卸载掉 —— 表现就是「白屏」。
// 这里兜一层：任何子组件抛错都换成可恢复的提示，而不是整页空白。
// （只兜渲染期错误；事件回调里的错误由 event handler 自己 try/catch。）
//
// 用法：<AdminErrorBoundary key={section}>{...}</AdminErrorBoundary>
// 传 key 是为了换区块时自动重置。
export default class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // 留个痕迹，方便在控制台里定位
    console.error('[admin] 区块渲染出错:', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <>
        <h1 className="admin-h1">页面出错了</h1>
        <p className="admin-sub">当前区块渲染时抛了异常，可以重试或切到别的区块。</p>

        <section className="admin-section">
          <div className="admin-panel admin-panel-pad">
            <Notice kind="error">{error?.message || '未知错误'}</Notice>
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn primary"
                onClick={() => this.setState({ error: null })}
              >
                重试
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={() => window.location.reload()}
              >
                刷新页面
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }
}
