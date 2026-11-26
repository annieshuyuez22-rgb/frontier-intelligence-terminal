# FRONTIER Intelligence

全球前沿科技与资本情报看板。面向科技投资人、战略负责人、AI 产品负责人、创业者与数字营销负责人，以“事实摘要 → 关键数字 → 证据边界 → 本轮新增 → 来源 → 建议行动”组织情报。

这不是静态新闻页：真实 RSS/公开网页采集、持久化后台任务、证据映射、融资硬规则、版本历史、日报归档、手动刷新和可选独立推送均在服务端实现。无数据库或未连接第三方渠道时，可以使用明确标注的交互演示模式。

- GitHub：https://github.com/annieshuyuez22-rgb/frontier-intelligence-terminal
- Vercel：https://frontier-intelligence-terminal.vercel.app
- [数据模型与关键架构](docs/architecture.md)
- [日报示例（全部为虚构演示，未真实抓取）](docs/demo-brief.md)

## 已实现

- 今日简报、全量情报流、严格超 1B 融资、前沿行业、新叙事、数字营销、证据详情、归档、任务和设置页面。
- 中英文界面与英文摘要；浅色/深色、移动端筛选、键盘焦点和减少动画支持。
- PostgreSQL/Drizzle 持久化；真实数据与演示 fixtures 严格隔离。
- RSS/Atom、公开网页、手动链接；Tavily、X 官方 API、LinkedIn 官方 API 可替换适配器。
- SSRF 防护、不可信 HTML 纯文本化、同源 Mutation、scrypt 密码与服务端会话。
- 融资原币/FX/类型/阶段、严格 `> 1B USD`、恰好 `1B` 临界、估值与累计融资排除、异币种禁止直接相加。
- 72 小时增量回看、URL 与事件去重、同源转载不计独立证据、任务合并、租约恢复、错误审计与供应商成本记录。
- 事件日期不被新报道重置；新增证据和纠错保留 `EventVersion`；重大人工更正进入下一份日报。
- 管理员人工编辑与发布、结构化行动建议、独立来源组校验、来源启停与连接测试。
- 无 LLM 时只生成保守机器候选；可选 OpenAI-compatible 模型必须经过 JSON/Zod 校验，AI 推断独立保存；关注公司、竞品与业务目标作为明确的研究上下文。
- 新版 Vercel Schedules 调度采集恢复和独立日报投递；邮件/Webhook 默认关闭，独立幂等键防重发。
- 收藏、已读、隐藏和私人备注；公开 Markdown 导出与分享不包含私有数据。

## 技术栈

Next.js 16（App Router）· React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL · Drizzle ORM · postgres.js · Vitest · Vercel Schedules · Neon

生产运行不依赖 CloudBase。Node.js 推荐 24；Vercel 项目使用其受支持的新版本 Node.js。

## 本地运行

### 仅体验交互演示

```bash
npm install
npm run dev
```

不配置 `DATABASE_URL` 时自动进入演示模式。所有主体、链接和数字均为虚构，页面持续显示“演示数据”，不会执行真实收费采集。

### 运行真实产品

1. 准备 PostgreSQL（本地、Neon、Supabase 等），复制公开模板：

   ```bash
   cp .env.example .env
   ```

2. 在 `.env` 填写 `DATABASE_URL`，按需设置 `SETUP_TOKEN`、`CRON_SECRET`。真实密钥不得提交 Git。
3. 执行迁移并启动：

   ```bash
   npm run db:migrate
   npm run dev
   ```

4. 打开 `http://localhost:3000/setup` 创建首位管理员。若配置了 `SETUP_TOKEN`，页面需要输入同一初始化码。初始化会预置 NASA、Google DeepMind、arXiv cs.AI 和 NYT Technology 四个真实 RSS；可在设置中停用或修改。
5. 登录后点击“手动刷新”。按钮返回只表示任务已排队；任务页会展示采集、核验、生成、完成或部分失败。
6. 另开终端运行持久 worker，处理队列和崩溃恢复：

   ```bash
   npm run worker
   ```

`npm run worker` 会读取 `.env.local`，再读取 `.env`；已有 shell 环境变量优先。没有 worker 时，Next.js `after()` 仍会启动任务，但长期运行建议保留 worker。

## 环境变量

完整无密钥模板见 `.env.example`。

