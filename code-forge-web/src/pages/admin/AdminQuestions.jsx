import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteQuestion } from '../../api/admin.js';
import { useAdminPagedList } from '../../hooks/useAdminPagedList.js';
import { toast } from './AdminToast.jsx';
import { useAdminQuestionSource } from '../../hooks/useAdminQuestionSource.js';
import {
  ConfirmDialog,
  DIFFICULTY_LEVELS,
  DifficultyTag,
  EmptyState,
} from './AdminBits.jsx';
import AdminQuestionDialog from './AdminQuestionDialog.jsx';
import { adminNameOf, useAdminNameMap } from '../../hooks/useAdminNameMap.js';
import { formatDateTime } from '../../utils/format.js';

// B 端题目管理
//   GET    /question/list?pageNum=      → 分页题目列表（QuestionVO）
//   GET    /question/search/filter?keyword=&difficulty=&pageNum=
//                                       → 关键字（+可选难度）搜索，结构同上
//   GET    /question/detail?id=         → 题目详情（编辑时回填）
//   POST   /question/b/add              → 新增
//   POST   /question/b/edit             → 修改
//   DELETE /question/b/delete/{id}      → 删除
//
// 列表里不展示题目 id（数据库自增主键，对使用的人没有意义；它只在接口参数
// 和 React key 里用到），列表靠标题认题。
//
// 列表形态与用户管理一致 = 「区内无限滚动」：区域高度有上限（admin.css 的
// .admin-scroll-area），在区域里向下滚到底就自动拉下一页追加；
// 不是整页无限下拉，也不是上一页/下一页翻页。
//
// 新增 / 修改 / 删除成功后都重新从第 1 页拉：
//   - 后端 add/edit/delete 都会失效 question:list:page:* 缓存，重拉拿到的才是新数据
//   - 删除会让后面所有页的偏移整体前移，就地删一行会让后续分页错位、出现漏项
const SCROLL_EDGE = 80;

// 创建 / 更新 两格：上排是操作人昵称，下排是时间；两样都没有就一个「—」
function AuditCell({ by, time, names }) {
  const name = adminNameOf(names, by);
  const at = formatDateTime(time);
  if (!name && at === '—') return <span className="admin-muted">—</span>;
  return (
    <span className="admin-audit">
      <span className="admin-audit-name">{name || '—'}</span>
      <span className="admin-audit-time">{at}</span>
    </span>
  );
}

