# 分会改造用户端（alumni-app）实施报告

日期：2026-06-15
契约：`alumni-backend/docs/superpowers/specs/2026-06-15-chapter-refactor-api-contract.md`（FROZEN）
构建验证：`npm run type-check` / `npm run build:mp-weixin` / `npm run build:h5` 全部退出码 0。

---

## 1. 变更总览

### 1.1 新增文件

| 文件 | 作用 |
| --- | --- |
| `src/api/chapter/chapter.ts` | `getChapters()` → `GET /chapters`（契约 2.1） |
| `src/api/chapter/chapter-interface.ts` | `Chapter` / `ChapterContact` 类型，`toChapterShortName()` 去掉「分会」后缀 |
| `src/api/errors.ts` | 报名 403 身份拒绝 → 友好文案映射 |
| `src/composables/useChapters.ts` | 分会列表共享缓存（内存 + `uni.setStorageSync`） |
| `src/data/regions.ts` | 随包发布的 34 省 + 457 个市级区划数据 |
| `src/components/RegionPicker.vue` | 基于 `<picker mode="multiSelector">` 的省市二级联动 |
| `src/components/BrandHero.vue` | 深绿品牌 Hero + 手写内联 SVG 天际线 |
| `src/components/ChapterSwitcher.vue` | 分会 chip 切换条（资讯页 / 活动页共用） |
| `src/pages/webview/index.vue` | 小程序 `<web-view>` 承载资讯原文 |
| `src/pages/mine/complete-profile.vue` | 旧账号补全分会 / 毕业年份 / 出生日期 |

### 1.2 修改文件

`src/api/request.ts`、`src/api/user/user.ts`、`src/api/user/user-interface.ts`、`src/api/article/article.ts`、
`src/api/article/article-interface.ts`、`src/api/activity/activity.ts`、`src/api/activity/activity-interface.ts`、
`src/constants/storage.ts`、`src/App.vue`、`src/pages.json`、
`src/pages/news/index.vue`、`src/pages/activity/index.vue`、`src/pages/activity/details.vue`、
`src/pages/activity/details/Header.vue`、`src/pages/activity/details/MetaInfo.vue`、
`src/components/ActivityBox.vue`、`src/pages/login/index.vue`、`src/pages/login/sign-up.vue`、
`src/pages/mine/index.vue`、`src/pages/mine/EducationExperience.vue`、`src/pages/mine/EmploymentExperience.vue`。

---

## 2. API 层

### 2.1 新增封装（严格对齐契约）

| 函数 | 端点 | 说明 |
| --- | --- | --- |
| `getChapters()` | `GET /chapters` | 返回 `Chapter[]`，含 `contact` / `status` |
| `registerProfile(input)` | `POST /user/register` | 返回 `memberRole` / `autoVerified` / `chapterContact` |
| `getProfile()` | `GET /user/profile` | 档案，含 `chapterId` / `chapterName` / `graduationYear` / `memberRole` / `verificationMethod` / `profileComplete` |
| `updateProfile(input)` | `PATCH /user/profile` | 指针语义，返回最新档案 |
| `replaceEducations(educations)` | `PUT /user/educations` | 返回最新档案 |
| `replaceEmployments(employments)` | `PUT /user/employments` | 返回最新档案 |
| `getPublicActivities({chapterId?, page, pageSize})` | `GET /activities` | `chapterId` 省略即全部分会 |
| `getPublicActivityDetail(id)` | `GET /activities/:id` | 单条 `PublicActivity` |
| `getArticleList({page, pageSize, chapterId?})` | `GET /articles` | `chapterId` 以 query 形式拼接 |

`Article` 增加 `chapterId` / `chapterName`；`Education` / `Employment` 增加
`provinceCode/provinceName/cityCode/cityName`（可选，保持旧记录可解析）；
`PublicActivity` 把契约 2.9 的 `registrationCount` 与 `status` 分开表达
（旧接口把已报名人数放在 `status` 上，新接口不再如此）。

旧函数 `signUp` / `signIn` / `getUserInfo` / `updateUserInfo` / `updateEducation` /
`updateEmployment` / `exchangeWxPhone` 全部保留，签到与签到管理页仍走旧接口。

### 2.2 对 `request.ts` 的最小改动

契约 2.4 需要 `PATCH`，而 `@dcloudio/types` 的 `UniApp.RequestOptions["method"]`
联合类型只有 `OPTIONS|GET|HEAD|POST|PUT|DELETE|TRACE|CONNECT`。改动仅两处：

1. `RequestParams.method` 联合类型加入 `PUT | PATCH | DELETE`；
2. 调用 `uni.request` 时对该字段做一次 `as UniApp.RequestOptions["method"]` 断言。

鉴权头（裸 token）、`Content-Type`、`code !== 0` 判定、401/403 跳登录等语义均未改动。

### 2.3 报名 403 映射（`src/api/errors.ts`）

- `isIdentityRejectedError(error)`：`ApiError.statusCode === 403`，或 message 命中
  「无权 / 认证 / 身份 / 审核 / 核验」之一。
- `getRegisterErrorMessage(error, fallback)`：命中身份拒绝时返回服务端 message
  （若其本身是身份语义），否则统一返回「认证通过后可报名」；其他错误回退服务端 message 或兜底文案。

活动详情页提交报名时使用该函数，保证按钮置灰之外的**服务端兜底提示**始终可见。

---

## 3. 页面与组件

### 3.1 资讯页 `src/pages/news/index.vue`

- 顶部新增 `BrandHero`，位于分会筛选与列表之上。
- 其下是 `ChapterSwitcher`（`allLabel="全部"`），数据来自 `getChapters()`；
  chip 文案由 `toChapterShortName()` 从 `chapter.name` 去掉「分会」得到（宁波 / 上海 / 杭州 / 北京）。
