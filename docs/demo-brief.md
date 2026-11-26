# 全球前沿科技与资本情报｜日报示例

> **演示数据/虚构主体/未真实抓取。** 本文所有主体、数字、评测、引文与链接均为界面和规则验收而虚构；不代表真实新闻、真实融资或真实采集，不进入真实统计或推送。

- 日期：2026-11-26
- 时区：UTC
- 覆盖：2026-11-26T00:00:00.000Z 至 2026-11-26T23:59:59.999Z
- 样本：10 条虚构事件
- 渠道：演示 RSS（虚构条目，未真实抓取）；虚构官方/媒体/预印本/第三方评测/客户自报 fixtures；X、LinkedIn、search 未连接，未贡献样本
- 统计边界：coverage 仅描述虚构 fixture 的编排窗口，样本为 10 条手工编写事件，不是现实抽样。旧事件首次收录早于窗口，本轮计 majorUpdates 而非 newEvents。未连接 X/LinkedIn/search，无真实抓取、全网代表性或渠道覆盖率；采集增加、来源增加和演示社交计数均不得当作现实热度上升。
- 新增 9｜重大更新 1｜严格融资 2｜待核验 3

演示数据/虚构主体/未真实抓取。本日报汇总 10 条演示事件，其中 9 条为本覆盖窗口新增记录，1 条为旧事件新增来源与重大更正。严格口径共 2 条：1 条股权融资、1 条混合融资；混合融资的股权拆分未知，不将融资包总额称为股权。恰好 10 亿美元、估值高于融资额和金额不明均不得混入 strict。3 条证据不足记录进入待核验。未连接渠道没有贡献样本，采集条数或新增来源变化不能被解释为真实热度。

## 今日最值得行动

1. **复核五类融资门槛分支**（high）
   - 材料：strict、borderline、估值不等于融资、EUR 混合拆分未知、金额未知五条演示事件及其 funding 字段。
   - 验证：分别按股权融资与混合融资规则重算，确认股权示例和 EUR 混合融资示例进入 qualifiedFunding，同时保留混合拆分未知标记。
   - 预期产物：一份五行门槛判定表，含原币、USD、FX、工具类型、splitUnknown 和排除理由。
2. **清理三条待核验记录的证据缺口**（high）
   - 材料：金额不明融资、候选预印本、RSI 社交叙事的 sources、claims 和 actions。
   - 验证：分别补齐金额条款、独立科研复核、自主 RSI 闭环；社交计数不得替代技术或商业证据。
   - 预期产物：三张证据缺口卡，未补证前维持 pending 与 insufficient。
3. **归档旧事件重大更正与去重时间线**（medium）
   - 材料：evt-demo-old-event-new-report-major-correction 的两个版本、三条来源和四个时间字段。
   - 验证：核对 eventDate=2026-10-18，确认新增来源不生成新事件，撤回内容只作审计保留。
   - 预期产物：一份字段级更正对照单、单事件时间线和新增来源映射。

---

## 【演示】澄序智能完成 $1.2B 虚构股权融资，符合严格门槛

- 分类：大额融资
- 信息性质：官方披露
- 核验状态：已交叉核验
- 事件日期：2026-11-25；发布：2026-11-26T08:00:00.000Z；首次发现：2026-11-26T08:12:00.000Z；最近更新：2026-11-26T09:05:00.000Z
- 标签：股权融资、严格门槛、人工智能基础设施、澄序智能（虚构）、林演示（虚构首席财务官）、虚构北美、虚构新加坡

### 事实摘要

演示数据/虚构主体/未真实抓取。澄序智能（虚构）披露已完成 12 亿美元股权融资，币种为 USD，原币金额与 USD 金额一致，汇率为 1。虚构官方交割公告与一家虚构独立媒体的交易备忘录报道相互印证，因此仅在演示集内标为 cross_verified。该金额是本轮股权融资而非估值、授信或基金募资，按“严格超过 10 亿美元”规则归为 strict。

### English summary

Demo data; fictional entities; not actually fetched. The fictional company Asterq Intelligence reports a closed USD 1.2 billion equity round. A fictional official closing notice and one fictional independent media report cross-check the amount within this fixture only. The figure denotes equity financing, not valuation, credit, or fund raising, so it qualifies as strict because it is greater than USD 1 billion.

### 关键数字