export default function AdminQuestions() {
  // null | { mode: 'add' } | { mode: 'edit', id }
  const [dialog, setDialog] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const areaRef = useRef(null);
  // createBy / updateBy 是用户 ID，翻成管理员昵称再展示
  const names = useAdminNameMap();

  // 搜索：input 是输入框里正在敲的，search 是「已生效」的条件
  const [input, setInput] = useState('');
  const [search, setSearch] = useState({ keyword: '', difficulty: null });
  // 本地筛选模式下翻到 /question/list 第几页了
  const cursorRef = useRef(0);

  const searching = search.keyword !== '' || search.difficulty != null;
  // 三种数据源：关键字搜索 / 仅难度（本地筛） / 普通分页
  const mode = search.keyword ? 'search' : search.difficulty != null ? 'local' : 'list';
  // 取数逻辑与「为竞赛添加题目」弹窗共用同一个 hook
  const fetchPage = useAdminQuestionSource(search, cursorRef);

  const {
    items,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadNext,
    reload,
  } = useAdminPagedList(
    fetchPage,
    `${mode}\u0000${search.keyword}\u0000${search.difficulty ?? ''}`
  );

  // 内容不足一屏时自动再拉一页（否则没有滚动条，就永远触发不了滚动加载）
  useEffect(() => {
    if (loading || loadingMore || !hasMore || error) return;
    const el = areaRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 4) loadNext();
  }, [items, loading, loadingMore, hasMore, error, loadNext]);

  const onScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_EDGE) {
        loadNext();
      }
    },
    [loadNext]
  );

  const submitSearch = (e) => {
    e.preventDefault();
    setSearch((s) => ({ ...s, keyword: input.trim() }));
  };

  // 点难度：立刻生效（和 C 端一致），顺带把输入框里已敲的关键字一起带上
  const applyDifficulty = (d) => {
    setSearch({ keyword: input.trim(), difficulty: d });
  };

  const resetSearch = () => {
    setInput('');
    setSearch({ keyword: '', difficulty: null });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      // 后端返回的是「题目 108 删除成功」（带自增 id），这里自己按标题拼
      await deleteQuestion(pendingDelete.id);
      toast.success(`已删除题目「${pendingDelete.title || ''}」`);
      setPendingDelete(null);
      reload();
    } catch (e) {
      toast.error(e?.message || '删除失败');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // 新增 / 编辑成功后统一按题目标题提示（见 AdminQuestionDialog 的 onSaved）
  const handleSaved = ({ mode, title }) => {
    setDialog(null);
    toast.success(`${mode === 'edit' ? '已保存' : '已添加'}题目「${title}」`);
    reload();
  };

  return (
    <>
      <h1 className="admin-h1">题目管理</h1>
      <p className="admin-sub">题库的增删改查，题目描述与测试用例直接编辑。</p>

      <section className="admin-section">
        <form className="admin-toolbar" onSubmit={submitSearch}>
          <span className="admin-search">
            <input
              className="admin-input w-md"
              type="text"
              placeholder="搜索题目标题…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {input && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setInput('')}
                title="清空输入"
                aria-label="清空输入"
              >
                ×
              </button>
            )}
          </span>
          <button type="submit" className="admin-btn primary" disabled={loading}>
            搜索
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={resetSearch}
            disabled={!searching && !input}
          >
            重置
          </button>

          <span className="admin-chips">
            <button
              type="button"
              className={`admin-chip${search.difficulty == null ? ' is-active' : ''}`}
              onClick={() => applyDifficulty(null)}
            >
              全部
            </button>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                type="button"
                className={`admin-chip is-${DIFFICULTY_LEVELS[d].kind}${
                  search.difficulty === d ? ' is-active' : ''
                }`}
                onClick={() => applyDifficulty(d)}
              >
                {DIFFICULTY_LEVELS[d].text}
              </button>
            ))}
          </span>

          <span className="admin-toolbar-spacer" />

          <button
            type="button"
            className="admin-btn primary"
            onClick={() => setDialog({ mode: 'add' })}
          >
            新增题目
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={reload}
            disabled={loading}
          >
            刷新
          </button>
        </form>

        <div className="admin-panel">
          {/* 列表区：高度有上限，区内滚动加载 */}
          <div className="admin-scroll-area" ref={areaRef} onScroll={onScroll}>
            <table className="admin-table admin-table-questions">
              <thead>
                <tr>
                  <th>标题</th>
                  <th style={{ width: 90 }}>难度</th>
                  <th style={{ width: 110 }}>时间限制</th>
                  <th style={{ width: 110 }}>空间限制</th>
                  <th style={{ width: 152 }}>创建</th>
                  <th style={{ width: 152 }}>更新</th>
                  <th className="col-actions">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((q) => {
                  return (
                    <tr key={q.id}>
                      <td className="cell-ellipsis" title={q.title || ''}>
                        {q.title || '—'}
                      </td>
                      <td>
                        <DifficultyTag level={q.difficulty} />
                      </td>
                      <td className="col-num col-muted">
                        {q.timeLimit == null ? '—' : `${q.timeLimit} ms`}
                      </td>
                      <td className="col-num col-muted">
                        {q.spaceLimit == null ? '—' : `${q.spaceLimit} KB`}
                      </td>
                      <td className="col-audit">
                        <AuditCell by={q.createBy} time={q.createTime} names={names} />
                      </td>
                      <td className="col-audit">
                        <AuditCell by={q.updateBy} time={q.updateTime} names={names} />
                      </td>
                      <td className="col-actions">
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-btn"
                            onClick={() => setDialog({ mode: 'edit', id: q.id })}
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            className="admin-btn danger"
                            onClick={() => setPendingDelete(q)}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {loading && <EmptyState>加载中…</EmptyState>}
            {!loading && !items.length && !error && (
              <EmptyState>{searching ? '没有匹配的题目' : '暂无数据'}</EmptyState>
            )}
            {!loading && !items.length && error && (
              <EmptyState>
                {error}
                <button type="button" className="admin-btn link" onClick={reload}>
                  重试
                </button>
              </EmptyState>
            )}

            {loadingMore && <div className="admin-list-more">加载中…</div>}
            {!loading && !loadingMore && !hasMore && items.length > 0 && (
              <div className="admin-list-more">已加载全部 {items.length} 题</div>
            )}
            {!loading && items.length > 0 && error && (
              <div className="admin-list-more is-error">
                {error}
                <button type="button" className="admin-btn link" onClick={reload}>
                  重试
                </button>
              </div>
            )}
          </div>

          <div className="admin-listfoot">
            <span>
              {/* 本地筛难度时后端给不出匹配总数，就只报已加载多少 */}
              {total != null && (
                <>
                  {searching ? '匹配' : '共'}{' '}
                  <span className="admin-num">{total}</span> 题，
                </>
              )}
              已加载 <span className="admin-num">{items.length}</span> 题
            </span>
          </div>
        </div>
      </section>

      {dialog && (
        <AdminQuestionDialog
          mode={dialog.mode}
          id={dialog.id}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="删除题目"
          body={`确定删除题目「${pendingDelete.title || ''}」吗？该操作不可撤销。`}
          confirmText="删除"
          danger
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