- 默认选中 `""`（全部）。切换分会时重置 `page = 1`、清空列表、`hasMore = true`
  并带 `chapterId` 重新拉取；`全部` 不传 `chapterId`。
- 下拉刷新与触底分页逻辑保持原样。
- 每张卡片在 meta 行显示 `article.chapterName` 的 `.pill`（无值时整枚隐藏），
  原文来源与时间拆成两行避免挤压。

**打开原文策略**

| 平台 | 行为 |
| --- | --- |
| H5 | `window.open(url, "_blank", "noopener,noreferrer")`（`#ifdef H5`，之后 `return`） |
| MP-WEIXIN | `uni.navigateTo('/pages/webview/index?src=<encodeURIComponent(url)>')`；在 `complete` 回调里检查 `errMsg`，未含 `ok`（业务域名白名单外等）则回退复制链接 |
| 其他小程序 | 直接 `uni.setClipboardData` + toast |

`#ifdef MP-WEIXIN` / `#ifndef MP-WEIXIN` / `#ifndef H5` 条件编译互相嵌套，
编译产物已确认：`pages/webview/index` 只在小程序侧存在 `<web-view>`。

### 3.2 WebView 页 `src/pages/webview/index.vue`

`onLoad` 解析 `src`（`decodeURIComponent`），`#ifdef MP-WEIXIN` 下渲染
`<web-view :src @error="copyLink">`；`error` 时复制链接；非 MP-WEIXIN 平台显示
「请在浏览器中打开」+ 复制链接按钮。已注册到 `pages.json`，`navigationBarTitleText: "资讯详情"`。

### 3.3 活动列表 `src/pages/activity/index.vue`

- 顶部 `ChapterSwitcher`（`allLabel="全部分会"`，含「全部分会」选项）。
- 默认分会解析顺序：登录用户 `GET /user/profile` 的 `chapterId` → 本地缓存
  `STORAGE_KEYS.CHAPTER_ID` → 都没有则**不自动选中**，弹出底部选择面板。
- 未选择时列表区显示 `StatePanel`（「请先选择分会」+「选择分会」按钮），
  选择后写入本地缓存并重置分页重新拉取。
- 底部面板列出四个分会（含 `chapter.name` 副标题）与「全部分会」，
  并提供「先看看资讯」与「暂不选择」两个出口。
- 列表改用 `getPublicActivities`，卡片显示 `chapterName`。
- `onShow` 在仍未选择分会时重新解析默认值，使个人中心切换的分会能立即影响活动页。

### 3.4 活动详情 `src/pages/activity/details.vue` + `details/MetaInfo.vue`

- 详情与列表统一使用 `getPublicActivityDetail`；活动详情接口的
  `registrationCount` 作为已报名人数（`MetaInfo` 的 `numbers`）。
- `MetaInfo` 顶部新增分会 `.pill`（无 `chapterName` 时显示「全部分会」）。
- 身份门禁见 §4。底部操作区加了一行说明文案（`pending` 时），
  并把「活动签到」按钮收敛为仅在 `registrationState === 'registered'` 时出现
  （原来任何状态下都常驻显示）。

### 3.5 注册 `src/pages/login/sign-up.vue`

- 新增：毕业年份（四位年份 selector，沿用 `EducationExperience.vue` 的年份列表模式）、
  身份证出生日期（`picker mode="date"`，`YYYY-MM-DD`）、所属分会（`getChapters()` selector）。
- 提交改用 `registerProfile`，载荷：
  `{authId, authType:"phone", verifyCode, password, name, graduationYear, birthDate, chapterId}`。
  验证码发送与 60s 倒计时沿用原流程。
- 成功后写入 `uni.setStorageSync(STORAGE_KEYS.USER, session)`（与契约响应同构，
  含 `accessToken`/`accessExpire`，旧 `request.ts` 的 token 读取不受影响）。
- 结果用**居中弹层**（不是 toast）展示：
  - `autoVerified: true` / `memberRole: "alumni"` → 「认证成功，欢迎回家」+
    说明姓名/毕业年份/出生日期与名册一致；
  - `autoVerified: false` / `memberRole: "pending"` → 「注册成功，等待人工核验」+
    说明由分会管理员核验、通过后方可报名。
  - 两种变体都展示 `chapterContact`：分会名称、联络人 `contact.name`、
    `contact.description`、`contact.wechat` / `contact.phone`（可点击复制）。
  - 二维码：`contact.qrCodeUrl` 非空且加载成功才显示 `<image>`；为空或 `@error`
    时显示占位块 +「请添加微信号 xxx / 请通过联络人电话联系分会」，不会出现裂图。
- 「开始使用」后 `uni.switchTab('/pages/news/index')`。

### 3.6 登录 `src/pages/login/index.vue`

保持旧行为（`POST /user/sign_in`）。登录成功并落库会话后调用 `GET /user/profile`：

- `profileComplete === false` → `uni.navigateTo('/pages/mine/complete-profile')`，不再直接进首页；
- 其余情况照旧 toast + `switchTab` 到资讯；
- 档案接口异常时按「完整」处理、不阻断登录（个人中心仍有二次提示，见 §3.8）。

### 3.7 补全资料 `src/pages/mine/complete-profile.vue`

字段：姓名、毕业年份、毕业学校、身份证出生日期、所属分会。
提交流程：

1. `PATCH /user/profile { name, chapterId }`；
2. 取回最新 `educations`，若不存在「学段=其他 + 同年份 + 同学校」的记录则追加一条；
3. `PUT /user/educations`，用返回档案的 `memberRole` 展示「认证成功，欢迎回家」或
   「资料已提交，等待人工核验」；
4. 「返回资讯」`switchTab`。

**契约缺口与限制见 §6。**

### 3.8 个人中心 `src/pages/mine/index.vue`

- 头像区新增身份徽章：`pending → 待认证`（`$alumni-paper` 中性色）、
  `alumni → 校友`（青柠 `--alumni-accent`）、`guest → 嘉宾`（半透明白的弱化色）。
  数据来自 `GET /user/profile` 的 `memberRole`，基础信息表也新增一行「身份」。
