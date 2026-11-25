# 金融 Skill 目录：Skills.sh + GitHub

生成时间：2026-11-25  
范围：金融分析、股票/交易、组合/财富、加密/DeFi、会计/税务、支付/银行/信贷、宏观/固收、保险/地产、金融数据/新闻，以及金融基础设施。范围偏宽，目录里保留了 `segment`、`confidence`、`finance_focus` 等字段，方便按研究口径筛选。

## 文件

| 文件 | 粒度 | 行数 | 说明 |
|---|---|---|---|
| `skills-sh-finance-catalog.csv` | skill | **488** | Skills.sh 金融相关 skill |
| `github-finance-catalog.csv` | repo | **1,234** | GitHub 金融相关 agent skill / MCP / 工具 repo |
| `finance-catalog-summary.md` | - | - | 本说明 |

## 方法

### Skills.sh

1. 从 `sitemap-skills-1.xml` / `sitemap-skills-2.xml` 枚举全站 **20,000** 个 skill URL；
2. 按 slug 的金融词筛出 **581** 个候选；
3. 抓取每个候选页的 JSON-LD（名称、真实描述、installs、publisher、First Seen）；
4. 按描述做金融分类和误判清理；
5. 保留 **482** 个：**309 high / 173 medium**；
6. 对 sitemap 前 3,000 个头部 URL 做重要性审计，再加入 6 个真正高安装量的金融 skill（GMGN 系列 + backtesting-frameworks），最终 **488** 个：**314 high / 174 medium**。

### GitHub

1. 用 20 个 GitHub Search API 查询（finance/fintech/trading/stock/investment/portfolio/accounting/tax/banking/crypto + agent skills / claude skills / mcp server / topic 查询）；
2. 收集 **1,413** 个唯一 repo；
3. 按 repo 描述、topics、名称做金融分类和误判清理；
4. 保留 **1,234** 个：**1,044 high / 190 medium**；
5. repo 类型：831 skill-repo、342 mcp-server、57 collection/awesome-list、4 tool/library/api。

## 重要性覆盖与 priority_tier

为了“不遗漏重要 skill”，对 Skills.sh sitemap 前 **3,000** 个 URL（installs 约 ≥10k 的头部）做了额外审计：

- 抓取 **2,961** 个未在 slug 目录中的头部页面；
- 按描述筛出 **169** 个金融关键词命中，但绝大多数是“描述里顺带提到 finance/cost/options/量化”的通用 skill（OKR、表格、云成本、设计、营销等）；
- 只保留 **6** 个真正高安装量的金融 skill：`gmgn-market/token/track/swap/cooking`（加密行情/交易）和 `backtesting-frameworks`（交易回测）。

`priority_tier` 规则：

- **Skills.sh**：A ≥50,000 installs；B ≥10,000；C ≥1,000；D <1,000。
- **GitHub**：A ≥5,000 stars；B ≥1,000；C ≥100；D <100。

当前分布：

- Skills.sh：**A 3 / B 36 / C 268 / D 181**
- GitHub：**A 1 / B 8 / C 38 / D 1,187**

重要性优先阅读：Skills.sh `priority_tier in (A,B)`（39 个）；GitHub `priority_tier in (A,B,C)`（47 个 repo），再人工复核。

## 类型分布

### Skills.sh（488 个 skill）

| 类型 | 数量 |
|---|---|
| Trading/Quant | 166 |
| Equity/Stock Research | 145 |
| Fintech/Infra | 126 |
| Crypto/DeFi/Wallet | 111 |
| Financial Data/News | 72 |
| Portfolio/Wealth | 68 |
| Accounting/Tax | 61 |
| Payments/Banking/Credit | 59 |
| Macro/Fixed Income | 49 |
| Payments/Fintech Infra | 33 |
| Other Finance | 21 |
| Insurance/Real Estate | 7 |
| Personal Finance / FP&A | 2 |

规模：**406 个 analysis/data、61 个 payments/fintech-infra、21 个 other**。

### GitHub（1,234 个 repo）

| 类型 | 数量 |
|---|---|
| Trading/Quant | 356 |
| Crypto/DeFi/Wallet | 300 |
| Equity/Stock Research | 259 |
| Fintech/Infra | 223 |
| Other Finance | 205 |
| Accounting/Tax | 162 |
| Payments/Banking/Credit | 135 |
| Portfolio/Wealth | 128 |
| Financial Data/News | 113 |
| Macro/Fixed Income | 30 |
| Insurance/Real Estate | 15 |

## 代表性条目

### Skills.sh（analysis/data + high，按 installs）

| Skill | Repo | 类型 | installs |
|---|---|---|---|
| wind-mcp-skill | wind-alice/alicemarket | 股票研究/金融数据 | 261,849 |
| binance-agentic-wallet | binance/binance-skills-hub | 加密钱包/交易 | 55,573 |
| wind-find-finance-skill | wind-alice/alicemarket | 股票研究/金融数据/交易 | 52,508 |
| financial-insights | stripe/link-cli | 个人财务数据 | 28,736 |
| okx-agentic-wallet | okx/onchainos-skills | 加密钱包/交易 | 20,268 |
| gmgn-portfolio | gmgnai/gmgn-skills | 加密组合/交易 | 20,242 |
| startup-financial-modeling | wshobson/agents | 财务建模/FP&A | 13,644 |
| korean-stock-search | nomadamas/k-skill | 股票研究 | 13,206 |
| okx-defi | okx/onchainos-skills | DeFi/交易 | 12,600 |
| china-stock-analysis | sugarforever/01coder-agent-skills | A 股研究 | 12,545 |