| 变量 | 必需性 | 用途 |
|---|---|---|
| `DATABASE_URL` / `POSTGRES_URL` | 真实模式必需 | PostgreSQL 连接；仅服务端 |
| `CRON_SECRET` | Vercel 调度必需 | Schedules 自动发送 `Authorization: Bearer …` |
| `SETUP_TOKEN` | 生产建议必需 | 防止访客在首次初始化时接管管理员；初始化后可删除 |
| `TAVILY_API_KEY` | 可选 | 搜索适配器；搜索摘要始终标记未读全文 |
| `TAVILY_ESTIMATED_COST_USD` | 可选 | 单次搜索内部预算估值，默认 `0.01`，不是供应商报价 |
| `X_BEARER_TOKEN` | 可选 | X 官方 Recent Search；需要对应开发者权限 |
| `X_API_BASE_URL` | 可选 | X API 端点替换 |
| `LINKEDIN_ACCESS_TOKEN` | 可选 | LinkedIn 官方组织 Posts API |
| `LINKEDIN_API_VERSION` / `LINKEDIN_API_BASE_URL` | 可选 | LinkedIn API 版本与端点 |
| `LLM_API_KEY` / `LLM_MODEL` / `LLM_BASE_URL` | 可选，三项同时配置 | OpenAI-compatible 编辑模型 |
| `LLM_ESTIMATED_COST_USD` | 可选 | 单次模型调用内部预算估值 |
| `LLM_EDIT_PREPRINTS` | 可选 | 默认 `false`，避免模型提升科研候选结论 |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | 可选 | 邮件投递；还需在用户设置中显式开启并填写收件人 |
| `WORKER_POLL_MS` / `WORKER_BATCH_SIZE` / `WORKER_ONCE` | 可选 | 本地 worker 行为 |

LinkedIn 还需要在来源配置中填写已授权的 `organizationId`；X/Tavily 需要查询语句。来源 `config` 不接收 API key，防止把密钥写入数据库或页面。

## 采集与核验

### 接入顺序

1. 在“设置 → 数据渠道”先测试 RSS 或手动链接。
2. 配置搜索、X、LinkedIn 的服务端凭证，再添加来源并测试。
3. 可选配置 LLM。未配置时，系统不会虚构中文总结、评分或行动建议；条目保持待核验和来源证据边界。
4. 配置关注主题、公司、竞品和业务目标，用于个性化排序与后续编辑。
5. 邮件/Webhook 是独立任务，默认关闭；填写目标并显式开启后才可能投递。

### 编辑边界

- 官方披露只表示出处，不表示官方主张必然成立。
- 第三方评测不写成官方基准；保留主体、协议、样本、harness、工具、环境、成本与失败案例。
- 预印本候选不等于独立复核、正式确认或同行评议。
- 搜索摘要不等于已读全文；付费墙、删除、无法访问分别标记。
- 同源转载不增加独立证据数，自动采集不因转载增多而提升核验级别。
- 缺失评分显示未知；优先级不是事实概率或投资收益预测，也不能覆盖融资硬门槛。

详细规则见 [架构说明](docs/architecture.md)。

## Vercel + Neon 部署

本项目使用新版 **Schedules**，不是旧版每日受限 Cron。Hobby 的 Schedules 可每 15 分钟运行，但存在最长 15 分钟抖动，因此应用按“本地时间已到期且该槽位尚未执行”补跑，而不是只接受一个精确分钟。

```bash
npx vercel link
npx vercel install neon --billing-plan free_v3 --meta region=sin1 --meta auth=false
npx vercel env pull
npm run db:migrate
openssl rand -hex 32 | npx vercel env add CRON_SECRET production
openssl rand -hex 32 | npx vercel env add SETUP_TOKEN production
npx vercel deploy --prod
```

预览和生产使用各自明确配置的数据库，避免测试数据进入生产。部署后：

1. 打开 `/setup`，使用初始化码创建管理员，然后删除 Vercel 中的 `SETUP_TOKEN`。
2. 在 Vercel Schedules 确认 `frontier-refresh-worker` 和 `frontier-brief-delivery` 均已启用。
3. 用 Schedules 的执行历史检查真实运行；`401` 通常表示 `CRON_SECRET` 未配置或不一致。
4. 手动执行一次采集，检查任务日志、来源最后成功时间和归档日报。
5. 只有显式配置投递目标后，才启用第二个调度任务；不推送时可禁用 `frontier-brief-delivery`。

长任务使用数据库游标、租约和心跳恢复，不假设单次 HTTP 请求可以无限运行。单步执行时长仍受 Vercel 套餐限制；超大来源应降低 `maxItems`，或运行外部持久 worker。