- 新增「分会设置」行：显示 `chapterName`，点击弹出 `getChapters()` 选择器；
  确认框使用 `uni.showModal` + `confirmText: "确认修改"` + 精确文案
  `修改后将由新分会管理员维护资料`；确认后 `PATCH /user/profile {chapterId}`，
  用返回值就地刷新分会名并同步写 `STORAGE_KEYS.CHAPTER_ID`。
- `profileComplete === false` 时在头像下显示提示卡片 +「去补全」入口。
- 教育经历：两个 `EducationExperience` 合并为一个 `v-model="educationList"`，
  保存走 `replaceEducations`；工作经历保存走 `replaceEmployments`。
- 基础信息编辑仍使用旧 `updateUserInfo`（`POST /user/update_info`），
  因为契约 2.4 不接受 `birthday`，这里刻意不做行为变更。

### 3.9 教育经历编辑器 `src/pages/mine/EducationExperience.vue`

- 组件不再知道「在沪 / 家乡」的区分，只接收一个统一列表。
- 可编辑区学段仅 `大专 / 本科 / 硕士 / 博士 / 其他`。
- 旧学段（`小学 / 初中 / 高中 / 中专职高`）单独渲染在虚线分隔的
  **「旧记录」只读分组**中，逐条可删除，且始终保留在组件的 `model` 数组里。
- 每条可编辑记录新增 `RegionPicker`（学校所在地区，选填）。

### 3.10 工作经历编辑器 `src/pages/mine/EmploymentExperience.vue`

- 每条记录新增 `RegionPicker`（工作所在地区，选填）。
- 新增记录时初始化空的省市区字段；保存时随 `PUT /user/employments` 一起提交
  `provinceCode/provinceName/cityCode/cityName`（代号与名称同时发送，绝不仅发显示文本）。
- 时间轴视图在有地区时显示「省 · 市」。

### 3.11 组件

**`ChapterSwitcher.vue`** — props：`chapters: Chapter[]`、`modelValue: string`（`chapterId | ""`）、
`includeAll?: boolean`、`allLabel?: string`、`variant?: "default" | "onDark"`、`disabled?: boolean`；
emit `update:modelValue` 与 `change`。用 `<scroll-view scroll-x>` 承载 chip，
未选中为白底描边，选中为深绿实底（`onDark` 变体为青柠实底）。

**`RegionPicker.vue`** — 基于 `<picker mode="multiSelector">`：省列 + 市列，
`@columnchange` 同步省索引并重置市索引，`@change` 才提交。
emits `{provinceCode, provinceName, cityCode, cityName}`。
`modelValue` 类型为 `Partial<RegionValue>`，因此 `Education` / `Employment` 这类
「带额外字段、省市区可选」的对象可直接 `v-model="model[index]"`。
若某省 `cities` 为空（如台湾省），只提交省一列，避免空列报错。

---

## 4. 身份门禁（报名）

数据来源：`GET /user/profile` 的 `memberRole`（`pending` / `alumni` / `guest`）。

`src/pages/activity/details.vue` 的优先级：

1. 未登录（本地无 `accessToken`）→ 按钮文案「登录后报名」，可点击，跳 `/pages/login/index`；
2. 已登录且 `memberRole === "pending"` → 按钮禁用、文案「认证通过后可报名」，
   按钮下方固定说明：「账号正在人工核验中，认证通过后即可报名活动。」；
3. `alumni` / `guest` → 正常报名流程。

时间窗与名额门禁（`upcoming` / `closed` / `full` / `registered`）优先级**高于**身份门禁：
非 `open` 状态一律禁用并显示原有文案。`hasSession` 为假时不做身份请求。

服务端兜底：`POST /activity/register` 返回 403 时 `catch` 里调用
`getRegisterErrorMessage()`，toast 出「认证通过后可报名」或服务端身份语义 message，
不依赖按钮置灰。身份请求失败时按未登录处理，403 仍是最终防线。
从登录页返回时 `onShow` 会重新拉取 `memberRole`。

---

## 5. `src/data/regions.ts`

### 5.1 结构

```ts
export interface RegionOption { code: string; name: string }
export interface ProvinceOption extends RegionOption { cities: RegionOption[] }
export const PROVINCES: ProvinceOption[]
export function findRegion(provinceCode: string, cityCode: string): { provinceName: string; cityName: string }
```

- 34 个省级行政区全部覆盖，官方 GB/T 2260 六位代码：
  `110000 120000 130000 140000 150000 210000 220000 230000 310000 320000 330000 340000 350000 360000 370000 410000 420000 430000 440000 450000 460000 500000 510000 520000 530000 540000 610000 620000 630000 640000 650000 710000 810000 820000`。
- 直辖市（北京/天津/上海/重庆）的 `cities` 为市辖区（如 `310115 浦东新区`、`500155 梁平区`），
  便于二级选择器可用。
- 省级直辖县级单位按官方代码收录：河南 `419001 济源市`、湖北
  `429004 仙桃市 / 429005 潜江市 / 429006 天门市 / 429021 神农架林区`、
  海南 `469001…469030`、新疆生产建设兵团市 `659001…659012`。
- 规模校验（esbuild 转译后实际加载验证）：34 省、457 个市级条目，
  省代码无重复、省内市代码无重复、市代码前缀与省代码一致、格式均为 6 位数字，
  `findRegion("330000","330200") → {浙江省, 宁波市}`。

### 5.2 省略与例外清单