### GitHub（finance_focus=high，按 stars）

| Repo | stars | 类型 | 说明 |
|---|---|---|---|
| muxuuu/serenity-skill | 4,175 | 股票研究 | 供应链瓶颈选股研究 |
| questflowai/investorskills | 1,942 | 股票研究/组合 | 投资判断结构化 |
| binance/binance-skills-hub | 1,233 | 加密 | Binance 官方 skill |
| whchien/ai-trader | 1,144 | 交易/回测 | Backtrader + MCP |
| alpacahq/alpaca-mcp-server | 1,113 | 交易/MCP | Alpaca 官方 MCP |
| komako-workshop/digital-oracle | 917 | 宏观/预测 | 宏观概率估计 |
| krakenfx/kraken-cli | 818 | 加密/交易 | Kraken CLI + MCP |
| caiovicentino/polymarket-mcp-server | 755 | 预测市场 | Polymarket MCP |
| GMGNAI/gmgn-skills | 742 | 加密 | GMGN 官方 skill |
| wshobson/maverick-mcp | 737 | 股票/组合 | Yahoo Finance + 回测 |

## 字段说明

### `skills-sh-finance-catalog.csv`

- `segment`：`analysis/data`（金融分析/数据/交易/加密/会计）、`payments/fintech-infra`（支付/账单/Stripe 集成等基础设施）、`other`
- `confidence`：`high` / `medium`
- `type`：可能多个类型，分号分隔
- `matched_terms`：触发分类的关键词
- `installs`：Skills.sh 当前累计 installs
- `publisher`、`first_seen`、`url`
- `description`：Skills.sh 技能页的真实描述
- `source`：`slug-catalog`（slug 候选 + 描述确认）或 `importance-audit`（头部高安装量补充）
- `priority_tier`：A/B/C/D，按 installs 分层

### `github-finance-catalog.csv`

- `repo_type`：`skill-repo` / `mcp-server` / `collection/awesome-list` / `tool/library/api`
- `finance_focus`：`high` / `medium`（broad collection 通常为 medium）
- `types`：金融类型，分号分隔
- `stars`、`forks`、`topics`、`language`、`license`、`updated_at`
- `matched_queries`：哪些 GitHub 搜索查询命中了该 repo
- `description`：GitHub repo 描述
- `priority_tier`：A/B/C/D，按 stars 分层

## 使用建议

1. **Skills.sh 研究用**：优先 `segment == "analysis/data"` 且 `confidence == "high"`；先看 `priority_tier in (A,B)`；支付/账单基础设施单独用 `segment == "payments/fintech-infra"`。
2. **GitHub 研究用**：优先 `finance_focus == "high"` 且 `repo_type == "skill-repo"` 或 `mcp-server`；先看 `priority_tier in (A,B,C)`；`collection/awesome-list` 需要进一步枚举里面的具体 skill。
3. **去重**：同一 repo 下多个 skill（如 `anthropics/financial-services`、`joellewis/finance_skills`）要按 repo + skill 去重；跨平台按名称/仓库做实体匹配。
4. **版本/历史**：这两个目录是**当前快照**；installs/stars 是当前值，没有历史时间序列。要做事件研究，需要从现在开始逐日快照。
5. **人工复核**：分类是规则 + 描述判断，仍有少量误判（特别是 payments/billing、broad collection、金融相邻但非分析的条目）；建议先人工检查 top 100。

## 限制

- Skills.sh 候选基于 **slug** 筛选，未覆盖所有 20,000 个 skill；描述确认只针对候选页，因此是**下限**，不是全量。
- 重要性审计只覆盖 sitemap 前 3,000 个（约 installs ≥10k 的头部）；更低 installs 的长尾未审计。
- GitHub 是 **repo 级**，不是 skill 级；一个 repo 可能包含几十到几百个 skill，也可能只是工具/awesome list。
- GitHub 搜索按 stars 排序、每查询取前 100，属于高星 + 关键词采样，不是全量。
- 描述来自当前页面；历史上架/下架、历史 installs、历史 stars 均不可得。
- 没有自动解决“同一项目多平台/多 repo”的实体匹配；`skills.sh` 的 source repo 与 GitHub repo 可以按 owner/repo 尝试匹配。
- 上市公司映射仍需单独做；目录里大部分是个人/私营/开源项目。

## 下一步

1. 人工复核 top 100，把 `confidence` 调整为人工标签。
2. 对 GitHub `collection/awesome-list` 枚举 `SKILL.md`，得到 skill 级清单。
3. 对确定的金融 skill 建立 watchlist，开始每日快照（installs/stars/版本）。
4. 如需全量：扩展 Skills.sh slug 词表，或使用 Vercel OIDC 调 API 拉全量列表/详情。