- **本轮股权融资（原币）：1200000000 美元（USD）** [来源](https://example.com/demo/fictional/asterq/series-g-closing)
  - 周期：虚构交割日 2026-11-25
  - 样本：一份虚构官方交割公告与一份虚构独立媒体备忘录
  - 口径与限制：仅计本轮新增股权融资，不含估值、债务、授信和基金募资。
- **本轮股权融资（USD）：1200000000 美元（USD）** [来源](https://example.com/demo/fictional/independent-media/asterq-round-memo)
  - 口径与限制：USD 原币采用 1 USD/USD 恒等汇率；12 亿美元严格大于 10 亿美元。
- **FX 换算率：1 USD/USD** [来源](https://example.com/demo/fictional/asterq/series-g-closing)
  - 周期：2026-11-26
  - 样本：虚构演示汇率表，未真实抓取
  - 口径与限制：原币已是 USD，不引入外部汇率或跨日换算误差。
- 融资类型：股权融资；阶段：完成交割；资格：严格超过 $1B
- 原币：1200000000 USD；USD：1200000000；FX：1（https://example.com/demo/fictional-fx/2026-11-26/usd-usd，2026-11-26）；拆分未知：否

### 为什么值得关注

该条演示了严格融资门槛、原币与 USD 字段、FX 恒等换算以及官方和独立媒体双来源核验如何同时成立；所有证据链均为虚构演示。

### 证据边界与未知项

cross_verified 只表示两条虚构来源在 fixture 内交叉一致，不代表现实核验。没有真实公告、真实媒体页面、真实资金到账或真实抓取记录。

### 本轮新增

本窗口新增一条虚构融资事件及两条虚构来源，不对应任何现实新增融资。

### 事实、分析与 AI 推断

- **事实**：事实（限演示）：两类虚构来源均记载本轮新增股权融资为 12 亿美元，并于 2026-11-25 完成虚构交割。 来源：[【演示数据｜虚构主体】澄序智能股权融资交割公告](https://example.com/demo/fictional/asterq/series-g-closing)；[【演示数据｜虚构独立媒体】澄序融资交易备忘录复核](https://example.com/demo/fictional/independent-media/asterq-round-memo)
- **分析**：分析：12 亿美元严格大于 10 亿美元，且工具类型为股权，因此可进入 strict；估值不参与本次判定。 来源：[【演示数据｜虚构主体】澄序智能股权融资交割公告](https://example.com/demo/fictional/asterq/series-g-closing)；[【演示数据｜虚构独立媒体】澄序融资交易备忘录复核](https://example.com/demo/fictional/independent-media/asterq-round-memo)

### 建议你

1. **核对交割文件与股权性质**（high）
   - 材料：虚构官方公告、虚构交割清单、虚构股东名册摘录；来源 src-demo-strict-official。
   - 验证：逐项比对金额、币种、股份发行、交割状态和签署日期，排除估值与旧轮融资重复计入。
   - 预期产物：一张含金额、币种、工具类型、交割状态和证据定位的股权融资核验表。
2. **复核独立媒体证据链**（medium）
   - 材料：虚构独立媒体备忘录及虚构投资人访谈摘要；来源 src-demo-strict-media。
   - 验证：确认第二来源不是官方公告转载，并重算 12 亿美元是否严格超过门槛。
   - 预期产物：一份双来源一致性记录和 strict 判定复算单。

### 来源清单

- [【演示数据｜虚构主体】澄序智能股权融资交割公告](https://example.com/demo/fictional/asterq/series-g-closing)｜demo_official｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。公告模板载明本轮为新增股权融资，金额 1,200,000,000 USD，2026-11-25 完成虚构交割；USD/USD 汇率为 1，不包含估值或债务。
- [【演示数据｜虚构独立媒体】澄序融资交易备忘录复核](https://example.com/demo/fictional/independent-media/asterq-round-memo)｜demo_media｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。虚构记者依据独立交易备忘录与访谈模板核对股权融资金额为 12 亿美元；该媒体不是官方公告转载，USD 金额同样为 12 亿美元。

### 优先级（编辑排序，不是事实概率或收益预测）

- 主题相关性：96｜直接命中大额股权融资主筛选，且门槛判定明确。
- 证据质量：92｜两类虚构来源交叉一致，但现实证据强度未被评估。
- 产业影响：95｜演示资本规模较大，适合展示高优先级融资卡片。
- 新颖性：78｜本窗口新增演示记录，但不主张现实新颖性。
- 可行动性：90｜交割、股权性质与独立来源均有可执行的复核步骤。

### 更新历史

- v1｜2026-11-26T09:05:00.000Z｜建立虚构股权融资记录，完成双来源与严格门槛演示判定。

---

## 【演示】冰脊计算虚构股权融资恰好 $1B，仅列 borderline

- 分类：大额融资
- 信息性质：官方披露
- 核验状态：单一来源
- 事件日期：2026-11-26；发布：2026-11-26T07:40:00.000Z；首次发现：2026-11-26T07:52:00.000Z；最近更新：2026-11-26T08:20:00.000Z
- 标签：股权融资、门槛边界、计算基础设施、冰脊计算（虚构）、顾样例（虚构首席执行官）、虚构欧洲

### 事实摘要

演示数据/虚构主体/未真实抓取。冰脊计算（虚构）宣布本轮股权融资恰好 10 亿美元，USD 原币与 USD 金额均为 1,000,000,000，汇率为 1。严格规则要求大于而非大于等于 10 亿美元，因此该条只能标为 borderline，不能进入 strict，也不计入 qualifiedFunding。当前仅有一份虚构公司公告，尚无独立来源复核。

### English summary

Demo data; fictional entities; not actually fetched. Nunatak Computing announces exactly USD 1.0 billion of equity financing. The strict rule is greater than, not greater than or equal to, USD 1 billion. This event is therefore borderline, excluded from strict and from qualifiedFunding. Only one fictional company notice is present.

### 关键数字

- **本轮股权融资：1000000000 美元（USD）** [来源](https://example.com/demo/fictional/nunatak/exactly-one-billion)
  - 周期：虚构公告日 2026-11-26
  - 样本：单一虚构公司公告
  - 口径与限制：原币为 USD，按 1 USD/USD 换算；不包含估值。
- **严格门槛比较：1.000B = 1.000B，不满足 >（USD）** [来源](https://example.com/demo/fictional/nunatak/exactly-one-billion)
  - 口径与限制：恰好等于门槛只能归为 borderline，禁止进入 strict。
- 融资类型：股权融资；阶段：已宣布；资格：临界关注（恰好 $1B）
- 原币：1000000000 USD；USD：1000000000；FX：1（https://example.com/demo/fictional-fx/2026-11-26/usd-usd，2026-11-26）；拆分未知：否

### 为什么值得关注

用于明确区分恰好达到门槛与严格超过门槛，避免把 borderline 错计入合格融资。

### 证据边界与未知项

金额、股权性质和宣布状态均只来自虚构官方模板；没有真实抓取或独立媒体确认。

### 本轮新增

新增恰好 10 亿美元的虚构边界样例，不代表新增真实交易。

### 事实、分析与 AI 推断

- **事实**：事实（限演示）：虚构公告披露的股权融资恰好为 10 亿美元，不是约数。 来源：[【演示数据｜虚构主体】冰脊计算十亿美元股权融资公告](https://example.com/demo/fictional/nunatak/exactly-one-billion)
- **分析**：分析：严格规则使用 > 而非 >=，因此本事件为 borderline，不能进入 strict。 来源：[【演示数据｜虚构主体】冰脊计算十亿美元股权融资公告](https://example.com/demo/fictional/nunatak/exactly-one-billion)

### 建议你

1. **核验最终交割金额是否变化**（high）
   - 材料：虚构公司公告、虚构认购协议金额页和最终交割清单模板。
   - 验证：区分宣布金额与实际交割金额；只有最终股权金额严格大于 10 亿美元时才允许改判。
   - 预期产物：一份宣布额、交割额和门槛符号三栏对照表。
2. **补齐独立来源**（medium）
   - 材料：虚构投资方法律文件索引与独立媒体检索清单，均未真实抓取。
   - 验证：寻找非转载的独立证据，并核对是否包含后续追加认购。
   - 预期产物：一份独立来源核验记录；若无新增证据则保留 single_source。

### 来源清单

- [【演示数据｜虚构主体】冰脊计算十亿美元股权融资公告](https://example.com/demo/fictional/nunatak/exactly-one-billion)｜demo_official｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。公告模板载明股权融资总额恰好 1,000,000,000 USD，USD/USD 汇率为 1；未披露追加认购，也未提供独立媒体证据。

### 优先级（编辑排序，不是事实概率或收益预测）

- 主题相关性：82｜位于融资门槛边界，适合规则复核。
- 证据质量：72｜仅有虚构官方单一来源，独立确认不足。
- 产业影响：80｜演示金额较大，但不能越过严格符号。
- 新颖性：70｜本窗口新增边界 fixture，不代表现实新颖性。
- 可行动性：76｜可通过最终交割文件和追加认购记录消除边界歧义。

### 更新历史

- v1｜2026-11-26T08:20:00.000Z｜建立恰好 10 亿美元的虚构边界样例，明确排除 strict。

---

## 【演示】格风生物估值 $2B 但本轮仅 $200M，不符合主筛选

- 分类：大额融资
- 信息性质：官方披露
- 核验状态：单一来源
- 事件日期：2026-11-25；发布：2026-11-26T06:50:00.000Z；首次发现：2026-11-26T07:02:00.000Z；最近更新：2026-11-26T07:30:00.000Z
- 标签：估值口径、股权融资、生物技术、格风生物（虚构）、周虚构（虚构财务负责人）、虚构英国

### 事实摘要

演示数据/虚构主体/未真实抓取。格风生物（虚构）披露投后估值 20 亿美元，本轮实际股权融资为 2 亿美元。估值是交易定价指标，不等于公司本轮收到的融资额；主筛选只使用本轮融资金额，因此该条为 ineligible，不得因 20 亿美元估值进入 strict 或 borderline。金额口径不得因高估值而改变。

### English summary

Demo data; fictional entities; not actually fetched. LatticeWind Bio reports a USD 2 billion post-money valuation but only USD 200 million of new equity financing. Valuation is a pricing measure, not financing proceeds. The primary filter uses the round amount, so this event is ineligible and must not be promoted by its valuation.

### 关键数字

- **投后估值：2000000000 美元（USD）** [来源](https://example.com/demo/fictional/latticewind/valuation-vs-round)
  - 周期：虚构本轮定价日 2026-11-25
  - 口径与限制：估值仅用于交易定价，不计入本轮融资金额。
- **本轮股权融资：200000000 美元（USD）** [来源](https://example.com/demo/fictional/latticewind/valuation-vs-round)
  - 周期：虚构公告日 2026-11-26
  - 口径与限制：仅计新增股权资金；2 亿美元低于 10 亿美元门槛。
- **FX 换算率：1 USD/USD** [来源](https://example.com/demo/fictional/latticewind/valuation-vs-round)
  - 周期：2026-11-26
  - 口径与限制：估值和融资额原币均为 USD，使用恒等汇率。
- 融资类型：股权融资；阶段：已宣布；资格：不符合主筛选
- 原币：200000000 USD；USD：200000000；FX：1（https://example.com/demo/fictional-fx/2026-11-26/usd-usd，2026-11-26）；拆分未知：否

### 为什么值得关注

防止把高估值误写成大额融资，是资本情报去重与口径控制的基础反例。

### 证据边界与未知项

估值与融资额均来自同一虚构公告；没有真实财务文件或第三方定价复核。

### 本轮新增

新增估值与融资额分离的虚构反例，未新增任何现实投资结论。

### 事实、分析与 AI 推断

- **事实**：事实（限演示）：虚构公告分别列出 20 亿美元投后估值和 2 亿美元本轮股权融资。 来源：[【演示数据｜虚构主体】格风生物定价与认购金额公告](https://example.com/demo/fictional/latticewind/valuation-vs-round)
- **分析**：分析：估值不等于融资；按本轮 2 亿美元判定，本事件为 ineligible。 来源：[【演示数据｜虚构主体】格风生物定价与认购金额公告](https://example.com/demo/fictional/latticewind/valuation-vs-round)

### 建议你

1. **分离估值与融资字段**（high）
   - 材料：虚构公告的估值段、认购金额段和股份发行表。
   - 验证：确认 20 亿美元只进入 valuation 语义，2 亿美元才进入 amountOriginal 与 amountUsd。
   - 预期产物：一张估值、融资额、筛选字段映射表，并标记 ineligible。
2. **检查是否存在未计入的并行融资**（medium）
   - 材料：虚构公告附件目录与虚构投资协议清单。
   - 验证：核对是否有独立债务或另一轮股权；无明确文件不得把估值差额解释为融资。
   - 预期产物：一份并行工具排查记录，结论缺失时维持 2 亿美元口径。

### 来源清单

- [【演示数据｜虚构主体】格风生物定价与认购金额公告](https://example.com/demo/fictional/latticewind/valuation-vs-round)｜demo_official｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。公告模板分别载明投后估值 2,000,000,000 USD、本轮新增股权融资 200,000,000 USD；两者原币均为 USD，汇率为 1，无其他并行融资披露。

### 优先级（编辑排序，不是事实概率或收益预测）

- 主题相关性：70｜不符合金额门槛，但对口径纠错高度相关。
- 证据质量：86｜两个数字在虚构公告中明确分开，独立来源仍不足。
- 产业影响：58｜实际演示融资规模较小，不以估值放大影响。
- 新颖性：64｜作为本窗口新增反例具有教学价值。
- 可行动性：72｜字段分离和并行工具排查均可直接执行。

### 更新历史

- v1｜2026-11-26T07:30:00.000Z｜将估值与实际融资分开建账，标记 ineligible。

---

## 【演示】弥珥能源 €960M 混合融资换算超过 $1B，股权拆分未知

- 分类：大额融资
- 信息性质：官方披露
- 核验状态：已交叉核验
- 事件日期：2026-11-25；发布：2026-11-26T06:20:00.000Z；首次发现：2026-11-26T06:31:00.000Z；最近更新：2026-11-26T08:45:00.000Z
- 标签：混合融资、EUR/USD、能源基础设施、弥珥能源（虚构）、韩示例（虚构项目财务总监）、虚构欧盟

### 事实摘要

演示数据/虚构主体/未真实抓取。弥珥能源（虚构）公布 9.6 亿欧元混合融资，按演示汇率 1 EUR = 1.16 USD（汇率日期 2026-11-25）换算为 11.136 亿美元。融资包同时包含股权与项目信贷，但两部分拆分未知，splitUnknown=true，不能把全部金额写成股权。按产品规则，混合融资以融资包总额判断 strict，因此本条进入混合融资主列表；这不代表股权部分单独超过 10 亿美元。

### English summary

Demo data; fictional entities; not actually fetched. Mereon Energy announces EUR 960 million of mixed financing. Using the fictional FX rate of 1 EUR = 1.16 USD dated 2026-11-25, the package equals USD 1.1136 billion. It contains equity and project credit, but the split is unknown and splitUnknown is true. The full amount must not be labelled equity. The mixed package qualifies as strict under the product rule; this does not establish that its equity component alone exceeds USD 1 billion.

### 关键数字

- **混合融资总额（原币）：960000000 欧元（EUR）** [来源](https://example.com/demo/fictional/mereon/mixed-financing-eur-960m)
  - 周期：虚构公告日 2026-11-26
  - 口径与限制：融资包包含股权和项目信贷，不得全部归为股权。
- **EUR/USD 演示汇率：1.16 USD per EUR** [来源](https://example.com/demo/fictional/independent-media/mereon-financing-structure)
  - 周期：2026-11-25
  - 样本：虚构 FX 表，未真实抓取
  - 口径与限制：960,000,000 EUR × 1.16 = 1,113,600,000 USD。
- **混合融资总额（USD）：1113600000 美元（USD）** [来源](https://example.com/demo/fictional/mereon/mixed-financing-eur-960m)
  - 口径与限制：仅为融资包总额换算，不代表股权部分金额。
- **股权/信贷拆分：未知** [来源](https://example.com/demo/fictional/independent-media/mereon-financing-structure)
  - 样本：虚构公告与虚构独立媒体均未给出比例
  - 口径与限制：splitUnknown=true；在拆分明确前，股权资格保持 unknown。
- 融资类型：混合融资；阶段：已宣布；资格：严格超过 $1B
- 原币：960000000 EUR；USD：1113600000；FX：1.16（https://example.com/demo/fictional-fx/2026-11-25/eur-usd，2026-11-25）；拆分未知：是

### 为什么值得关注

同时演示非 USD 换算、混合工具拆分和严格股权门槛，避免用融资包总额替代股权金额。

### 证据边界与未知项

总额和工具范围由两类虚构来源支持，但股权/信贷比例、各自交割状态均未披露；FX 也是虚构演示值。

### 本轮新增

新增 EUR 混合融资 fixture 与 FX 字段，不代表真实欧元交易或真实汇率。

### 事实、分析与 AI 推断

- **事实**：事实（限演示）：9.6 亿欧元融资包包含股权和项目信贷，按演示汇率换算为 11.136 亿美元，拆分未披露。 来源：[【演示数据｜虚构主体】弥珥能源混合融资包公告](https://example.com/demo/fictional/mereon/mixed-financing-eur-960m)；[【演示数据｜虚构独立媒体】弥珥融资包结构核对](https://example.com/demo/fictional/independent-media/mereon-financing-structure)
- **分析**：分析：混合融资包按总额进入 strict 混合主列表，但这不代表股权部分单独超过门槛；splitUnknown=true 时必须保留拆分边界。 来源：[【演示数据｜虚构主体】弥珥能源混合融资包公告](https://example.com/demo/fictional/mereon/mixed-financing-eur-960m)；[【演示数据｜虚构独立媒体】弥珥融资包结构核对](https://example.com/demo/fictional/independent-media/mereon-financing-structure)

### 建议你

1. **取得股权与信贷拆分表**（high）
   - 材料：虚构融资包条款清单、股权认购页、项目信贷额度页。
   - 验证：分别确认工具类型、金额、期限和是否交割，禁止把信贷额度当作股权到账。
   - 预期产物：一份股权与信贷分行列示的拆分表，以及可重新判定的股权 USD 金额。
2. **复算 EUR 到 USD 的换算链**（medium）
   - 材料：虚构 FX 表、汇率日期 2026-11-25、原币总额 9.6 亿欧元。
   - 验证：检查汇率方向、日期和乘法精度，保留原币、USD、FX 来源与日期四组字段。
   - 预期产物：一份可复算的 FX 审计行：960,000,000 × 1.16 = 1,113,600,000 USD。

### 来源清单

- [【演示数据｜虚构主体】弥珥能源混合融资包公告](https://example.com/demo/fictional/mereon/mixed-financing-eur-960m)｜demo_official｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。公告模板载明融资包总额为 960,000,000 EUR，含股权和项目信贷，但未给出拆分；按虚构汇率 1.16 换算总额为 1,113,600,000 USD。
- [【演示数据｜虚构独立媒体】弥珥融资包结构核对](https://example.com/demo/fictional/independent-media/mereon-financing-structure)｜demo_media｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。独立报道模板确认 9.6 亿欧元为股权与项目信贷混合包，未披露股权比例；引用的演示 FX 表日期为 2026-11-25，1 EUR = 1.16 USD。

### 优先级（编辑排序，不是事实概率或收益预测）

- 主题相关性：90｜总融资包越过演示金额线，但股权资格仍需拆分。
- 证据质量：82｜总额有双虚构来源，关键股权比例却缺失。
- 产业影响：88｜演示融资包规模较大，潜在影响取决于工具结构。
- 新颖性：76｜本窗口新增非 USD 混合融资样例。
- 可行动性：72｜拆分条款与 FX 链均有明确核验产物。

### 更新历史

- v1｜2026-11-26T08:45:00.000Z｜记录 EUR 原币、USD 换算和混合工具拆分未知，未将总额归为股权。

---

## 【演示】奎隆材料宣布融资但未披露金额，资格保持 unknown

- 分类：大额融资
- 信息性质：官方披露
- 核验状态：证据不足
- 事件日期：2026-11-26；发布：2026-11-26T05:40:00.000Z；首次发现：2026-11-26T05:55:00.000Z；最近更新：2026-11-26T06:15:00.000Z
- 标签：金额未知、融资核验、先进材料、奎隆材料（虚构）、唐空白（虚构公司秘书）、虚构澳大利亚

### 事实摘要

演示数据/虚构主体/未真实抓取。奎隆材料（虚构）仅宣布已签署一项融资安排，没有披露原币金额、USD 金额、工具构成或估值。金额字段保持 null，disclosed=false，splitUnknown=true，funding.type=unknown，qualification=unknown；不得根据公司规模、新闻措辞或估值猜测其超过 10 亿美元。

### English summary

Demo data; fictional entities; not actually fetched. Quillon Materials announces a signed financing arrangement without disclosing the amount, currency amount, instrument mix, or valuation. Amount fields remain null, disclosed is false, splitUnknown is true, and both funding type and qualification are unknown. No threshold inference is permitted.

### 关键数字

- **本轮融资金额：未披露** [来源](https://example.com/demo/fictional/quillon/undisclosed-financing)
  - 周期：虚构公告日 2026-11-26
  - 样本：单一虚构简式公告
  - 口径与限制：amountOriginal=null、amountUsd=null；未知不等于零，也不等于超过门槛。
- **FX 与工具拆分：未知** [来源](https://example.com/demo/fictional/quillon/undisclosed-financing)
  - 口径与限制：无原币金额，故 fxRate、fxSource、fxDate 均为 null；splitUnknown=true。
- 融资类型：类型未知；阶段：签约；资格：金额或换算未知
- 原币：未知 USD；USD：未知；FX：未知（来源未知，日期未知）；拆分未知：是

### 为什么值得关注

展示金额缺失时的保守写法，防止 null 被当作零或被 AI 补全为大额融资。

### 证据边界与未知项

唯一虚构公告没有金额与工具细节，既无法验证融资规模，也无法确认股权比例。

### 本轮新增

新增金额不明的待核验 fixture，没有可计入 strict 的金额证据。

### 事实、分析与 AI 推断

- **事实**：事实（限演示）：虚构公告确认存在融资安排，但没有披露金额和工具构成。 来源：[【演示数据｜虚构主体】奎隆材料融资安排简式公告](https://example.com/demo/fictional/quillon/undisclosed-financing)
- **分析**：分析：金额未知时不能进入 strict，也不能把 null 解释为零或用估值补全。 来源：[【演示数据｜虚构主体】奎隆材料融资安排简式公告](https://example.com/demo/fictional/quillon/undisclosed-financing)

### 建议你

1. **索取金额与工具条款页**（high）
   - 材料：虚构简式公告、虚构签署协议目录和投资人清单模板。
   - 验证：只接受明确金额、币种和工具类型的条款页，不用估值或员工规模反推。
   - 预期产物：一份金额、币种、工具类型和证据页码齐全的补充记录。
2. **审计空值与门槛状态**（medium）
   - 材料：本事件 funding 字段和演示筛选规则。
   - 验证：确认未知金额不会被转成 0、1B 或股权融资，且不会进入 strict 统计。
   - 预期产物：一份空值传播检查单，qualification 维持 unknown。

### 来源清单

- [【演示数据｜虚构主体】奎隆材料融资安排简式公告](https://example.com/demo/fictional/quillon/undisclosed-financing)｜demo_official｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。公告模板只称融资安排已签署，未披露金额、币种、工具构成或估值；没有可用于 FX 换算或股权门槛判断的数据。

### 优先级（编辑排序，不是事实概率或收益预测）

- 主题相关性：74｜属于融资议题，但缺少门槛所需的核心字段。
- 证据质量：42｜只有无金额的虚构简式公告。
- 产业影响：未知｜金额和工具未知，无法评估资本影响。
- 新颖性：60｜本窗口新增演示记录，不主张现实事件新颖。
- 可行动性：78｜补齐条款页和审计空值是明确的下一步。

### 更新历史

- v1｜2026-11-26T06:15:00.000Z｜建立金额未知 fixture，保留空值并进入待核验。

---

## 【演示】预印本报告候选蛋白质构象信号，尚非确认发现

- 分类：前沿行业
- 信息性质：研究预印本
- 核验状态：证据不足
- 事件日期：2026-11-25；发布：2026-11-26T04:30:00.000Z；首次发现：2026-11-26T04:45:00.000Z；最近更新：2026-11-26T07:15:00.000Z
- 标签：AI for Science、蛋白质构象、预印本、独立复核、衍序计算实验室（虚构）、沈假设（虚构预印本作者）、陆复核（虚构独立团队联系人）、虚构德国

### 事实摘要

演示预印本作者报告，在二十四组虚构蛋白质样本的对比计算中出现一个候选结合构象信号；该信号只是待检验假设，不是已确认发现。现有材料仅包含作者团队的模型输出、参数记录与一次内部复跑，尚无独立实验团队按同一协议复核，也未获得实验验证、机构正式确认或同行评议。候选信号可能来自训练集偏差、结构采样不足或评价阈值选择，不能外推为真实生物效应。后续应先冻结数据划分与评价代码，再由独立团队盲测，并将预印本结果、独立复核、正式确认和同行评议分别记录，任何一环缺失都不得升级结论。

### English summary

Demo data; fictional entities; not actually fetched. A fictional preprint reports a candidate binding-conformation signal in 24 synthetic protein samples. This is a hypothesis reported by the authors, not a confirmed discovery. Materials contain only author-generated model outputs, parameter logs, and one internal rerun. No independent laboratory has replicated the protocol; there is no experimental validation, formal institutional confirmation, or peer review. Dataset bias, insufficient conformational sampling, or threshold selection remain plausible explanations. Independent blinded testing must precede any status upgrade, and preprint, replication, confirmation, and peer review are separate states.

### 关键数字

- **作者报告的虚构样本量：24 组** [来源](https://example.com/demo/fictional/preprints/candidate-conformation-v1)
  - 周期：虚构预印本版本 v1
  - 样本：12 组实验样本与 12 组对照样本，均为虚构计算样本
  - 口径与限制：样本量仅描述作者演示协议，不构成独立验证或统计功效证明。
- **内部复跑：1 次** [来源](https://example.com/demo/fictional/preprints/candidate-conformation-methods)
  - 样本：作者团队同一计算环境
  - 口径与限制：内部复跑不等于独立复核，也不等于同行评议。
- **独立复核/正式确认/同行评议：均未完成** [来源](https://example.com/demo/fictional/preprints/candidate-conformation-v1)
  - 口径与限制：三个状态分别记录，任何一项都不能由预印本自动推导。

### 为什么值得关注

演示科研候选与确认发现的措辞边界，避免把预印本、内部复跑或模型输出升级为已验证科学结论。

### 证据边界与未知项

仅作者团队虚构预印本和方法附录，二者同源；没有独立复核、湿实验、正式确认或同行评议。

### 本轮新增

新增候选信号预印本及同源方法附录，状态仍是待核验，不是新增确认发现。

### 事实、分析与 AI 推断

- **事实**：事实（限演示）：作者报告的是 24 组虚构样本中的候选信号，并有一次同源内部复跑。 来源：[【演示数据｜虚构预印本】候选结合构象信号的计算观察](https://example.com/demo/fictional/preprints/candidate-conformation-v1)；[【演示数据｜虚构方法附录】候选信号参数与内部复跑记录](https://example.com/demo/fictional/preprints/candidate-conformation-methods)
- **事实**：事实（限演示）：独立复核、实验验证、正式确认和同行评议均未完成。 来源：[【演示数据｜虚构预印本】候选结合构象信号的计算观察](https://example.com/demo/fictional/preprints/candidate-conformation-v1)
- **分析**：分析：数据偏差、采样不足和阈值选择仍是竞争解释，当前标题与正文不得写成已确认发现。 来源：[【演示数据｜虚构预印本】候选结合构象信号的计算观察](https://example.com/demo/fictional/preprints/candidate-conformation-v1)；[【演示数据｜虚构方法附录】候选信号参数与内部复跑记录](https://example.com/demo/fictional/preprints/candidate-conformation-methods)

### 建议你

1. **冻结数据划分与评价协议**（high）
   - 材料：虚构预印本、参数记录、样本 ID 清单、评价阈值表和虚构代码哈希。
   - 验证：在独立盲测前锁定训练/测试划分、排除标准和主要终点，避免事后调阈。
   - 预期产物：一份带版本号的冻结协议和不可变样本清单。
2. **安排独立团队盲测**（high）
   - 材料：冻结协议、去标签虚构样本、作者未使用的独立计算环境。
   - 验证：由非作者团队执行同一协议，分别记录复现成功、失败和偏离项。
   - 预期产物：一份独立复核报告；在完成前不得标记正式确认。
3. **建立科研状态边界表**（medium）
   - 材料：预印本时间线、内部复跑记录、同行评议状态栏和机构确认栏。
   - 验证：逐栏核对证据，禁止用内部复跑替代独立复核或用投稿替代同行评议通过。
   - 预期产物：预印本、独立复核、正式确认、同行评议四栏状态卡。

### 来源清单

- [【演示数据｜虚构预印本】候选结合构象信号的计算观察](https://example.com/demo/fictional/preprints/candidate-conformation-v1)｜demo_paper｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。作者在 24 组虚构样本上报告候选信号，明确写作待检验假设；未声称独立复核、实验确认、机构正式确认或同行评议通过。
- [【演示数据｜虚构方法附录】候选信号参数与内部复跑记录](https://example.com/demo/fictional/preprints/candidate-conformation-methods)｜demo_paper｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。附录模板记录参数与一次作者内部复跑，复跑沿用同一环境和数据划分，不能视为独立复核或正式确认。

### 优先级（编辑排序，不是事实概率或收益预测）

- 主题相关性：88｜属于前沿科研候选，且证据边界具有普遍价值。
- 证据质量：42｜只有同源预印本和内部复跑，独立证据缺失。
- 产业影响：76｜若后续成立可能有研究价值，目前只评估潜在影响。
- 新颖性：90｜候选信号是演示中的新假设，不是确认的新发现。
- 可行动性：84｜冻结协议、独立盲测和状态分栏均可操作。

### 更新历史

- v1｜2026-11-26T07:15:00.000Z｜以候选信号措辞建立预印本记录，明确区分复核、确认和同行评议。

---

## 【演示】第三方机器人评测报告 62.2% 成功率，非官方 benchmark

- 分类：前沿行业
- 信息性质：第三方评测
- 核验状态：单一来源
- 事件日期：2026-11-24；发布：2026-11-26T03:30:00.000Z；首次发现：2026-11-26T03:48:00.000Z；最近更新：2026-11-26T06:40:00.000Z
- 标签：机器人、第三方评测、DemoHarness、失败分析、衡尺机器人实验室（虚构第三方）、砾移机器人（虚构厂商）、祁评测（虚构评测负责人）、虚构日本

### 事实摘要

演示数据/虚构主体/未真实抓取。虚构第三方“衡尺机器人实验室”评测三台“砾移动臂”机器人，执行 30 项固定任务、每项每台重复 5 次，共 450 次试验。演示协议采用任务顺序随机、失败即记录、不因表现差而重跑；harness 为 DemoHarness v0.3（虚构），工具包括两指夹爪、腕部相机和演示货架，运行环境为隔离工位与固定光照。虚构评测成本为 426.40 美元，成功 280 次（62.2%），失败 170 次，其中抓取滑移 102 次、规划超时 68 次。样本仅三台同型设备，未覆盖其他机型、动态人群或长期磨损；这是第三方评测，不是厂商官方 benchmark，也不代表普遍性能。

### English summary

Demo data; fictional entities; not actually fetched. The fictional independent evaluator Benchmark Bench Robotics tested three identical Grit mobile manipulators on 30 fixed tasks with five repetitions per unit, yielding 450 trials. The protocol randomized task order, recorded failures, and prohibited selective reruns. DemoHarness v0.3, a two-finger gripper, wrist camera, demo shelving, isolated workstations, and fixed lighting were used. Fictional evaluation cost was USD 426.40; 280 trials succeeded (62.2%) and 170 failed, including 102 grasp slips and 68 planning timeouts. Only three identical units were sampled, with no other models, dynamic crowds, or long-term wear. This is a third-party review, not an official vendor benchmark.

### 关键数字

- **评测样本与协议：450 次试验** [来源](https://example.com/demo/fictional/third-party/robot-review-protocol)
  - 周期：虚构评测期 2026-11-20 至 2026-11-24
  - 样本：3 台同款虚构机器人 × 30 项任务 × 每台每项 5 次
  - 口径与限制：任务顺序随机，失败保留，不允许选择性重跑；同一型号限制外推。
- **任务成功率：62.2 %** [来源](https://example.com/demo/fictional/third-party/robot-review-protocol)
  - 周期：完整虚构评测期
  - 样本：280 次成功 / 450 次试验
  - 口径与限制：按预注册任务完成判据计算，四舍五入至一位小数。
- **Harness、工具与环境：DemoHarness v0.3（虚构）** [来源](https://example.com/demo/fictional/third-party/robot-review-failure-logs)
  - 样本：两指夹爪、腕部相机、演示货架；隔离工位、固定光照
  - 口径与限制：同一虚构 harness 记录触发、超时与成功判据，不使用厂商官方排行榜口径。
- **评测总成本：426.40 美元（USD）** [来源](https://example.com/demo/fictional/third-party/robot-review-protocol)
  - 周期：450 次虚构试验合计
  - 口径与限制：虚构成本含计算、人工复位和场地，不含机器人购置费。
- **失败案例：170 次** [来源](https://example.com/demo/fictional/third-party/robot-review-failure-logs)
  - 样本：102 次抓取滑移；68 次规划超时
  - 口径与限制：按演示日志主失败原因单次归类；未覆盖动态人群和长期磨损。

### 为什么值得关注

提供可复核的第三方机器人评测范式，把成功率与样本、协议、成本、失败分布和环境限制一起呈现。

### 证据边界与未知项

评测主体、原始日志与 harness 都是虚构第三方材料；没有厂商官方认证，也没有第二家独立机构复测。

### 本轮新增

新增第三方评测记录和失败日志来源，不代表官方发布新的 benchmark。

### 事实、分析与 AI 推断

- **事实**：事实（限演示）：虚构第三方完成 450 次试验，报告 280 次成功、170 次失败和 426.40 美元评测成本。 来源：[【演示数据｜虚构第三方评测】砾移动臂任务协议与结果](https://example.com/demo/fictional/third-party/robot-review-protocol)；[【演示数据｜虚构第三方日志】DemoHarness 失败与环境记录](https://example.com/demo/fictional/third-party/robot-review-failure-logs)
- **事实**：事实（限演示）：失败日志列出 102 次抓取滑移与 68 次规划超时，并记录 harness、工具和环境。 来源：[【演示数据｜虚构第三方日志】DemoHarness 失败与环境记录](https://example.com/demo/fictional/third-party/robot-review-failure-logs)
- **分析**：分析：三台同型设备与固定环境限制外推，结果不得写成厂商官方 benchmark 或普遍性能。 来源：[【演示数据｜虚构第三方评测】砾移动臂任务协议与结果](https://example.com/demo/fictional/third-party/robot-review-protocol)

### 建议你

1. **复跑固定失败子集**（high）
   - 材料：DemoHarness v0.3、虚构任务清单、102 次滑移与 68 次超时日志、相同工具清单。
   - 验证：锁定协议与环境，对每个失败类别抽取预注册子集，保留所有重跑而不只报最佳结果。
   - 预期产物：一份含原始成功率、复跑成功率和全部偏离项的复现报告。
2. **审计成功判据与计时边界**（high）
   - 材料：虚构 harness 配置、超时阈值、任务完成判据和人工复位记录。
   - 验证：核对成功判定是否自动执行、超时是否计入失败、人工干预是否单独标记。
   - 预期产物：一张协议审计表和可机器读取的试验结果清单。
3. **补齐成本与外部效度说明**（medium）
   - 材料：426.40 美元虚构成本账、设备型号清单、场地与光照记录。
   - 验证：区分购置成本与运行成本，并在其他机型和动态环境测试前限制结论范围。
   - 预期产物：一份成本分解表和外推限制清单。

### 来源清单

- [【演示数据｜虚构第三方评测】砾移动臂任务协议与结果](https://example.com/demo/fictional/third-party/robot-review-protocol)｜demo_review｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。第三方评测模板记录 3 台设备、30 项任务、每项每台 5 次，共 450 次；280 次成功，成功率 62.2%，成本 426.40 USD。非厂商官方 benchmark。
- [【演示数据｜虚构第三方日志】DemoHarness 失败与环境记录](https://example.com/demo/fictional/third-party/robot-review-failure-logs)｜demo_review｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。DemoHarness v0.3 日志模板列出两指夹爪、腕部相机、演示货架、隔离工位与固定光照；失败 170 次，包括抓取滑移 102 次、规划超时 68 次。

### 优先级（编辑排序，不是事实概率或收益预测）

- 主题相关性：86｜机器人能力与实际任务可靠性属于前沿情报核心。
- 证据质量：68｜协议和日志较完整，但只有单一虚构评测主体。
- 产业影响：78｜失败分布可影响部署评估，外部效度仍有限。
- 新颖性：74｜新增演示复测结果，不等同官方新基准。
- 可行动性：88｜复跑、审计和成本拆分都有明确输入与输出。

### 更新历史

- v1｜2026-11-26T06:40:00.000Z｜建立第三方评测 fixture，同时记录协议、成本、失败案例和局限。

---

## 【演示】Recursive Self-Improvement / 递归式自我改进叙事升温，证据未同步

- 分类：新叙事
- 信息性质：社交观点
- 核验状态：证据不足
- 事件日期：2026-11-26；发布：2026-11-26T02:40:00.000Z；首次发现：2026-11-26T02:55:00.000Z；最近更新：2026-11-26T08:10:00.000Z
- 标签：RSI、Recursive Self-Improvement、递归式自我改进、叙事过热、自环系统（虚构）、艾推断（虚构社交账号）、柯闭环（虚构技术作者）、虚构全球社交样本

### 事实摘要

演示数据/虚构主体/未真实抓取。Recursive Self-Improvement / 递归式自我改进（RSI）在虚构社交样本中出现 18,400 条帖文，但社交热度不等于资金、技术或商业证据。演示技术备忘录只描述一次人工触发的代码修改试验，没有系统自主生成、评估并部署修改且形成连续改进的记录；资料也未提供可核验的新增融资、付费客户或收入。反证包括 42% 帖文集中于 12 个账号，以及缺少独立复现。AI 推断仅作为假设单列，不得写成事实。当前存在热度先于证据的过热风险。

### English summary

Demo data; fictional entities; not actually fetched. Recursive Self-Improvement / RSI appears in 18,400 fictional social posts, but social attention is not funding, technical, or commercial evidence. A fictional technical memo describes only one human-triggered code-edit experiment, not an autonomous generate-evaluate-deploy loop with compounding improvement. No verifiable new financing, paying customers, or revenue is supplied. Counterevidence includes 42% of posts coming from 12 accounts and no independent replication. AI inference is labelled as hypothesis only. The narrative carries overheating risk.

### 关键数字

- **虚构社交帖文数：18400 条** [来源](https://example.com/demo/fictional/social/rsi-narrative-sample)
  - 周期：2026-11-25 00:00 至 2026-11-26 00:00 UTC
  - 样本：虚构社交样本，不是全网，也不是真实 X 数据
  - 口径与限制：只衡量演示社交热度，不作为资金、技术或商业证据。
- **发帖集中度反证：42 %** [来源](https://example.com/demo/fictional/social/rsi-narrative-sample)
  - 周期：同一虚构社交窗口
  - 样本：12 个虚构账号贡献了 42% 帖文
  - 口径与限制：用于识别小群体放大，账号身份与真实性未核验。
- **技术证据：未形成自主连续改进闭环** [来源](https://example.com/demo/fictional/technical/rsi-human-triggered-edit)
  - 样本：一次人工触发的虚构代码修改试验
  - 口径与限制：缺少系统自主生成、评估、部署及后续改进复利记录，不能据此确认 RSI。
- **资金与商业证据：未提供** [来源](https://example.com/demo/fictional/technical/rsi-human-triggered-edit)
  - 口径与限制：虚构材料没有可核验新增融资、付费客户或收入；缺失不等于现实中不存在。

### 为什么值得关注

把 RSI 全称、严格定义、社交热度和可验证证据放在同一条目但分层处理，降低叙事误判。

### 证据边界与未知项

社交计数来自虚构样本；技术材料没有自主闭环，资金与商业字段无证据。未连接真实 X，不能外推全网热度。

### 本轮新增

新增虚构社交样本和技术备忘录，仅表示演示数据增加，不代表现实 RSI 事件或热度上升。

### 事实、分析与 AI 推断

- **事实**：事实（限演示）：虚构社交样本记录 18,400 条帖文，42% 来自 12 个账号。 来源：[【演示数据｜虚构社交样本】RSI 讨论计数与账号集中度](https://example.com/demo/fictional/social/rsi-narrative-sample)
- **事实**：事实（限演示）：技术材料只支持人工触发试验，不支持已发生自主连续 RSI；资金和商业证据未提供。 来源：[【演示数据｜虚构技术备忘录】一次人工触发代码修改试验](https://example.com/demo/fictional/technical/rsi-human-triggered-edit)
- **分析**：分析/反证：账号集中与缺少独立复现削弱了社交热度所暗示的广泛技术进展，存在叙事过热风险。 来源：[【演示数据｜虚构社交样本】RSI 讨论计数与账号集中度](https://example.com/demo/fictional/social/rsi-narrative-sample)；[【演示数据｜虚构技术备忘录】一次人工触发代码修改试验](https://example.com/demo/fictional/technical/rsi-human-triggered-edit)
- **AI 推断**：AI 推断（非事实）：只有在独立复现自主生成、评估、部署并形成后续能力提升后，RSI 叙事才可能获得技术证据支持；当前不能推断 RSI 已实现。 来源：[【演示数据｜虚构技术备忘录】一次人工触发代码修改试验](https://example.com/demo/fictional/technical/rsi-human-triggered-edit)

### 建议你

1. **验证自主改进闭环**（high）
   - 材料：虚构技术备忘录、代码版本、自动评价结果、部署日志和人工干预记录。
   - 验证：逐环核对系统是否自主生成、评估并部署修改，以及后续改进能力是否可重复提升。
   - 预期产物：一份生成—评估—部署—再改进四环证据表和独立复现记录。
2. **分开核验资金与商业材料**（high）
   - 材料：虚构融资披露索引、合同字段模板、付费客户清单和收入口径表。
   - 验证：融资金额只看正式披露，商业化只看可核验合同与收入；均不得引用社交帖文数替代。
   - 预期产物：资金、技术、商业三张独立证据卡，无证据处保留未知。
3. **重算社交基线与集中度**（medium）
   - 材料：虚构帖文清单、账号去重表、历史窗口和机器人账号筛查规则。
   - 验证：比较同口径历史基线，检查 12 个高贡献账号及重复文本，避免把采集增加当作热度。
   - 预期产物：一份去重社交基线报告和过热风险说明。

### 来源清单

- [【演示数据｜虚构社交样本】RSI 讨论计数与账号集中度](https://example.com/demo/fictional/social/rsi-narrative-sample)｜demo_social｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。虚构窗口内记录 18,400 条 RSI 帖文，12 个账号贡献 42%；不是全网样本，不提供融资、技术或商业证明，也不代表真实 X。
- [【演示数据｜虚构技术备忘录】一次人工触发代码修改试验](https://example.com/demo/fictional/technical/rsi-human-triggered-edit)｜demo_blog｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。备忘录只记录一次人工触发代码修改，没有自主生成—评估—部署连续闭环，没有独立复现，也未附新增融资、付费客户或收入证据。

### 优先级（编辑排序，不是事实概率或收益预测）

- 主题相关性：86｜RSI 是重要叙事，但需要严格定义与证据隔离。
- 证据质量：30｜社交材料较多，技术和商业证据不足。
- 产业影响：未知｜没有自主闭环和商业结果，无法可靠评估现实影响。
- 新颖性：90｜演示讨论窗口较新，但新颖性不等于技术突破。
- 可行动性：72｜可分别验证闭环、资金商业材料和社交基线。

### 更新历史

- v1｜2026-11-26T08:10:00.000Z｜将社交热度与技术、资金、商业证据分层，加入反证和显式 AI 推断。

---

## 【演示】岚川订阅盒客户案例报告 ROAS 3.40，归因与复购待核验

- 分类：数字营销
- 信息性质：官方披露
- 核验状态：单一来源
- 事件日期：2026-11-01；发布：2026-11-26T02:00:00.000Z；首次发现：2026-11-26T02:16:00.000Z；最近更新：2026-11-26T05:50:00.000Z
- 标签：数字营销、ROAS、CAC、转化率、归因、复购、岚川订阅盒（虚构客户）、镜台广告平台（虚构）、穆归因（虚构增长负责人）、虚构加拿大

### 事实摘要

演示数据/虚构主体/未真实抓取。岚川订阅盒（虚构客户）与“镜台广告平台”（虚构）自报 2026-10-01 至 10-31 案例：广告支出 47,068 美元，12,480 个去重会话带来 574 名首单新客，平台归因收入 160,031.20 美元。按平台默认 7 天点击、1 天展示窗口，ROAS=3.40，CAC=82.00 美元，首单转化率=4.60%。这些是平台/客户自报结果，不是独立审计；未设随机对照组，可能计入自然转化，且未纳入退款、复购和 LTV 实现值，不能直接推导增量 ROI。

### English summary

Demo data; fictional entities; not actually fetched. Fictional client Lanchuan Subscription Box and MirrorStage Ads self-report October 2026 results: USD 47,068 spend, 12,480 deduplicated sessions, 574 first-order new customers, and USD 160,031.20 platform-attributed revenue. Using a 7-day click and 1-day view window, ROAS is 3.40, CAC USD 82.00, and first-order conversion 4.60%. These are platform/client self-reports, not independent audits. There is no randomized control group; organic conversions may be included, and refunds, repeat purchases, and realized LTV are absent. Incremental ROI cannot be inferred.

### 关键数字

- **ROAS：3.40 倍** [来源](https://example.com/demo/fictional/marketing/mirrorstage-attribution-export)
  - 周期：2026-10-01 至 2026-10-31
  - 样本：47,068 USD 广告支出；160,031.20 USD 平台归因收入
  - 口径与限制：ROAS=平台归因收入/广告支出；7 天点击、1 天展示归因，不等于增量 ROI。
- **CAC：82.00 美元/首单新客（USD）** [来源](https://example.com/demo/fictional/marketing/lanchuan-customer-case)
  - 周期：2026-10-01 至 2026-10-31
  - 样本：574 名首单新客，客户自报去重
  - 口径与限制：CAC=47,068 USD 广告支出/574 名首单新客；未含创意、人力和折扣成本。
- **首单转化率：4.60 %** [来源](https://example.com/demo/fictional/marketing/lanchuan-customer-case)
  - 周期：2026-10-01 至 2026-10-31
  - 样本：574 名首单新客 / 12,480 个去重会话
  - 口径与限制：首单转化率=首单新客数/去重会话数；结果四舍五入至两位小数。
- **归因窗口与限制：7 天点击；1 天展示** [来源](https://example.com/demo/fictional/marketing/mirrorstage-attribution-export)
  - 周期：平台默认窗口
  - 样本：平台/客户自报，未设随机对照组
  - 口径与限制：可能包含自然转化；退款、复购、实现 LTV 与增量 ROI 未验证。

### 为什么值得关注

展示营销案例必须同时披露指标公式、周期、样本和归因窗口，并把平台自报效果与增量因果效果分开。

### 证据边界与未知项

客户案例和平台导出属于同一自报测量链，没有独立财务审计、随机对照组、退款明细或复购队列。

### 本轮新增

新增虚构客户案例与平台导出，不代表真实客户效果得到独立确认。

### 事实、分析与 AI 推断

- **事实**：事实（限演示）：客户/平台自报 ROAS 3.40、CAC 82.00 美元和首单转化率 4.60%，采用 7 天点击、1 天展示窗口。 来源：[【演示数据｜虚构客户自报】岚川订阅盒十月增长案例](https://example.com/demo/fictional/marketing/lanchuan-customer-case)；[【演示数据｜虚构平台自报】镜台广告归因导出](https://example.com/demo/fictional/marketing/mirrorstage-attribution-export)
- **分析**：分析：缺少随机对照、退款与复购队列时，平台 ROAS 不能证明增量 ROI 或实现 LTV。 来源：[【演示数据｜虚构客户自报】岚川订阅盒十月增长案例](https://example.com/demo/fictional/marketing/lanchuan-customer-case)；[【演示数据｜虚构平台自报】镜台广告归因导出](https://example.com/demo/fictional/marketing/mirrorstage-attribution-export)

### 建议你

1. **检查随机对照组与增量效果**（high）
   - 材料：虚构平台导出、受众分组表、地区/用户 holdout 方案和自然转化基线。
   - 验证：核对是否预留可比对照组，并按同一归因窗口比较试验组与对照组，而非只看 ROAS。
   - 预期产物：一份增量转化、增量收入和增量 ROAS 对照报告；无对照时明确不可识别。
2. **核验复购与实现 LTV**（high）
   - 材料：574 名虚构首单新客队列、后续订单、退款记录和折扣成本表。
   - 验证：按首单月份追踪复购率、退款后毛利和实现 LTV，不用预测 LTV 替代已发生收入。
   - 预期产物：一份首客队列复购表及退款后 CAC/LTV 复核单。
3. **对账平台收入与财务流水**（medium）
   - 材料：虚构平台归因收入、客户订单导出、支付流水和 7 天点击/1 天展示配置截图。
   - 验证：统一样本、币种、退款和时间口径，排查跨平台重复归因与自然订单误入。
   - 预期产物：一份平台—订单—支付三方对账表和归因差异清单。

### 来源清单

- [【演示数据｜虚构客户自报】岚川订阅盒十月增长案例](https://example.com/demo/fictional/marketing/lanchuan-customer-case)｜demo_customer_case｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。客户自报 2026 年 10 月支出 47,068 USD、12,480 个去重会话、574 名首单新客；CAC 82.00 USD，首单转化率 4.60%。未提供随机对照、退款和复购审计。
- [【演示数据｜虚构平台自报】镜台广告归因导出](https://example.com/demo/fictional/marketing/mirrorstage-attribution-export)｜demo_ad_platform｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。平台自报归因收入 160,031.20 USD、支出 47,068 USD、ROAS 3.40；默认 7 天点击和 1 天展示窗口，未排除自然转化，不是增量 ROI。

### 优先级（编辑排序，不是事实概率或收益预测）

- 主题相关性：72｜与数字营销效果评估直接相关，但属于自报案例。
- 证据质量：54｜公式和窗口完整，独立审计与对照组缺失。
- 产业影响：68｜演示指标表面较好，增量与长期价值尚不可知。
- 新颖性：58｜案例为本窗口新增，营销方法本身不主张新颖。
- 可行动性：92｜对照组、复购队列和财务对账均可形成具体产物。

### 更新历史

- v1｜2026-11-26T05:50:00.000Z｜建立客户自报案例，补齐指标口径、归因窗口、对照组和复购限制。

---

## 【演示】旧在轨试验新增报道：事件日期与商业部署状态获重大更正

- 分类：前沿行业
- 信息性质：媒体报道
- 核验状态：已交叉核验
- 事件日期：2026-10-18；发布：2026-11-20T09:00:00.000Z；首次发现：2026-11-20T09:12:00.000Z；最近更新：2026-11-26T09:20:00.000Z
- 标签：在轨试验、旧闻新报、重大更正、事件去重、远帆轨道系统（虚构）、闻更正（虚构任务编辑）、虚构近地轨道

### 事实摘要

演示数据/虚构主体/未真实抓取。远帆轨道系统（虚构）的原始在轨试验发生于 2026-10-18，而首篇演示报道发布于 2026-11-20，本次更新于 2026-11-26。新增来源是旧事件的新报道与原始任务日志，不是新发生的试验。重大更正撤销初稿“11 月新试验”和“已完成商业部署”的说法；原始日志只支持一次技术试验，商业部署仍未证实。

### English summary

Demo data; fictional entities; not actually fetched. The fictional Farsail Orbital Systems test occurred on 2026-10-18. The first demo report appeared on 2026-11-20 and this update on 2026-11-26. Added sources concern an old event; no new test occurred. A major correction retracts the initial claims of a November test and completed commercial deployment. The original log supports only a technical test; commercial deployment remains unverified.

### 关键数字

- **原始事件日期：2026-10-18** [来源](https://example.com/demo/fictional/missions/farsail-2026-10-18-log)
  - 周期：早于首次报道 2026-11-20 与本次更新 2026-11-26
  - 样本：虚构原始任务日志与虚构更正报道
  - 口径与限制：eventDate 取原始任务日期，不用 publishedAt 或 updatedAt 替代。
- **本轮新增来源：2 条** [来源](https://example.com/demo/fictional/media/farsail-major-correction)
  - 周期：2026-11-26 演示更新
  - 样本：一条更正报道与一条原始任务日志
  - 口径与限制：新增来源表示证据补充，不表示旧事件在本轮重新发生。
- **商业部署状态：未证实** [来源](https://example.com/demo/fictional/media/farsail-major-correction)
  - 口径与限制：原始日志只支持技术试验，初稿“已商业部署”已作为重大更正撤销。

### 为什么值得关注

区分事件发生时间、报道时间、首次收录与更新时间，并演示新增来源和重大更正如何进入版本链。

### 证据边界与未知项

原始任务日志与更正报道在 fixture 内一致，但均为虚构；初版错误只保留在版本快照中用于审计。

### 本轮新增

新增 2026-11-26 虚构更正报道与 2026-10-18 虚构原始任务日志；这是旧事件新增来源，不是新发生。

### 事实、分析与 AI 推断

- **事实**：事实（限演示）：原始技术试验发生于 2026-10-18，本轮只是新增报道与原始日志。 来源：[【演示数据｜虚构更正报道】远帆旧试验日期与部署状态更正](https://example.com/demo/fictional/media/farsail-major-correction)；[【演示数据｜虚构原始日志】远帆 2026-10-18 在轨技术试验记录](https://example.com/demo/fictional/missions/farsail-2026-10-18-log)
- **分析**：分析：publishedAt 与 updatedAt 晚于 eventDate，新增来源不能解释为新事件发生。 来源：[【演示数据｜虚构更正报道】远帆旧试验日期与部署状态更正](https://example.com/demo/fictional/media/farsail-major-correction)；[【演示数据｜虚构原始日志】远帆 2026-10-18 在轨技术试验记录](https://example.com/demo/fictional/missions/farsail-2026-10-18-log)
- **更正**：重大更正：撤销初稿关于 2026-11-20 新试验和已完成商业部署的表述；仅保留 2026-10-18 技术试验，商业部署未证实。 来源：[【演示数据｜已撤回初稿】远帆试验日期与部署状态误报](https://example.com/demo/fictional/media/farsail-withdrawn-initial-report)；[【演示数据｜虚构更正报道】远帆旧试验日期与部署状态更正](https://example.com/demo/fictional/media/farsail-major-correction)；[【演示数据｜虚构原始日志】远帆 2026-10-18 在轨技术试验记录](https://example.com/demo/fictional/missions/farsail-2026-10-18-log)

### 建议你

1. **归档重大更正差异**（high）
   - 材料：版本 v1 初稿、版本 v2 更正稿、2026-10-18 虚构原始日志和两版来源定位。
   - 验证：逐项比较事件日期、试验次数和商业部署措辞，保留撤回内容但明确标为不可引用。
   - 预期产物：一份带 majorCorrection 标记的字段级更正对照单。
2. **重建事件与报道时间线**（high）
   - 材料：eventDate、publishedAt、firstSeenAt、updatedAt 和三个虚构来源时间戳。
   - 验证：去重后续报道，以原始任务日期归并事件；新增来源只更新版本，不创建新事件。
   - 预期产物：一条单事件时间线和新增来源映射表。

### 来源清单

- [【演示数据｜已撤回初稿】远帆试验日期与部署状态误报](https://example.com/demo/fictional/media/farsail-withdrawn-initial-report)｜demo_media｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。已撤回初稿曾误写为 2026-11-20 新试验并称已商业部署；两项说法均不得引用，后续重大更正已撤销。
- [【演示数据｜虚构更正报道】远帆旧试验日期与部署状态更正](https://example.com/demo/fictional/media/farsail-major-correction)｜demo_media｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。重大更正明确原始事件为 2026-10-18 技术试验，新增报道不表示新试验；撤销 11 月新试验和已完成商业部署两项表述。
- [【演示数据｜虚构原始日志】远帆 2026-10-18 在轨技术试验记录](https://example.com/demo/fictional/missions/farsail-2026-10-18-log)｜demo_official｜demo_not_fetched｜演示数据/虚构主体/未真实抓取。原始任务日志模板只记录 2026-10-18 完成一次在轨技术试验，没有商业部署验收或后续 11 月新试验记录。

### 优先级（编辑排序，不是事实概率或收益预测）

- 主题相关性：68｜技术事件本身一般，但时间线与更正具有情报质量价值。
- 证据质量：82｜虚构原始日志和更正报道一致，初稿错误有版本记录。
- 产业影响：60｜商业部署未证实，影响仅限技术试验。
- 新颖性：36｜原始事件较旧，本轮只是新增来源。
- 可行动性：76｜更正差异与去重时间线均可直接归档。

### 更新历史

- v1｜2026-11-20T09:12:00.000Z｜初版演示记录；后续核对发现事件日期与商业部署状态有误，本版已作废。
- v2｜2026-11-26T09:20:00.000Z｜重大更正：事件日期改为 2026-10-18，撤销新试验与已商业部署表述，新增原始日志。｜**重大更正**