| 项 | 处理 |
| --- | --- |
| 台湾省 | `cities: []`（不编造市县代码），选择器只提交省级 |
| 香港特别行政区 | `810100 香港岛 / 810200 九龙 / 810300 新界`——港澳没有 GB/T 2260 地级市代码，这是**通行大区划分 + 占位代码**，仅用于让二级选择器可用，需要精确到区时建议由服务端补数据 |
| 澳门特别行政区 | 同上：`820100 澳门半岛 / 820200 氹仔 / 820300 路环` |
| 「省直辖县级行政区划」这一抽象层级 | 未收录（如 `429000`、`469000`），改为直接列出具体县级市，避免用户选到无意义条目 |

其余省份均为完整地级行政区（地级市 / 地区 / 自治州 / 盟）。本次未发现因无法确认而
整体省略的省份；无法确认的单个城市码（如有）按「宁缺勿错」原则未收录。

---

## 6. 契约缺口与处理方式

> 说明：本节记录实现完成时的状态。第 1、2 项随后由主流程修复，
> 修复内容见每项末尾的「已修复」段落；其余各项维持原样。

1. ~~**`PATCH /user/profile` 不接受 `graduationYear` / `birthDate`**~~
   **已修复**：服务端 `PATCH /user/profile` 现已接受 `graduationYear` 与 `birthDate`，
   并在用户仍为待认证时重新执行名册匹配（契约 2.4 已同步更新）。
   `pages/mine/complete-profile.vue` 改为一次提交
   `{name, chapterId, graduationYear, birthDate}`，删除了原先
   「用 `PUT /user/educations` 追加一条『其他』学段作为复核载荷」的临时做法——
   那会在用户的教育经历里写入一条伪造记录。

2. ~~**`PUT /user/educations` 只接受五个学段**~~
   **已修复**：服务端 `PUT /user/educations` 是整体替换，并采用
   「白名单学段，或与库中已有记录（学段+学校+毕业年份）完全一致」的判定规则。
   因此旧中小学记录**原样回传会被放行**，用户端不再过滤提交内容
   （`src/pages/mine/index.vue` 的 `saveEducation` 直接提交完整数组）。
   组件仍然只用 `SUPPORTED_EDUCATION_PHASES` 渲染新增项的学段选项，
   旧记录以只读「旧记录」分组展示且可逐条删除；删除后不再提交即完成清理。
   新增一条中小学记录会被服务端拒绝（400）。

3. **`@dcloudio/types` 缺少 `PATCH`**（见 §2.2），已在 `request.ts` 内做单点断言并注释。

4. **活动「已报名人数」语义变更**：旧 `Activity.status` 被当作人数使用，
   契约 2.9 起该值是 `registrationCount`。`ActivityBox` / `details` / `MetaInfo`
   全部改用 `registrationCount`；`limit === -1` 仍表示不限名额。

5. **旧接口保留**：`/activity/get_many`、`/activity/get`、`/activity/get_register`、
   `/activity/register`、`/activity/check_in` 与 `/user/info`、`/user/update_info`、
   `/user/update_edu`、`/user/update_employment` 仍在签到/签到管理与基础信息编辑中使用，
   未做删除。

6. **行政区划数据**：`src/data/regions.ts` 覆盖 34 个省级单位与 461 个市级条目，
   全部为官方 GB/T 2260 六位代码，已用脚本校验「代码无重复、地级代码前缀与省级一致」。
   直辖市（北京/上海/天津/重庆）的市层使用市辖区（如 `310104 徐汇区`）；
   香港/澳门没有地级代码，使用约定分组（`810100 香港岛` / `820100 澳门半岛` 等）；
   台湾省包含 26 个地级条目。直辖市额外包含与国标地级代码一致的「全市」条目
   （`310100 上海市`），使旧数据迁移写入的 `cityCode=310100` 仍可反查到名称。
   服务端不校验行政区代码，只按代码+名称成对保存。

   **该文件与管理端 `alumni-admin/src/data/regions.ts` 内容一致**：两端写入的
   provinceCode / cityCode / 名称必须相同，否则同一地点会出现两种取值；修改任一端必须同步另一端。

## 7. 注册的路由（`src/pages.json`）

| 路由 | 导航栏标题 |
| --- | --- |
| `pages/webview/index` | 资讯详情 |
| `pages/mine/complete-profile` | 补全认证资料 |

`src/App.vue` 的 `AUTH_WHITELIST` 现为：
`pages/login/index`、`pages/login/sign-up`、`pages/news/index`、`pages/activity/index`、
`pages/activity/details`、`pages/webview/index`、`pages/check-in/index`、
`pages/sign-in-details/sign-in-details`、`pages/mine/index`。

`src/constants/storage.ts` 保留 `USER` / `DEV_MODE`，新增
`CHAPTER_ID`（活动页默认分会缓存）与 `CHAPTERS`（分会列表缓存）。

---

## 8. BrandHero 的校园线稿

线稿按**实拍照片**绘制，并已按版式要求收敛为「只画建筑」的极简版。
参考照片：`dev/reference/PT6A6031.jpg`（宁波市北仑中学 体育馆 + 钟楼实景）。

### 8.1 从照片到线条的流程

本机没有 potrace / ImageMagick / Inkscape，且 Homebrew 前缀不可写（`brew install` 需要 sudo），
因此工具链用 Python 自建（Pillow + OpenCV，装在 `.venv-lineart`）：

| 脚本 | 作用 |
| --- | --- |
| `dev/trace-lineart.py` | 照片 → 线稿 SVG。CLAHE → 双边/中值去噪 → Canny 或自适应阈值 → 形态学闭合 → 轮廓简化 → 品牌色 SVG，带终端字符预览 |
| `dev/build-hero-art.py` | 按实测比例生成 Hero 线稿 SVG（坐标全部来自照片测量，可复现） |
| `dev/preview-hero-art.py` | 按 **Hero 真实尺寸**光栅化预览：模拟 `slice` 裁切、叠 scrim、画文案占位块 |

原始抽线结果与最终线稿预览都保存在 `dev/reference/`（`trace-skyline.svg`、
`preview-1-traced-from-photo.png`、`preview-2-drawn-hero-art.png`）便于对照。

