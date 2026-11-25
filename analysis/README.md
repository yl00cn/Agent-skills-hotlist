# 研究面板说明

本目录由 `scripts/build-research-panel.mjs` 从 `data/snapshots/` 生成，用于把快照整理成可直接分析的面板数据。

## 生成方式

```bash
# 先同步最新数据
git pull --ff-only

# 生成 analysis/ 下的面板和报告
npm run analyze:panel
```

也可以指定输入/输出目录：

```bash
node scripts/build-research-panel.mjs --data-dir data --out-dir analysis --data-label data
```

## 文件

| 文件 | 粒度 | 说明 |
|---|---|---|
| `snapshots.csv` | 每快照一行 | 快照级面板：时间、来源、触发方式、数量、平台分布、间隔、总量指标 |
| `platform-coverage.csv` | 每快照 × 每平台一行 | 平台覆盖长表：每个平台的行数和指标合计 |
| `skills.csv` | 每快照 × 每 skill 一行 | skill 级面板：排名、名称、URL、原始指标、trendingScore、分类 |
| `continuity-report.md` | - | 连续性、间隔异常、平台覆盖变化、数量异常和手动快照报告 |

## 金融目录

- `skills-sh-finance-catalog.csv`：Skills.sh 金融相关 skill（skill 级，含 segment / confidence / type / installs）
- `github-finance-catalog.csv`：GitHub 金融相关 repo（repo 级，含 repo_type / finance_focus / types / stars）
- `finance-catalog-summary.md`：两份目录的方法、统计、代表条目、字段说明和限制

## 关键字段

- `snapshot_date`：canonical 快照取文件名日期；manual 快照取 `generatedAt` 的 UTC 日期。
- `generated_at`：**实际**采集时间（UTC ISO）。分析时请以它作为采样时间，不要假设 10:25 或固定 24 小时间隔。
- `interval_hours`：仅 canonical 快照有值，表示与上一个 canonical 快照的实际间隔（小时）。
- `source`：`upstream` 或 `fork`。2026-11-23T10:54:33.564Z 及之前的快照来自原项目（Fork 继承），之后来自你的 Fork。
- `trigger`：`schedule` 或 `workflow_dispatch`。A1 之后的快照直接读取 `collection.trigger`；历史快照没有该字段，脚本按来源和时间推断。
- `trigger_inferred`：为 `true` 时表示该触发方式是按规则推断的，不是快照自带的元数据。
- `kind`：`canonical`（日度正式快照）或 `manual`（手动运行归档）。
- `platform_counts`：该快照中每个平台进入榜单的 skill 数（JSON 字符串）。
- `calc` / 指标列：`stars`、`downloads`、`installs`、`views` 均为源数据原始值，`trending_score` 是脚本派生值。

## 使用建议

1. 日度面板请筛选 `kind == "canonical"`；`interval_hours` 已按实际时间计算。
2. 手动快照（`kind == "manual"`）不进入 canonical 间隔统计，建议作为补充观测或稳健性检验。
3. 平台覆盖发生过结构变化：Smithery 在 2026-08-05 进入、2026-11-01 后消失；MCP Market 在 2026-09-16 进入；AgentSkills.in 从未成功。做汇总分析前先按 `platform-coverage.csv` 检查覆盖，或分平台建模。
4. 已知采集异常：2026-08-11（skills-sh 仅 0 行）和 2026-10-16（skills-sh 仅 1 行）导致当天总数骤降，后面的恢复也造成数量跳变；这些不应解释为真实热度变化，建议剔除或单独处理。
5. 历史快照缺少 `collection` / `collectorStats`；`source`、`trigger` 是推断值，报告中已注明。
6. 数据更新后请重新运行 `npm run analyze:panel`；`analysis/` 下的文件不会随每日 workflow 自动更新。

## 已知限制

- 快照只保留有 downloads/installs/stars 的 top 250；`unranked` 只记录数量，不保存明细，存在选择偏差。
- `createdAt` / `updatedAt` 在源数据缺失时会被填成采集时间；`trendingScore` 是派生公式，跨期比较优先使用原始指标。
- 历史平台覆盖变化和上游/Fork 边界意味着这不是一个同质的固定面板；请按报告中的覆盖区间切分样本。