## 测试与验收

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run test:e2e
npm run build
```

真实端到端验收需要已迁移数据库和正在运行的本地应用：

```bash
npm run dev
# 另一个终端
npm run verify:live
```

`verify:live` 使用临时管理员和真实 RSS，验证未授权、并发刷新合并、真实采集、部分失败保留、私密导出边界和投递防重，最后按 ID 清理临时数据。不要在含有其他用户数据的环境运行；脚本会清理本次新增的测试事件。

规则测试覆盖：

- 估值 `$2B`、本轮 `$200M` 不进入超 1B；恰好 `$1B` 仅临界。
- 融资转载去重、不同轮次不合并、异币种不直接相加。
- 科研候选、第三方评测、旧事件新报道和重大更正。
- SSRF、跨站请求、未授权、演示隔离、真实任务执行和部分失败保留。
- 自动任务重跑不重复投递，所有演示关键数字可追溯到对应 fixture 来源。

本次交付实测：46 项 Vitest 全部通过；覆盖率约语句 84%、行 89%；5 项 Playwright 桌面/移动/中英文测试全部通过；13 项真实数据库与 RSS 端到端检查全部通过；TypeScript、ESLint、Next.js 生产构建通过；`npm audit --omit=dev` 为 0 漏洞。Playwright 默认使用本机 Chrome，可用 `CHROME_PATH` 和 `E2E_BASE_URL` 修改环境。

## 功能状态与外部限制

### 可运行

- 上述页面、PostgreSQL 持久化、真实 RSS/网页、后台任务、证据链、版本、筛选、归档、收藏备注、导出、预算与调度框架。
- 无凭证演示模式，以及渠道未连接和最后成功/尝试时间显示。

### 需要用户凭证或授权

- X：开发者套餐、Bearer Token 与可用 Recent Search 权限；未做成功调用验证前只显示未连接。
- LinkedIn：已授权应用、访问令牌和组织 ID；接口权限以 LinkedIn 审批为准。
- Tavily：API Key；计费以供应商为准。
- LLM：OpenAI-compatible 端点与模型；未配置不影响保守采集。
- Resend：已验证发件域名和 API Key；Webhook 目标由用户提供。
- 非美元 FX 使用 Frankfurter 公共 API；其可用性和支持币种是外部依赖，失败时资格保持未知。
- Vercel Git 自动部署：当前账户尚未添加 GitHub Login Connection；本次已用 Vercel CLI 真实部署，连接该授权后才可改为 push 自动部署。

### 明确限制

- 不绕过登录、付费墙或访问控制，不保存第三方全文。
- 进程内登录限流与 HTTP 缓存在多实例间不共享；需要多实例硬限流时可接 Redis。数据库任务与投递防重不依赖内存。
- 邮件/Webhook 使用数据库和供应商幂等，但“远端已接收、本地尚未写入 sent 时进程崩溃”无法保证绝对 exactly-once。
- 自动采集不会替代人工研究编辑；无独立证据时不自动宣称交叉核验。
- 当前为管理员共享来源、团队级公开事件；偏好、收藏、备注与任务访问受会话保护。
- `npm audit --omit=dev` 无生产依赖漏洞；开发工具链可能存在审计提示，不使用 `--force` 降级或破坏依赖来伪造“零漏洞”。

## 预计运行成本

基础假设：单管理员、每天一次 72 小时回看、4 个免费 RSS、每天最多一篇日报、不使用付费社交或 LLM。

| 项目 | 基础成本 | 假设 |
|---|---:|---|
| Vercel Hobby | `$0` | 在当期免费额度与用途政策内；Schedules 每 15 分钟唤醒 |
| Neon Free | `$0` | 在当期免费资源限额内，单数据库 |
| RSS / 手动公开网页 / Frankfurter | `$0` | 不绕过访问限制，公共端点可用 |
| 演示模式 | `$0` | fixtures 本地生成，不调用外部供应商 |
| Tavily | 按实际用量 | 内部默认估算 `$0.01/次` 仅用于预算，需以供应商报价替换 |
| X / LinkedIn / LLM / Resend | 未计入 | 完全取决于套餐、模型 token、域名与发送量 |

因此，**最小真实部署可为 `$0/月` 起步**，但不包含超额 Vercel/Neon、付费 API、自定义域名和人工编辑成本。每次调用量、内部估算费用、耗时和错误率记录在 `ProviderCall`；单次刷新和每日预算用于限制已定价调用，免费 RSS 在预算为 0 时仍可运行。

## 故障排查

- **一直显示演示数据**：确认 `DATABASE_URL` 存在，并用 `/api/mode` 或页面切换到 live；数据库连接失败不会静默转换成真实成功。
- **任务排队不动**：本地启动 `npm run worker`；Vercel 检查 Schedules、函数日志和任务租约。
- **部分失败**：查看来源级错误；已有事件不会删除。修复后可从任务页重试。
- **没有今日重点**：这是允许的真实空状态。检查 72 小时窗口内是否确有文档，不为填满页面降低门槛。
- **搜索有结果但未读全文**：这是预期行为；添加公开原文链接或允许访问的网页来源。
- **非美元金额未知**：检查 Frankfurter 是否支持币种及日期；系统不会猜测汇率。
- **导出缺少私人备注**：这是安全设计。备注仅属于当前用户，分享深链接不会公开。
- **迁移失败**：优先使用直连 `DATABASE_URL_UNPOOLED` 作为迁移时的 `DATABASE_URL`，应用运行时保留连接池地址。