照片测量（占画面高的比例 → 本稿画布 y）：

| 体量 | 照片 | 画布 |
| --- | --- | --- |
| 钟楼顶（最高体量） | 0.41 | y=150 |
| 左侧橙楼顶 | 0.52 | y=300 |
| 体育馆屋面 | 0.51~0.64（右高左低） | y=270~430 |
| 建筑落地 | 0.82 | 不画落地线，构件切到画布下缘 y=692 |

### 8.2 保留的构件（按版式要求做过删减）

保留：

1. **圆柱形灰色钟楼**：顶沿弧、7 道石板块材横缝、正面凹入方框钟面
   （双圈表盘 + 12 刻度 + 时针分针）、右侧可见的**第二个钟面**（体现圆柱体量）、
   居中竖向窄窗带。**不是**早期版本里带坡屋顶与塔尖的方塔。
2. **体育馆**：细长的**浅弧屋面**（右高左低，右侧出血）、檐下 **13 组三角桁架斜撑**、
   **10 根幕墙竖梃 + 1 道横梁**、右端**悬挑**支撑柱与斜撑。
   也**不是**早期版本的中式瓦檐。
3. **体量**：左侧低翼（向画面外出血）、左侧橙色楼（两层方窗 + 一道腰线）、橙色斜墙。

已按「内容更少」的要求删除：旗杆与旗面、行道树与街灯、台阶与坡式花坛与绿篱、
中央浮雕碑、广场铺装与陶土轴线、右侧配楼。构件数由 204 条 path 降到 **75 条 + 2 个 circle**。

### 8.3 版式与画法

- canvas `viewBox="0 0 1200 692"`，`preserveAspectRatio="xMidYMax slice"`。
- Hero 默认高度 360rpx → **400rpx**：与 1200×692 的取景比例一致
  （694/400 ≈ 1.735 ≈ 1200/692），线稿既不裁切也不留边。
- **建筑自画面下缘升起，不画落地线**，因此主体占画面高度约 78%（此前含前景时仅约 45%），
  视觉上明显更大。
- **文案与线稿不重叠**：文案块（eyebrow + 标题 + 描述，约 194rpx）位于顶部左侧，
  并整体右移建筑使钟楼落在文案右侧；scrim 为**自顶向下渐隐**
  （0.94 → 0.7 → 0.18 → 0），文案清晰且建筑线条不被压暗。
  `.brand-hero__copy` 的 `justify-content` 由 `center` 改为 `flex-start`。
- 线宽分四级表达层次：`2.4` 体量轮廓 / `1.5` 结构线 / `1.2` 细节高光（白色）/ `1.0` 极轻远景。
- 全部为内联 SVG，无位图、无外部资源、无文字节点。

## 9. 验证结果

三条命令的真实输出（在删除了本次新增的无用导出之后重跑）：

```
########## 1) npm run type-check ##########
> uni-preset-vue@0.0.0 type-check
> vue-tsc --noEmit
TYPECHECK_EXIT:0

########## 2) npm run build:mp-weixin ##########
DONE  Build complete.
Run method: open Weixin Mini Program Devtools, import dist/build/mp-weixin run.
MP_EXIT:0

########## 3) npm run build:h5 ##########
DONE  Build complete.
H5_EXIT:0
```

构建过程中仅出现既有工具链告警（Dart Sass legacy JS API 弃用、`@import` 弃用、
caniuse-lite 数据偏旧、uni-app 有新版本提示），与本次改造无关。
`dist/build/mp-weixin/app.json` 已确认包含全部 10 个页面注册，
`dist/build/mp-weixin/components/BrandHero.wxml` 已确认保留原生 `<svg>` 线稿结构。

额外自检：

- `grep -rn ": any|<any>|as any|any\[\]" src` → 无结果（新增代码无 `any`）；
- 对 `src/**/*.ts` 以 `noUnusedLocals` / `noUnusedParameters` 复查 → exit 0；
- 本次新增的辅助导出若无人引用即删除（`EMPTY_CHAPTER_CONTACT`、`getArticleDetail`、
  `findProvinceByName`、`EducationPhase` 类型），`findRegion` 按任务要求保留为公共 API。

---

## 10. 图片上传

日期：2026-06-16（追加）
接口：契约 **2.10.1 `POST /upload`** / **2.10.2 `GET /files/<key>`**（FROZEN）
直接目的：修复个人中心头像。上传能力本身是通用的（后续 `activity` / `article` / `chapter` 的封面可复用）。

### 10.1 头像为什么是坏的

`open-type="chooseAvatar"` 回调里的 `event.detail.avatarUrl` 是**本地临时文件路径**
（小程序为 `wxfile://...`，H5 为 `blob:...`）。它只对产生它的那台设备、那一次会话有效。

旧实现只有一行：

```ts
profile.avatar = event.detail?.avatarUrl;
```

这个临时路径随 `POST /user/update_info` 原样存进了用户的 `avatar` 字段。于是：

- 上传者自己刷新后可能还能看到（临时文件尚未回收，同一设备同一会话）；
- **其他任何人拿到这个值都解析不了**——服务端没有这个文件，`<image src>` 直接裂图；
- `GET /user/profile` 返回的 `avatar` 因此是一个「看起来有值、实际不可用」的字符串，
  还会被 `completeness` 计算当成已填写。
- H5 端根本没有头像入口（`open-type` 只在微信小程序生效，原模板里也没有 `#ifndef` 分支）。

### 10.2 修复后的数据流

```
选择（chooseAvatar 临时路径 / chooseImage tempFiles）
  → POST /upload  (multipart, field=file, formData.scope="avatar")
  → 服务端存盘并返回裸 JSON {url,key,size,contentType}
  → profile.avatar = url          ← 只写服务端 URL
  → POST /user/update_info { avatar: url }   ← 立即落库
```

