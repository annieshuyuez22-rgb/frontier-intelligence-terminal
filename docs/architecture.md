# 数据模型与关键架构

## 1. 系统边界

本产品把公开情报、用户私有数据、演示数据分成三个边界：

- **公开情报**：`SourceDocument → Claim/Citation → Event → DailyBrief`。真实记录始终为 `mode=live`。
- **用户私有数据**：`Preference`、`UserEventState`、私密备注、刷新任务和投递目标。API 需要服务端会话，Mutation 还需要同源校验。
- **演示数据**：仅位于 `src/lib/demo-data.ts`，主体明确虚构，链接使用 IANA 保留的 `example.com`，访问状态为 `demo_not_fetched`。不写入 PostgreSQL，不参与真实统计或推送。

```text
RSS / 公开网页 / 搜索 / X / LinkedIn
                │
                ▼
       可替换 Collector 适配器
       超时 / 限流 / 退避 / SSRF
                │
                ▼
        SourceDocument（必要摘录）
                │
                ▼
     确定性规则：URL / 事件 / 融资去重
     信息类型保留 / 原币与 FX / 硬门槛
                │
                ▼
       Event + Claim + Citation
       ├── 无模型：保守机器候选，待核验
       ├── 可选模型：Zod 校验，AI 推断独立
       └── EventVersion：新增、纠错、历史快照
                │
                ▼
          DailyBrief（真实空状态允许）
                │
                ├── 页面读取
                └── 独立 Delivery（显式开启才推送）

RefreshJob / cursor / lease / JobLog / ProviderCall 贯穿全程。
```

## 2. 核心表

| 实体 | 职责 | 关键约束 |
|---|---|---|
| `User` / `Session` | 管理员与私有会话 | 密码使用 scrypt；数据库只保存会话 token 的 SHA-256 |
| `Preference` | 时区、更新时间、关注对象、叙事定义、预算和投递配置 | 每个用户一条；邮件/Webhook 默认关闭 |
| `Source` | 采集渠道与适配器配置 | 密钥不存入 `config`；区分最后尝试和最后成功 |
| `SourceDocument` | 来源元数据与必要事实摘录 | `urlHash` 唯一；保存访问状态、是否全文、`originGroup`、内容 hash |
| `Event` | 情报事件与当前编辑版本 | `(mode, dedupeKey)` 唯一；事件日期与首次发现、更新时间分开 |
| `Claim` | 可核验主张 | `fact`、`analysis`、`ai_inference`、`correction` 分开 |
| `Citation` | 主张到来源的映射 | `(claimId, sourceDocumentId)` 唯一，保存支持/冲突关系和定位摘录 |
| `FundingRound` | 本轮融资结构化数据 | 原币、原金额、USD、FX 来源/日期、融资类型、阶段和门槛资格分开 |
| `Entity` / `EventEntity` | 公司、人物、机构等规范化实体 | 类型与名称联合唯一 |
| `Topic` / `EventTopic` | 叙事定义及多维信号 | 资金、讨论、技术、商业信号分别保存 |
| `EventVersion` | 更新、纠错和版本对比 | `(eventId, version)` 唯一；重大更正单独标记 |
| `DailyBrief` | 某时区某日的日报及覆盖统计 | 只引用真实事件；允许空日报 |
| `UserEventState` | 收藏、已读、隐藏、私人备注 | `(userId, eventId)` 唯一；不出现在公开导出或分享中 |
| `RefreshJob` | 持久化采集任务 | 幂等键唯一；游标、租约、心跳、预算、错误与状态可恢复 |
| `JobLog` | 任务审计日志 | 保留来源级错误和阶段信息 |
| `ProviderCall` | 调用量、估算费用、耗时与错误 | 支撑单次和每日预算、运行成本统计 |
| `Delivery` | 邮件或 Webhook 投递 | `brief + channel + targetHash` 独立幂等键唯一 |

完整字段定义见 `src/db/schema.ts`，可重复迁移见 `drizzle/`。

## 3. 融资硬规则

融资判断在 `src/lib/funding.ts`，不依赖 LLM：

1. 仅股权和无法完全拆分的混合融资进入默认主列表；债务、授信、补贴、并购、基金募资单列。
2. 可靠换算后的本轮金额 **严格大于** 1,000,000,000 USD 才是 `strict`；恰好等于为 `borderline`。
3. 传闻和洽谈为 `unknown`，不能进入“已核实超 1B”。签约、宣布、完成交割分别保存。
4. 估值、累计融资、基金规模、订单、资本开支、意向投资不作为本轮股权融资。
5. 非美元没有带来源和日期的可靠汇率时，美元金额和门槛资格保持未知。
6. `sumSameCurrency` 遇到不同币种直接返回 `null`，禁止直接相加。
7. 同一公司、轮次、原币金额与融资类型的报道聚合；转载 URL 的跟踪参数会被清理。新增报道新增证据，不重置事件日期。

