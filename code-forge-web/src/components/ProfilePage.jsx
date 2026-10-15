import { useEffect, useMemo, useRef, useState } from 'react';
import AppHeader from './AppHeader.jsx';
import ProfileEditDialog from './ProfileEditDialog.jsx';
import StatCard from './StatCard.jsx';
import { useProfileData } from '../hooks/useProfileData.js';
import { useRecentSubmissions } from '../hooks/useRecentSubmissions.js';
import { useMyExamList } from '../hooks/useExam.js';
import { useExamRanks, rankText, rankTimeText } from '../hooks/useExamRank.js';
import { useAvatar } from '../hooks/useAvatar.js';
import { uploadAvatar } from '../api/user.js';
import {
  PASS_STATUS,
  handleApiError,
  AVATAR_MAX_SIZE,
  AVATAR_ALLOW_MIME,
  AVATAR_MIN_EDGE,
  AVATAR_MAX_EDGE,
} from '../config.js';
import { formatDateCN, formatDateTime, formatRunTime } from '../utils/format.js';

// 用户主页（个人中心）：类个人博客的两栏布局
//   左上：头像 + 个人信息（GET /user/detail）
//   右上：提交信息（通过数 / 通过率 / 总提交数）
//   右下：最近提交（分页 + 无限滚动，固定 10 条高）
export default function ProfilePage({
  theme,
  onToggleTheme,
  themeMode,
  onThemeModeChange,
  onLogout,
  onOpenEditor,
  onBackHome,
}) {
  const { user, stats, loading, reload, patchUser } = useProfileData();
  const [editing, setEditing] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  // 头像与顶栏共用同一份（全局 store，异步、会话内复用）
  useAvatar({ load: true });

  // 保存成功：先本地回显，再静默对齐服务端
  const handleSaved = (patch) => {
    patchUser(patch);
    setEditing(false);
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1800);
    reload({ silent: true });
  };

  return (
    <div className="home-page">
      <AppHeader
        theme={theme}
        onToggleTheme={onToggleTheme}
        user={user}
        onLogout={onLogout}
        onBrandClick={onBackHome}
        onProfile={() => {}}
        themeMode={themeMode}
        onThemeModeChange={onThemeModeChange}
        navItems={[]}
      />

      <main className="home-main">
        <div className="home-inner">
          <div className="profile-layout">
            {/* 左：头像 + 个人信息 */}
            <aside className="profile-side">
              <ProfileCard
                user={user}
                loading={loading}
                savedTick={savedTick}
                onEdit={() => setEditing(true)}
              />
            </aside>

            {/* 右：提交信息 + 竞赛排名 + 最近提交 */}
            <div className="profile-main">
              <StatsRow stats={stats} />
              <ContestRanks />
              <RecentSubmissions onOpenEditor={onOpenEditor} />
            </div>
          </div>
        </div>
      </main>

      {editing && (
        <ProfileEditDialog
          user={user}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

/* ---------------- 左侧：头像与个人信息 ---------------- */
function ProfileCard({ user, loading, onEdit, savedTick }) {
  const { avatarUrl, ensureAvatar } = useAvatar();
  const [avatarError, setAvatarError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState(null);
  const fileRef = useRef(null);

  const nick = user?.nickName || user?.email || '—';
  const initial = (nick.trim()[0] || '?').toUpperCase();
  const showImg = avatarUrl && !avatarError;

  // 头像地址变化（上传成功拿到新的预签名 url）时重新尝试加载
  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  // 点相机图标 → 打开系统文件选择框
  const handlePickAvatar = () => {
    if (uploading) return;
    fileRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // 清空，保证再次选同一个文件也会触发 change
    e.target.value = '';
    if (!file) return;

    // 前端先做一遍和后端一致的校验，避免无谓的上传
    const invalid = await validateAvatarFile(file);
    if (invalid) {
      setNotice({ title: '图片不符合要求', body: invalid });
      return;
    }

    setUploading(true);
    try {
      await uploadAvatar(file);
      // 重新取预签名 url：新的 Expires/Signature 会绕开浏览器对旧图的缓存
      await ensureAvatar({ force: true });
      setNotice({ title: '头像已更新', body: '新头像已保存成功。' });
    } catch (err) {
      // 超过 multipart 上限时后端返回 2000，这里给出更具体的提示
      if (err?.code === 2000) {
        setNotice({ title: '上传失败', body: '图片过大，请压缩到 2MB 以内后重试' });
      } else {
        const msg = handleApiError(err, '头像上传失败，请稍后重试');
        if (msg !== null) setNotice({ title: '上传失败', body: msg });
      }
    } finally {
      setUploading(false);
    }
  };

  const rows = [
    { label: '昵称', value: user?.nickName },
    { label: '邮箱', value: user?.email },
    { label: '性别', value: sexText(user?.sex) },
    { label: '学校', value: user?.schoolName },
    { label: '专业', value: user?.majorName },
    { label: '个人介绍', value: user?.introduce },
  ];

  return (
    <div className="profile-card">
      <div className="profile-avatar-wrap">
        <div className={`profile-avatar${showImg ? ' has-img' : ''}`}>
          {showImg ? (
            <img src={avatarUrl} alt={nick} onError={() => setAvatarError(true)} />
          ) : (
            <span className="profile-avatar-initial">{initial}</span>
          )}
        </div>

        {/* 悬浮在头像上的相机按钮：hover / 键盘聚焦时浮现 */}
        <button
          type="button"
          className={`profile-avatar-edit${uploading ? ' is-uploading' : ''}`}
          onClick={handlePickAvatar}
          disabled={uploading}
          aria-label={uploading ? '正在上传头像' : '更新头像'}
        >
          {uploading ? (
            <span className="profile-avatar-spinner" aria-hidden="true" />
          ) : (
            <CameraIcon />
          )}
          <span className="profile-avatar-tip" aria-hidden="true">
            {uploading ? '上传中…' : '更新头像'}
          </span>
        </button>

        {/* 隐藏的文件选择框 */}
        <input
          ref={fileRef}
          type="file"
          className="profile-avatar-input"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />
      </div>

      <div className="profile-nick">{loading ? '…' : nick}</div>

      <dl className="profile-info">
        {rows.map((r) => (
          <div className="profile-info-row" key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value || '—'}</dd>
          </div>
        ))}
      </dl>

      <button type="button" className="profile-edit-btn" onClick={onEdit}>
        {savedTick ? '已保存 ✓' : '编辑个人资料'}
      </button>

      {notice && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setNotice(null)}>
          <div
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-title">{notice.title}</div>
            <div className="dialog-body">{notice.body}</div>
            <div className="dialog-actions">
              <button type="button" className="dialog-ok" onClick={() => setNotice(null)}>
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 相机图标
function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.6A2.6 2.6 0 0 1 5.6 6h1.1a1 1 0 0 0 .84-.46l.9-1.34A1 1 0 0 1 9.28 3.6h5.44a1 1 0 0 1 .84.46l.9 1.34A1 1 0 0 0 17.3 6h1.1A2.6 2.6 0 0 1 21 8.6v9A2.6 2.6 0 0 1 18.4 20.2H5.6A2.6 2.6 0 0 1 3 17.6z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}

// 与后端 UserService#avatarUpload 完全对齐的前端校验
// 返回错误文案（null 表示通过）
async function validateAvatarFile(file) {
  // 1) 类型：CommonConstants.ALLOW_MIME
  if (!AVATAR_ALLOW_MIME.includes(file.type)) {
    return '仅支持 JPG / JPEG / PNG / WebP 格式的图片';
  }
  // 2) 大小：CommonConstants.MAX_SIZE（同时受 multipart 2MB 限制）
  if (file.size > AVATAR_MAX_SIZE) {
    return '图片过大，请上传 2MB 以内的图片';
  }
  // 3) 宽高：均需在 200 ~ 2000 之间
  const size = await readImageSize(file);
  if (!size) return '图片无法解析，请换一张图片试试';
  const { width, height } = size;
  const bad =
    width < AVATAR_MIN_EDGE ||
    height < AVATAR_MIN_EDGE ||
    width > AVATAR_MAX_EDGE ||
    height > AVATAR_MAX_EDGE;
  if (bad) {
    return `图片尺寸需在 ${AVATAR_MIN_EDGE}×${AVATAR_MIN_EDGE} ~ ${AVATAR_MAX_EDGE}×${AVATAR_MAX_EDGE} 之间（当前 ${width}×${height}）`;
  }
  return null;
}

// 读取本地图片的原始宽高
function readImageSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function sexText(sex) {
  if (sex === 1) return '男';
  if (sex === 2) return '女';
  if (sex === 0) return '女';
  return null;
}

/* ---------------- 右上：提交信息 ---------------- */
function StatsRow({ stats }) {
  const cards = [
    { label: '通过数', value: stats?.passSum ?? 'N/A', hint: 'AC 提交次数' },
    {
      label: '通过率',
      value: stats?.passRate ?? 'N/A',
      hint: '通过数 / 总提交数',
      accent: true,
      progress: stats?.passRatePercent ?? null,
    },
    { label: '总提交数', value: stats?.submitSum ?? 'N/A', hint: '累计提交次数' },
  ];

  return (
    <div className="stat-grid">
      {cards.map((c) => (
        <StatCard
          key={c.label}
          label={c.label}
          value={c.value}
          hint={c.hint}
          accent={c.accent}
          progress={c.progress}
        />
      ))}
    </div>
  );
}

/* ---------------- 竞赛排名 ---------------- */
// 名次来自 GET /job/exam/rank?examId=，后端给的是「查询这一刻」的值，
// 所以这里按 30 秒轮询刷新（多个竞赛并行请求，单个失败不影响其它）。
function ContestRanks() {
  const { items, loading: examsLoading } = useMyExamList(true);
  const examIds = useMemo(
    () => items.map((e) => String(e.examId)),
    [items]
  );
  const { ranks, updatedAt, loading: rankLoading } = useExamRanks(examIds, {
    enabled: examIds.length > 0,
  });

  return (
    <section className="profile-ranks">
      <div className="section-head">
        <h2 className="section-title">竞赛排名</h2>
        <span className="profile-ranks-meta">
          {rankLoading && !updatedAt
            ? '加载中…'
            : `${rankTimeText(updatedAt) || '每 30 秒自动刷新'} · 30s 自动刷新`}
        </span>
      </div>

      <div className="rank-list">
        {items.map((e) => {
          const rank = ranks[String(e.examId)];
          return (
            <div className="rank-row" key={e.examId}>
              <span className="rank-row-main">
                <span className="rank-row-title">{e.title}</span>
                <span className="rank-row-time">
                  {formatDateTime(e.startTime)} ~ {formatDateTime(e.endTime)}
                </span>
              </span>
              <span className={`rank-row-value${rank == null ? ' is-muted' : ''}`}>
                {rankText(rank)}
              </span>
            </div>
          );
        })}

        {!examsLoading && items.length === 0 && (
          <div className="empty-hint">你还没有报名任何竞赛</div>
        )}
        {examsLoading && items.length === 0 && (
          <div className="list-loading">加载中…</div>
        )}
      </div>
    </section>
  );
}

/* ---------------- 右下：最近提交 ---------------- */
// 固定高度（10 条）的滚动区，滚到底自动加载下一页
function RecentSubmissions({ onOpenEditor }) {
  const { items, loading, error, hasMore, loadMore } = useRecentSubmissions();
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);

  // 框内滚到底部的哨兵进入视口 → 加载下一页
  useEffect(() => {
    const root = scrollRef.current;
    const el = sentinelRef.current;
    if (!root || !el || !hasMore) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { root, rootMargin: '120px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, items.length, loadMore]);

  return (
    <section className="profile-submits">
      <h2 className="section-title">最近提交</h2>
      <div className="submit-scroll" ref={scrollRef}>
        <div className="submit-list">
          {items.map((s, i) => (
            <SubmitRow
              key={s.submitId ?? i}
              title={s.title || `题目 #${s.questionId}`}
              pass={s.pass}
              runTime={s.runTime}
              createTime={s.createTime}
              onClick={() => onOpenEditor?.(s.questionId)}
            />
          ))}
          {!items.length && !loading && (
            <div className="empty-hint">{error || '暂无提交记录'}</div>
          )}
          {loading && <div className="list-loading">加载中…</div>}
          {!hasMore && items.length > 0 && (
            <div className="list-end">没有更多了</div>
          )}
          <div ref={sentinelRef} className="list-sentinel" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

// 提交行：日期 / 题目 / 结果状态 / 运行时间（未通过为 N/A）
function SubmitRow({ title, pass, runTime, createTime, onClick }) {
  const isAc = pass === 4 || pass === 'ACCEPTED';
  const status = PASS_STATUS[pass];
  const label = isAc ? '通过' : status?.text || '未通过';

  return (
    <button type="button" className="submit-row" onClick={onClick}>
      <span className="submit-row-date">{formatDateCN(createTime)}</span>
      <span className="submit-row-title">{title}</span>
      <span className={`submit-row-status ${isAc ? 'ok' : 'bad'}`}>{label}</span>
      <span className="submit-row-runtime">{formatRunTime(pass, runTime)}</span>
    </button>
  );
}