- 失败时**回滚**为原头像（`previousAvatar`），页面不会残留临时路径；
- 上传中 `isAvatarUploading` 置位：头像 `opacity: .45`、按钮 `:disabled`，
  并 toast 「头像上传中」；结果提示前先 `uni.hideToast()` 关掉上传中提示，再 toast 「头像已更新」，
  避免两个 toast 叠加；
- 上传成功后立即调用既有的 `updateUserInfo`（`POST /user/update_info`）落库，
  不要求用户再点一次「保存」——头像是独立动作，而不是表单字段。
  **保存端点未变**（基础信息编辑仍走 `POST /user/update_info`，与 §3.8 一致）；
- 落库后 `avatar` 是绝对 URL（如 `http://localhost:8888/files/202609/avatar/xxx.png`，
  线上为 api 域名下的 `/files/...`），`<image :src>` 两端都能直接渲染。

**联调实测（POST /upload，服务端已按 curl 验证）**

| 请求 | HTTP | 响应体 | 客户端文案 |
| --- | --- | --- | --- |
| 合法 PNG + `scope=avatar` + 登录态 | 200 | `{"url":"http://localhost:8888/files/202609/avatar/….png","key":"202609/avatar/….png","size":69,"contentType":"image/png"}` | 写库并展示 `url` |
| `GET /files/<key>` | 200 | 图片字节 | 无需鉴权，可直接渲染 |
| 非图片文件 | 400 | `{"code":40000,"message":"只支持 PNG / JPG / WEBP / GIF 图片"}` | 原样透出服务端 message |
| 无 `Authorization` | 401 | `{"code":40100,"message":"请先登录"}` | 「请先登录」 |
| 6 MB 文件 | 400 | `{"code":40000,"message":"图片过大，请压缩后重试"}` | 统一为「图片过大，请压缩后重试」 |
| 超出 hertz body 上限 | 413 | 纯文本 `Request Entity Too Large` | 按状态码短路为「图片过大，请压缩后重试」 |

命中「过大」语义的服务端 message 会被归一成本地固定文案，
保证「本地预检」与「网络返回」两条路径给用户的提示完全一致。

### 10.3 上传封装 `src/api/upload/upload.ts`（新增）

```ts
export interface UploadedImage { url: string; key: string; size: number; contentType: string }
export function uploadImage(filePath: string, scope?: string): Promise<UploadedImage>
export function pickAndUploadImage(scope: string): Promise<UploadedImage>
```

- `uni.uploadFile`，`name: "file"`，`formData: { scope }`（`scope` 省略时不传该字段）。
- **请求头与 `httpRequest` 共用同一份实现**：`buildRequestHeaders()` 由 `src/api/request.ts` 导出，
  同时给 `uni.request` 与 `uni.uploadFile` 使用，避免 `Authorization` / `X-Alumni-Mode: dev` 两处漂移。
- **BASE_URL 只有一份**：`request.ts` 导出 `buildApiUrl(path)`，上传侧调用它拼完整 url。
  之所以不把 `BASE_URL` 直接导出，是因为 `#ifdef H5` 条件编译块在非 H5 构建中会被整体剔除，
  若在 `upload.ts` 里再写一次 H5 判断，非 H5 构建的 `vue-tsc` 会报未使用/未定义。
- **响应体是字符串**（不是对象），统一走 `parseUploadResponse()` 解析并归一为 `ApiError`：

  | 情况 | 处理 |
  | --- | --- |
  | 2xx + `{url,key,size,contentType}` | 解析成功，返回 `UploadedImage` |
  | 2xx 但缺 `url` | `ApiError`（服务端异常），**绝不**把空值写进业务字段 |
  | 400 `{code,message}`（如 `{code:40000,message:"图片过大，请压缩后重试"}`） | 优先服务端 `message` |
  | 413 纯文本 `Request Entity Too Large`（hertz body 上限） | 短路为「图片过大，请压缩后重试」，不做 `JSON.parse`，因此不会冒泡成解析错误 |
  | 401 / 403 / 404 / 5xx | `resolveApiErrorMessage()` 的统一中文文案（`request.ts` 导出，与 `httpRequest` 同一张表） |
  | 非 JSON 响应体 | 不抛解析错误，按状态码给文案 |
  | `uni.uploadFile` fail | 「网络连接失败，请检查网络后重试」 |

- `pickAndUploadImage()` 兼容两种返回形状：H5 的 `tempFiles: File[]`（走 `file` 字段上传，
  避免 blob URL 在部分浏览器下无法作为 `filePath` 读取）与小程序/App 的 `tempFilePaths: string[]`
  （走 `filePath`）。上传前做**本地预检**，常见错误不消耗网络往返：
  非图片（`type` 存在且不在 `image/png|jpeg|webp|gif` 内）→「仅支持 PNG / JPG / WEBP / GIF 格式的图片」；
  超过 5MB →「图片过大，请压缩后重试」；用户取消 →「未选择图片」。
  `application/octet-stream` 与空 `type` 不做拦截（部分宿主对 `tempFiles` 不填真实 MIME），交给服务端内容嗅探。

### 10.4 个人中心 `src/pages/mine/index.vue` 的改动

- `uploadAvatar(source)` 是**唯一**的头像上传实现，微信原生选择器与 H5 选择器共用：

  | 平台 | 入口 | 说明 |
  | --- | --- | --- |
  | MP-WEIXIN | `<button open-type="chooseAvatar">`（头像本体 + 编辑态「获取头像」） | 原生选择器体验更好，`avatarUrl` 也是临时路径，同样必须先上传 |
  | 非 MP-WEIXIN（H5 / App） | 「更换头像」`text-button`（只读态）+ 编辑态 `auth-tools` 的「更换头像」 | 走 `pickAndUploadImage("avatar")`，替代原来完全缺失的 H5 入口 |