优先级评分是编辑排序工具，不是事实概率或收益预测，且永远无法覆盖上述硬筛选。缺数据时维度为 `null`，界面显示“未知”。

## 4. 证据与编辑规则

- `official` 只描述出处；不会被解释成官方结论已经独立验证。
- `third_party_review` 不被自动提升为 `official`；评测主体、协议、样本、harness、环境与成本进入指标或证据边界。
- `preprint` 保持预印本身份；候选、独立复核、正式确认和同行评议不能互相替换。默认不允许模型改写预印本。
- 搜索摘要 `isFullText=false`，页面明确“未读全文”。访问失败、付费墙、删除和无法访问保留状态。
- `originGroup` 使用规范化标题与发布日期归组，同题同日的跨站转载不累计为独立交叉证据。自动采集不会因为转载数量增加而提升核验级别。
- 无模型时只保存保守机器摘录，标记 `pending` 与 `single_source/insufficient`，不伪造中文总结、评分或行动建议。
- 模型只接收必要的不可信文本和用户明确配置的研究偏好，不获得工具、环境变量或密钥。输出经 JSON/Zod 校验，指标必须映射来源索引，行动包含材料/验证/产物，总分按固定权重计算；失败时保留旧版本。
- 管理员可通过人工编辑修正标题、摘要、日期、证据边界和行动建议。人工修改单独写入 correction claim 与 EventVersion；修改日期自动构成重大更正，单来源组不能手动提升为交叉核验。

## 5. 后台任务与调度

手动刷新先写入 `RefreshJob`，再通过 Next.js `after()` 启动真实执行；响应本身不等于采集完成。

- 同一用户 15 分钟内的同窗口请求合并；事务与 PostgreSQL advisory lock 防并发重复。
- 默认回看 72 小时；`sourceIndex`、来源游标、文档处理游标持久化。
- 活跃任务通过租约和心跳声明所有权；崩溃后由本地 worker 或 Vercel Schedules 恢复。
- 状态为 `queued → collecting → verifying → generating → completed/partial/failed`。
- 单个来源失败只记录错误和日志，不删除旧文档或事件。
- 采集和推送使用不同调度、不同幂等键。已发送记录不会因自动任务重跑再次发送。

`vercel.json` 使用新版 Schedules，每 15 分钟调用 worker，并独立检查投递。应用按每个用户的 IANA 时区与本地时间判断是否到期，因此夏令时不依赖固定 UTC 偏移。Hobby 的调度抖动要求“到期后补跑”，不能只接受恰好一个 15 分钟窗口。

本地长期运行可使用 `npm run worker`，无需依赖浏览器保持打开。

## 6. 安全边界

- 所有供应商密钥只读服务端环境变量；`.env*` 被 Git 忽略。
- `secureFetch` 只允许 HTTP(S)，拒绝凭据 URL、私网、回环、链路本地、云 metadata 与特殊地址；DNS 解析后固定目标 IP，每次重定向重新校验。
- 限制响应大小、超时与重定向次数；跨源重定向移除认证头。
- HTML 只转换为纯文本；React 不使用不可信 `dangerouslySetInnerHTML`。
- 登录、设置、任务、收藏与投递接口进行服务端授权；Mutation 校验 Origin/Fetch-Site。
- 公开导出只包含公开事件及来源，不包含私人备注、偏好、投递目标或任务游标。
- Webhook 使用同一 SSRF 防护。数据库与供应商幂等降低重复发送风险，但远端已接收、本地尚未落库时进程崩溃，不能承诺数学意义上的 exactly-once。

## 7. 已知扩展点

- 搜索、X、LinkedIn 与 LLM 都采用独立适配器；未配置不会阻塞 RSS 和公开网页。
- 当前来源由管理员共享，事件为团队级公开情报；用户偏好、任务、收藏和备注私有。
- 进程内 HTTP 缓存和登录限流在多实例间不共享；持久防重依赖 PostgreSQL。需要多实例硬限流时可接 Redis，而无需改变任务模型。
- 长时间任务的可恢复性不依赖单个 HTTP 请求，但单步最长执行时间仍受 Vercel 套餐和函数配置约束。
