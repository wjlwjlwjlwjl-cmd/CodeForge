帮我做一个登录页，技术栈和已有的代码编辑页一致
项目已有代码编辑页用的是 Vue 3 + Tailwind，请保持技术栈和风格一致。
先只做静态页面，不接后端接口，但要留好空函数占位。

# 整体风格
参考本项目代码编辑页的配色和顶栏结构，做成 Steam 单机游戏首页那种
沉浸式布局：上方是标题，下方是登录选项。

# 配色（深浅色都支持）
用 CSS 变量 + Tailwind dark: 类实现，主色统一为橙色 #FFA116。

深色模式：
背景        #1A1A1A
面板        #262626
边框        #3A3A3A
主文字      #EFF1F6
次要文字     #9CA3AF
主色        #FFA116
主色hover   #FFC01E

浅色模式：
背景        #FFFFFF
面板        #F7F8FA
边框        #E0E0E0
主文字      #1A1A1A
次要文字     #6B7280
主色        #FFA116
主色hover   #E8900F

# 顶栏 Header
高度约 50px，和代码编辑页保持一致：
- 左侧：Logo 图标（橙色方块，复用现有 Logo 组件）+ "Code Forge" 粗体字
- 右侧：只保留主题切换按钮（月亮/太阳图标，圆形，橙色描边），
  主题切换逻辑复用项目现有的方式，不要重新造
- 不要"题库"按钮，不要上下一题箭头按钮
- 底部一条 1px 分隔线，颜色用边框色

# 页面主体（顶栏下方）
垂直居中布局，像 Steam 启动界面：
1. 上方是 ASCII art 标题 "Code Forge"
    - 用 <pre> 渲染，等宽字体
    - 颜色用橙色 #FFA116 到 #FFC01E 的渐变
    - 直接给我一个可用的 ASCII art 版本，用块状字符
    - 下方加一行小标语，等宽字体，次要文字色，
      比如 "// Forge your code, sharpen your mind"

2. 下方是登录表单卡片
    - 宽约 400px，居中，背景面板色，圆角 12px，轻微阴影
    - 输入框1：邮箱（type=email，placeholder "邮箱"）
    - 输入框2：密码（type=password，placeholder "密码"）
    - 输入框背景比卡片略深，圆角 8px
    - 聚焦时边框变 #FFA116 并带轻微橙色外发光
    - 登录按钮：全宽，背景 #FFA116，文字深色，hover 变 #FFC01E 并发光
    - 按钮下方居中文字链接："还没有账号？注册"，hover 变橙色

3. 点击“还没有账号？注册“后，原来的登录内容切换到注册信息填写表单，内容包括：
   - nickName
   - sex
   - email
   - code（包含发送验证码按钮，间隔一分钟）
   - password
   - schoolName
   - majorName

# 美化元素
- 背景加一层微弱的径向渐变光晕，中心偏上，橙色低透明度
- 可加极细网格线或噪点纹理，要克制
- 表单卡片加载时淡入 + 轻微上移（0.4s ease）
- 按钮 hover 过渡 0.2s
- 输入框聚焦过渡

# 接口调用
- 登录接口，调用后端 18080 端口的/user/login，POST，包含email和password两个参数，返回示例如下
```json
{
    "code": 1000,
    "msg": "success",
    "data": "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJ0eXBlIjoiQyIsInVzZXJfYWNjb3VudCI6IjI1MzAwMTIwMTIyQG0uZnVkYW4uZWR1LmNuIiwiZW1haWwiOiIyNTMwMDEyMDEyMkBtLmZ1ZGFuLmVkdS5jbiIsInVzZXJuYW1lIjoid3dqamxsIn0.04ouYCwh_3c-a7QiAQriNW76Nn3VWqFstjhbuaiMrxTRqayLQ3zxASdJAAuB5EoexGK5cXjQp8jnLUvqIs_J_Q"
}
```
返回的为jwt token，后续所有请求携带在 Header Authorization 中，失败会反映响应的code和msg

- 注册，调用 18080 端口的 /user/register，POST，参数dto如下
```java
public class UserRegisterDTO {
    @Length(min = 4, max = 20, message="昵称长度应在4～18个字符之间")
    private String nickName;

    @Min(value=1)
    @Max(value=2)
    private Integer sex;

    @NotBlank(message="邮箱不得为空")
    @Length(max=50, message="邮箱长度上线为50个字符")
    private String email;

    @NotBlank(message="验证码不能为空")
    private String code;

    @Length(min = 6, max = 15, message = "密码长度应在6~15位")
    private String password;

    @Length(max=20)
    private String schoolName;
    @Length(max=20)
    private String majorName;
}
```
返回正文中，“data”为true注册成功，否则msg会包含错误消息