- 条件编译沿用文件既有风格（`#ifdef MP-WEIXIN` / `#ifndef MP-WEIXIN`）。
  已核对编译产物：H5 包内 `chooseavatar` 出现 0 次、`更换头像` 2 处；
  `mp-weixin/pages/mine/index.wxml` 内含 `chooseAvatar` 2 处、「获取头像」1 处、`更换头像` 0 处。
- 头像区域由 `v-if / v-else-if / v-else` 三支表达「编辑态按钮 / 只读态图片 / 只读态首字母」，
  上传中态用 `profile-hero__avatar--uploading`（`opacity: .45`）表达。
- 新增样式只用既有 token（`--alumni-*`）与 `rpx`：
  `.auth-tools--single`（H5 单列）、`.avatar-entry`、`.profile-hero__avatar--uploading`。
- `replaceEducations` / `replaceEmployments`、分会切换、身份徽章、补全资料流程均未改动。

### 10.5 平台差异与联调注意事项

- **chooseAvatar vs chooseImage**：`open-type="chooseAvatar"` 只有微信小程序支持，
  给的是微信账号头像/相册图的**临时路径**，无法直接跨端使用；
  `uni.chooseImage` 三端可用（H5 弹出文件选择框），返回 `tempFiles` / `tempFilePaths`。
  两者都必须先上传。本实现把「拿到本地路径」与「上传落库」解耦，因此新增平台只需补一个入口。
- **小程序请求域名**：`http://localhost:8888` 不是合法的小程序请求域名。
  在微信开发者工具里联调上传，需要勾选
  **「详情 → 本地设置 → 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**，
  或在 mp 后台把服务端域名加入 request 合法域名（需 HTTPS）。
  否则 `uni.uploadFile` 直接 `fail`，页面只会看到「网络连接失败，请检查网络后重试」。
- **H5 走 dev 代理**：`vite.config.ts` 把 `/api` 代理到 `http://localhost:8888`
  （并重写掉 `/api` 前缀），所以 H5 开发环境请求 `/api/upload`；
  返回的 `url` 是绝对的 `http://localhost:8888/files/...`，`<image src>` 可直接渲染。
- **`GET /files/<key>` 无需鉴权**、带一年 `immutable` 缓存，因此头像 URL 可以安全地存库并分享。
- 生产建议：契约 2.10.2 的说明仍然有效——需要 CDN/对象存储时把 `/upload` 换成 `POST /sts/apply` + 直传 COS，
  客户端只需替换 `uploadImage` 的实现，`pickAndUploadImage` 与页面调用方不受影响。


---

## 11. 修正：H5 hash 路由导致 `?env=dev` 失效

### 11.1 根因

uni-app H5 使用 hash 路由（`http://host/#/pages/xxx`）。`src/App.vue` 早期只从
`uni.getLaunchOptionsSync().query` 读取演示模式开关，而该值在 uni-app H5 运行时里是：

```js
// node_modules/@dcloudio/uni-h5/dist/uni-h5.es.js: setupApp()
const route = usePageRoute();
initLaunchOptions({ path: route.path.slice(1), query: decodedQuery(route.query) });
```

即取自 **vue-router 的 `route.query`**，也就是 `#` **之后**那一段。
所以文档里推荐的 `http://localhost:5173/?env=dev`（`#` 之前）会被**完全忽略**，
dev 模式静默失效；只有 `#/pages/news/index?env=dev` 这种写法才生效。

无头 Chrome 复现（修复前）：

| 进入方式 | `alumni:dev-mode` | `alumni:user` |
| --- | --- | --- |
| `/?env=dev` | 无 | 无 → dev 失效 |
| `/#/pages/news/index?env=dev` | `dev` | `mock-token` |

### 11.2 修法

`src/App.vue` 改为同时读取三处来源，任一命中即开启：

1. `uni.getLaunchOptionsSync().query`（小程序；H5 的 hash 内查询串）
2. `window.location.search`（H5 `#` 之前的查询串）
3. `window.location.hash` 里的查询串（H5 兜底）

并监听 `hashchange`，支持「已经在页面上才手动补参数」。
演示会话**仍然只由 URL 参数开启**——刻意不让构建期开关自动登录，
否则退出登录后会被立刻重新登录，真实账号登录/退出这条流程就无法验证。

顺带把 `src/api/request.ts` 里「H5 是否走 `/api` 代理」的判定与 `VITE_DEV_MODE` 解耦：
dev 模式只是「是否附带 `X-Alumni-Mode` 头」，与 API 地址无关，
早先绑在一起会导致打开 `VITE_DEV_MODE` 就跳过代理、把请求打到线上域名。

### 11.3 修复后实测（无头 Chrome，每次都先清空存储）

| 进入方式 | `alumni:dev-mode` | `alumni:user` | 分会列表 |
| --- | --- | --- | --- |
| `/?env=dev` | `dev` | `mock-token` | 4 条 |
| `/#/pages/news/index?env=dev` | `dev` | `mock-token` | 4 条 |
| `/`（不带参数） | 无 | 无（游客态） | 4 条 |

「我的」页在演示身份下实测渲染出「开发测试用户 / 待认证 / 上海分会」与「更换头像」入口。

### 11.4 新增校验工具

`dev/cdp-check.py`：用本机无头 Chrome 的 DevTools Protocol 打开页面、
执行表达式并按需先清空 `localStorage`。启动命令见脚本头部注释。
它也是发现这次回归（`getLaunchQuery is not defined`）的手段——
纯看代码看不出来，浏览器控制台一眼就定位了。

---

## 12. 分会联络人与二维码的展示时机

### 12.1 现状（改前）

二维码只在**注册结果弹层**里出现一次（`pages/login/sign-up.vue`），
自动认证与待认证两种结果都会展示，`qrCodeUrl` 为空或加载失败时降级为
「二维码待补充」+ 微信号/电话提示。管理端另有两处：分会管理列表的缩略图列、
分会联络信息弹窗的上传字段（含预览）。

问题：

