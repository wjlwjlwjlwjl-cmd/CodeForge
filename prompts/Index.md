帮我做一个登录后跳转的首页，技术栈：Vue 3 <script setup> + Tailwind CSS。
先只做静态布局，用 mock 数据填充，接口先留空函数占位。

【整体风格】
延续项目已有的登录页和代码编辑页风格：
- 暗色为主，主色 LeetCode 橙 #FFA116
- 顶栏复用现有 Header 组件
- 支持深浅色切换，复用现有主题逻辑
- 字体、圆角、间距沿用项目现有设计规范

【配色】
沿用项目已有的 CSS 变量：
背景 #1A1A1A / 面板 #262626 / 边框 #3A3A3A
主文字 #EFF1F6 / 次要文字 #9CA3AF / 主色 #FFA116

【页面结构】

1. 顶栏 Header
    - 复用现有 Header 组件
    - 导航项：Logo "Code Forge" + 竞赛 + 题目 + 提交记录
    - 右侧：主题切换按钮 + 用户头像（圆形，带下拉菜单：
      个人中心 / 退出登录）
    - 不要"题库"和上下一题按钮

2. 欢迎区
    - "欢迎回来，{username}"，大字号，白色
    - 下方一行等宽字体小标语，次要文字色
    - 右侧可放一个"开始刷题"的橙色主按钮

3. 数据概览（4 个卡片，一排）
    - 已通过题目数 / 总提交数 / 通过率
    - 卡片：面板色背景，圆角 12px，数字用橙色大字，标签用次要文字色
    - 响应式：手机端 2x2 排列

4. 竞赛区（两栏）
    - 左栏"进行中的竞赛"：竞赛卡片列表
      每张卡片：竞赛名 / 时间范围  / "报名"或"进入"按钮
    - 右栏"我参加的竞赛"：竞赛卡片
      每张卡片：竞赛名 / 状态标签 / 我的排名，同时排名需要标注获取时间
    - 卡片 hover 时边框变橙色，轻微上移

5. 刷题区（两栏）
    - 左栏"快速刷题"：搜索框 + 题目列表（题目名 + 难度标签）
      难度标签：简单绿 / 中等橙 / 困难红
    - 右栏"最近提交"：列表，每项显示题目名 + 状态（通过/未通过）+ 时间
    - 状态通过用绿色 #2CBB5D，未通过用红色

【美化元素】
- 页面加载时各区卡片依次淡入（stagger 动画）
- 卡片 hover 有 0.2s 过渡，边框发光
- 进度条用橙色渐变
- 头像加载失败时显示首字母占位

【技术要求】
- Vue 3 <script setup> 单文件组件
- 组件拆分：
  components/AppHeader.vue（复用）
  components/StatCard.vue
  components/ContestCard.vue
  components/ProblemItem.vue
  views/HomePage.vue
- 响应式：桌面两栏，平板单栏，手机全宽
- 用 mock 数据填充，方便看效果
- 接口调用留空函数，用注释标出对应哪个后端接口：
  fetchUserInfo()      → GET 获取C端用户信息
  fetchOngoingContests() → GET 根据竞赛状态获取竞赛
  fetchMyContests()    → GET 获取用户竞赛列表
  fetchRecentSubmissions() → GET 获取用户提交记录
  searchProblems(kw)   → GET 关键字查询题目
  fetchAvatarUrl()     → GET 获取预签名头像链接