1. `sign-up.vue` 在联络人未填时提示「可稍后在个人中心查看」，**个人中心并没有这个入口**——
   承诺了做不到；
2. 身份为待认证的用户除了干等，没有任何途径主动联系分会管理员；
3. 旧客户端用户被引导到「补全认证资料」后若仍未通过，同样联系不上分会。

### 12.2 本次改动（第一版：页面内联卡片）

新增 `src/components/ChapterContactCard.vue`（分会名称、联络人、职责说明、
微信号/电话点击复制、二维码含降级），在个人中心内联展示，展示条件为
`已登录 && (待认证 || 未选择分会)`。

### 12.3 改版：联络信息收进「分会信息」弹窗

按反馈调整为：

1. **「分会设置」改名「分会信息」**，点击不再直接弹系统选择器，而是打开一个弹窗，
   弹窗内用 `ChapterContactCard` 展示本分会联络人与二维码；
2. **移除页面内联的联络人卡片**：与弹窗内容完全相同，同一页面出现两遍是冗余；
   原来给待认证用户的提示改为落在「分会信息」行上——
   未设置 →「未设置 · 查看分会信息」，待认证 →「认证中 · 查看联络人」，其余 →「查看」；
3. **修改分会的能力保留**（方案要求「用户可在个人中心切换分会」且验收含
   「修改个人分会后后台人员归属立即转移」）：作为弹窗内的次要操作
   「修改所属分会」→ `uni.showActionSheet` 选分会 → 沿用原有确认文案
   「修改后将由新分会管理员维护资料」→ `PATCH /user/profile`。
   弹窗里也直接写明这句提示，避免用户以为改分会不需要确认；
4. **头像入口只保留编辑态**：删掉只读态里的「更换头像」按钮（H5）；
   编辑态两侧各保留一个——小程序是头像本体 +「获取头像」（`open-type="chooseAvatar"`），
   H5 是「更换头像」（`uni.chooseImage`）。
   顺带修掉一个假入口：H5 上头像本体的 `open-type="chooseAvatar"` 是空操作，
   点了没反应，现已用条件编译限制为仅小程序渲染。

### 12.4 真实浏览器实测（无头 Chrome，演示身份）

| 检查 | 结果 |
| --- | --- |
| 只读态「更换头像」按钮 | 0 个（只剩编辑态） |
| 编辑态「更换头像」按钮 | 1 个（含取消/保存） |
| 行文案 | 「分会信息 宁波分会 查看」；旧「分会设置」已消失 |
| 待认证时的行提示 | 「认证中 · 查看联络人」 |
| 点击行打开弹窗 | 弹窗出现，含「联络人信息 / 宁波分会 / 王老师 / ningbo_alumni」与二维码图片（src 为上传返回的 `/files/...`） |
| 弹窗内「修改所属分会」与提示文案 | 均存在 |
| 点遮罩关闭 | 正常关闭 |

产物核对：H5 中 `chooseAvatar` 出现 0 次、`更换头像` 1 次；小程序 wxml 中
`chooseAvatar` 出现 2 次、`分会设置` 0 次——条件编译符合预期。

---

## 13. 修复：管理端改了分会二维码，用户端看不见

### 13.1 现象

管理员在管理端上传并保存了分会微信二维码，用户端（含「我的 → 分会信息」弹窗）
一直显示旧图，**只有清掉本地存储才会更新**。

### 13.2 根因：分会列表被永久缓存

`src/composables/useChapters.ts` 早期实现：

```ts
if (!force && chapters.value.length) return chapters.value;   // 只要缓存非空就永不回源
```

分会数据写进 `alumni:chapters` 后，只要本地还有值就再也不请求，
于是管理端对联络人 / 微信号 / 二维码的任何改动都不会出现在用户端。

无头 Chrome 实测（改前）：

| 来源 | 二维码 |
| --- | --- |
| 管理端刚设置（后端已返回） | `5a5d3c17-…` |
| App 本地缓存 | `4b0da821-…` |
| 弹窗实际显示 | `700a6f89-…`（更早的一张） |

### 13.3 修法：先返回缓存，再后台回源（stale-while-revalidate）

- 缓存改成 `{ data, at }` 带时间戳；
- `loadChapters()`：
  - 有缓存 → **立即返回**（页面不阻塞），若距上次请求超过 `REFRESH_INTERVAL_MS`（10s）
    就在后台静默回源；拿到后更新响应式 `chapters`，弹窗与分会切换栏自动刷新；
  - 无缓存或 `force=true` → 等待请求结果。
- **兼容旧格式**：老版本存的是裸数组、没有时间戳，按「很久以前取过」处理（`at = 0`），
  所以老用户升级后第一次进页面就会回源并顺手把缓存升级成新格式，不会继续吃旧数据。

### 13.4 实测（无头 Chrome）

| 场景 | 结果 |
| --- | --- |
| 缓存后管理端换成 `96dc2511-…`，等 >10s 再进页面（**不清缓存**） | 弹窗显示 `96dc2511-…`，与后端一致 |
| 手工写入旧格式裸数组 + 过期二维码，再重开页面 | 弹窗显示当前二维码，`仍显示过期图: false`，缓存升级为 `{data, at}` |

### 13.5 顺带修掉：种子脚本写错了库字段名

`alumni-backend/dev/seed-demo.js` 里分会的二维码写成了 `qrCodeURL`（接口 JSON 名），
而库里字段是 `qr_code_url`（BSON 名）。`db.chapter` 里因此同时存在两种键名：
后端按 `qr_code_url` 读，`qrCodeURL` 那份永远读不到。

- 脚本已改为 `qr_code_url`，并加注释说明这里要写**库字段名**；
- 库里遗留的 `contact.qrCodeURL` 已清理（4 个分会、实际改动 2 个）。

> 教训：手写 seed 脚本时字段名要对齐 **BSON tag**，不是 JSON tag；两者不同名时极易踩坑。
