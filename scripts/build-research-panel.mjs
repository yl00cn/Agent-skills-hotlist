import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const argValue = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};

const dataDir = path.resolve(repoRoot, argValue("--data-dir", "data"));
const dataLabel = argValue("--data-label", path.relative(repoRoot, dataDir) || ".");
const outDir = path.resolve(repoRoot, argValue("--out-dir", "analysis"));
const snapshotDir = path.join(dataDir, "snapshots");
const manualDir = path.join(snapshotDir, "manual");

const PLATFORMS = ["skills-sh", "github", "mcp-market", "smithery", "agentskills-in"];
// Snapshots at or before this timestamp were produced by the upstream project.
// It is the last upstream scheduled snapshot restored from commit 95bea0d.
const UPSTREAM_LAST_GENERATED_AT = "2026-11-23T10:54:33.564Z";
// The 2026-11-24 01:14 canonical snapshot predates the A1 provenance change and
// was produced by a manual workflow_dispatch run.
const KNOWN_PRE_A1_MANUAL = new Set(["2026-11-24T01:14:27.635Z"]);

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const isoDate = (value) => (value ? String(value).slice(0, 10) : "");
const parseTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid generatedAt: ${value}`);
  return date;
};
const hoursBetween = (start, end) => (end.getTime() - start.getTime()) / 3_600_000;
const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
const round = (value, digits = 2) => (value == null ? null : Number(value.toFixed(digits)));
const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
const csvEscape = (value) => {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const toCsv = (headers, rows) =>
  [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n") + "\n";

const collectJsonFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(dir, name));
};

const inferSource = (generatedAt) => (generatedAt <= UPSTREAM_LAST_GENERATED_AT ? "upstream" : "fork");
const inferTrigger = (snapshot, kind, source, generatedAt) => {
  const explicit = snapshot.collection?.trigger;
  if (explicit) return { trigger: explicit, inferred: false };
  if (kind === "manual") return { trigger: "workflow_dispatch", inferred: true };
  if (KNOWN_PRE_A1_MANUAL.has(generatedAt)) return { trigger: "workflow_dispatch", inferred: true };
  if (source === "upstream") return { trigger: "schedule", inferred: true };
  return { trigger: "unknown", inferred: true };
};

const inputs = [
  ...collectJsonFiles(snapshotDir).map((file) => ({ file, kind: "canonical" })),
  ...collectJsonFiles(manualDir).map((file) => ({ file, kind: "manual" }))
];

if (!inputs.length) {
  console.error(`No snapshot files found under ${snapshotDir}`);
  process.exit(1);
}

const snapshots = inputs.map(({ file, kind }) => {
  const raw = readJson(file);
  const generatedAt = raw.generatedAt;
  if (!generatedAt) throw new Error(`Snapshot without generatedAt: ${file}`);
  const time = parseTime(generatedAt);
  const source = inferSource(generatedAt);
  const { trigger, inferred } = inferTrigger(raw, kind, source, generatedAt);
  const skills = Array.isArray(raw.skills) ? raw.skills : [];
  const platformCounts = Object.fromEntries(PLATFORMS.map((platform) => [platform, 0]));
  for (const skill of skills) {
    const platform = skill.platform || "unknown";
    platformCounts[platform] = (platformCounts[platform] || 0) + 1;
  }
  return {
    file,
    relFile: path.posix.join("data", "snapshots", kind === "manual" ? "manual" : "", path.basename(file)),
    kind,
    date: kind === "canonical" ? path.basename(file, ".json") : isoDate(generatedAt),
    generatedAt,
    time,
    source,
    trigger,
    triggerInferred: inferred,
    schemaVersion: raw.schemaVersion ?? null,
    hasCollection: Boolean(raw.collection),
    collection: raw.collection || null,
    collectorStats: raw.collectorStats || null,
    count: raw.count ?? skills.length,
    unrankedCount: raw.unrankedCount ?? null,
    platformCounts,
    platformsPresent: Object.values(platformCounts).filter((value) => value > 0).length,
    totalStars: sum(skills, "stars"),
    totalDownloads: sum(skills, "downloads"),
    totalInstalls: sum(skills, "installs"),
    totalViews: sum(skills, "views"),
    skills
  };
}).sort((a, b) => a.time - b.time);

const canonical = snapshots.filter((snapshot) => snapshot.kind === "canonical");
const manual = snapshots.filter((snapshot) => snapshot.kind === "manual");

for (let index = 0; index < canonical.length; index += 1) {
  canonical[index].intervalHours =
    index === 0 ? null : round(hoursBetween(canonical[index - 1].time, canonical[index].time));
}

const allPlatforms = [...PLATFORMS];
for (const snapshot of snapshots) {
  for (const platform of Object.keys(snapshot.platformCounts)) {
    if (!allPlatforms.includes(platform)) allPlatforms.push(platform);
  }
}

const snapshotHeaders = [
  "snapshot_date",
  "generated_at",
  "source",
  "trigger",
  "trigger_inferred",
  "kind",
  "schema_version",
  "has_collection",
  "run_id",
  "run_number",
  "run_attempt",
  "actor",
  "count",
  "unranked_count",
  "platforms_present",
  "platform_counts",
  "collector_stats",
  "total_stars",
  "total_downloads",
  "total_installs",
  "total_views",
  "interval_hours",
  "file"
];

const snapshotRows = snapshots.map((snapshot) => ({
  snapshot_date: snapshot.date,
  generated_at: snapshot.generatedAt,
  source: snapshot.source,
  trigger: snapshot.trigger,
  trigger_inferred: snapshot.triggerInferred,
  kind: snapshot.kind,
  schema_version: snapshot.schemaVersion ?? "",
  has_collection: snapshot.hasCollection,
  run_id: snapshot.collection?.runId ?? "",
  run_number: snapshot.collection?.runNumber ?? "",
  run_attempt: snapshot.collection?.runAttempt ?? "",
  actor: snapshot.collection?.actor ?? "",
  count: snapshot.count,
  unranked_count: snapshot.unrankedCount ?? "",
  platforms_present: snapshot.platformsPresent,
  platform_counts: JSON.stringify(snapshot.platformCounts),
  collector_stats: snapshot.collectorStats ? JSON.stringify(snapshot.collectorStats) : "",
  total_stars: snapshot.totalStars,
  total_downloads: snapshot.totalDownloads,
  total_installs: snapshot.totalInstalls,
  total_views: snapshot.totalViews,
  interval_hours: snapshot.intervalHours ?? "",
  file: snapshot.relFile
}));

const coverageHeaders = [
  "snapshot_date",
  "generated_at",
  "source",
  "trigger",
  "kind",
  "platform",
  "rows",
  "stars",
  "downloads",
  "installs",
  "views"
];

const coverageRows = [];
for (const snapshot of snapshots) {
  for (const platform of allPlatforms) {
    const platformSkills = snapshot.skills.filter((skill) => (skill.platform || "unknown") === platform);
    coverageRows.push({
      snapshot_date: snapshot.date,
      generated_at: snapshot.generatedAt,
      source: snapshot.source,
      trigger: snapshot.trigger,
      kind: snapshot.kind,
      platform,
      rows: platformSkills.length,
      stars: sum(platformSkills, "stars"),
      downloads: sum(platformSkills, "downloads"),
      installs: sum(platformSkills, "installs"),
      views: sum(platformSkills, "views")
    });
  }
}

const skillHeaders = [
  "snapshot_date",
  "generated_at",
  "source",
  "trigger",
  "kind",
  "rank",
  "platform",
  "skill_id",
  "name",
  "source_url",
  "stars",
  "downloads",
  "installs",
  "views",
  "trending_score",
  "category",
  "is_new_entrant",
  "rank_delta",
  "created_at",
  "updated_at",
  "file"
];

const skillRows = [];
for (const snapshot of snapshots) {
  snapshot.skills.forEach((skill, index) => {
    skillRows.push({
      snapshot_date: snapshot.date,
      generated_at: snapshot.generatedAt,
      source: snapshot.source,
      trigger: snapshot.trigger,
      kind: snapshot.kind,
      rank: index + 1,
      platform: skill.platform || "",
      skill_id: skill.id || "",
      name: skill.name || "",
      source_url: skill.sourceUrl || "",
      stars: skill.stars ?? "",
      downloads: skill.downloads ?? "",
      installs: skill.installs ?? "",
      views: skill.views ?? "",
      trending_score: skill.trendingScore ?? "",
      category: skill.category || "",
      is_new_entrant: skill.isNewEntrant ?? "",
      rank_delta: skill.rankDelta ?? "",
      created_at: skill.createdAt || "",
      updated_at: skill.updatedAt || "",
      file: snapshot.relFile
    });
  });
}

const canonicalDates = canonical.map((snapshot) => snapshot.date);
const dateSet = new Set(canonicalDates);
const firstDate = canonicalDates[0];
const lastDate = canonicalDates[canonicalDates.length - 1];
const missingDates = [];
if (firstDate && lastDate) {
  const cursor = new Date(`${firstDate}T00:00:00Z`);
  const end = new Date(`${lastDate}T00:00:00Z`);
  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    if (!dateSet.has(date)) missingDates.push(date);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

const intervals = canonical.map((snapshot) => snapshot.intervalHours).filter((value) => value != null);
const intervalOutliers = canonical
  .map((snapshot, index) => ({ snapshot, index }))
  .filter(({ snapshot }) => snapshot.intervalHours != null && (snapshot.intervalHours < 20 || snapshot.intervalHours > 28))
  .map(({ snapshot, index }) => ({
    date: snapshot.date,
    generatedAt: snapshot.generatedAt,
    previous: canonical[index - 1].date,
    hours: snapshot.intervalHours
  }));

const coverageRegimeChanges = [];
for (let index = 1; index < canonical.length; index += 1) {
  const previous = canonical[index - 1];
  const current = canonical[index];
  const previousSet = new Set(Object.entries(previous.platformCounts).filter(([, value]) => value > 0).map(([key]) => key));
  const currentSet = new Set(Object.entries(current.platformCounts).filter(([, value]) => value > 0).map(([key]) => key));
  const added = [...currentSet].filter((platform) => !previousSet.has(platform));
  const removed = [...previousSet].filter((platform) => !currentSet.has(platform));
  if (added.length || removed.length) {
    coverageRegimeChanges.push({ date: current.date, generatedAt: current.generatedAt, added, removed });
  }
}

const countChanges = [];
for (let index = 1; index < canonical.length; index += 1) {
  const previous = canonical[index - 1];
  const current = canonical[index];
  const delta = current.count - previous.count;
  const pct = previous.count ? delta / previous.count : null;
  if (pct != null && Math.abs(pct) >= 0.2 && Math.abs(delta) >= 10) {
    countChanges.push({
      date: current.date,
      previous: previous.date,
      previousCount: previous.count,
      count: current.count,
      delta,
      pct: round(pct * 100, 1)
    });
  }
}
countChanges.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

const platformSummaries = allPlatforms.map((platform) => {
  const days = canonical.filter((snapshot) => (snapshot.platformCounts[platform] || 0) > 0);
  const values = days.map((snapshot) => snapshot.platformCounts[platform]);
  return {
    platform,
    days: days.length,
    zeroDays: canonical.length - days.length,
    first: days[0]?.date || "",
    last: days[days.length - 1]?.date || "",
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
    avg: values.length ? round(mean(values), 1) : 0
  };
});

const triggerCounts = {};
const sourceCounts = {};
for (const snapshot of snapshots) {
  triggerCounts[snapshot.trigger] = (triggerCounts[snapshot.trigger] || 0) + 1;
  sourceCounts[snapshot.source] = (sourceCounts[snapshot.source] || 0) + 1;
}

const dataCutoff = snapshots.reduce((max, snapshot) => (snapshot.generatedAt > max ? snapshot.generatedAt : max), "");
const report = [];
report.push("# Agent Skills 研究面板连续性报告");
report.push("");
report.push(`- 生成时间：${new Date().toISOString()}`);
report.push(`- 数据目录：\`${dataLabel}\``);
report.push(`- 数据截止：**${dataCutoff}**`);
report.push(`- 快照文件：${snapshots.length} 个（canonical ${canonical.length}，manual ${manual.length}）`);
report.push("");
report.push("## 1. 覆盖范围");
report.push("");
report.push(`- canonical 日期范围：${firstDate} 至 ${lastDate}`);
report.push(`- 缺失日期：${missingDates.length} 天${missingDates.length ? `（${missingDates.slice(0, 30).join(", ")}${missingDates.length > 30 ? " ..." : ""}）` : ""}`);
report.push(`- 手动快照：${manual.length} 个`);
report.push("");
report.push("## 2. 来源与触发方式");
report.push("");
report.push("| 维度 | 计数 |");
report.push("|---|---|");
for (const [key, value] of Object.entries(sourceCounts).sort()) report.push(`| source: ${key} | ${value} |`);
for (const [key, value] of Object.entries(triggerCounts).sort()) report.push(`| trigger: ${key} | ${value} |`);
report.push("");
report.push("说明：2026-11-24 之前的 canonical 快照来自上游项目，缺少 `collection` 字段；脚本按时间边界推断为 `source=upstream`、`trigger=schedule`（inferred）。A1 之后的快照使用快照内的 `collection` 元数据。");
report.push("");
report.push("## 3. 采样间隔（canonical）");
report.push("");
report.push(`- 间隔样本：${intervals.length} 个`);
if (intervals.length) {
  report.push(`- 最小：${round(Math.min(...intervals))} 小时；中位数：${round(median(intervals))} 小时；均值：${round(mean(intervals))} 小时；最大：${round(Math.max(...intervals))} 小时`);
}
report.push(`- 超出 20–28 小时的间隔：${intervalOutliers.length} 个`);
if (intervalOutliers.length) {
  report.push("");
  report.push("| 当前快照 | generatedAt | 上一快照 | 间隔(小时) |");
  report.push("|---|---|---|---|");
  for (const row of intervalOutliers.slice(0, 30)) {
    report.push(`| ${row.date} | ${row.generatedAt} | ${row.previous} | ${row.hours} |`);
  }
  if (intervalOutliers.length > 30) report.push(`| ... | ... | ... | 共 ${intervalOutliers.length} 个 |`);
}
report.push("");
report.push("## 4. 平台覆盖（canonical）");
report.push("");
report.push("| 平台 | 出现天数 | 缺失天数 | 首次 | 最后 | 最少行数 | 最多行数 | 平均行数 |");
report.push("|---|---|---|---|---|---|---|---|");
for (const row of platformSummaries) {
  report.push(`| ${row.platform} | ${row.days} | ${row.zeroDays} | ${row.first || "-"} | ${row.last || "-"} | ${row.min} | ${row.max} | ${row.avg} |`);
}
report.push("");
report.push("### 覆盖结构变化");
report.push("");
if (coverageRegimeChanges.length) {
  report.push("| 日期 | 新增平台 | 移除平台 |");
  report.push("|---|---|---|");
  for (const row of coverageRegimeChanges) {
    report.push(`| ${row.date} | ${row.added.join(", ") || "-"} | ${row.removed.join(", ") || "-"} |`);
  }
} else {
  report.push("未检测到平台集合变化。");
}
report.push("");
report.push("## 5. 数量异常（canonical）");
report.push("");
report.push("筛选条件：|变化| ≥ 10 条且 |变化率| ≥ 20%。");
report.push("");
if (countChanges.length) {
  report.push("| 日期 | 上一快照 | 上一数量 | 当前数量 | 变化 | 变化率 |");
  report.push("|---|---|---|---|---|---|");
  for (const row of countChanges.slice(0, 30)) {
    report.push(`| ${row.date} | ${row.previous} | ${row.previousCount} | ${row.count} | ${row.delta > 0 ? "+" : ""}${row.delta} | ${row.pct}% |`);
  }
} else {
  report.push("未检测到满足条件的数量异常。");
}
report.push("");
report.push("## 6. 手动快照");
report.push("");
if (manual.length) {
  report.push("| 日期 | generatedAt | source | trigger | count | file |");
  report.push("|---|---|---|---|---|---|");
  for (const snapshot of manual) {
    report.push(`| ${snapshot.date} | ${snapshot.generatedAt} | ${snapshot.source} | ${snapshot.trigger} | ${snapshot.count} | ${snapshot.relFile} |`);
  }
} else {
  report.push("无 manual 快照。");
}
report.push("");
report.push("## 7. 研究使用注意事项");
report.push("");
report.push("- 采样时间是**实际** `generatedAt`，不是名义 10:25；请用 `interval_hours` 或实际时间差计算变化。");
report.push("- 历史快照缺少 `collection` / `collectorStats`，来源和触发方式是按时间边界推断的；2026-11-24 之前来自上游，之后来自你的 Fork。");
report.push("- 快照只包含有 downloads/installs/stars 的 top 250；`unranked` 只记录数量，不存明细。");
report.push("- 平台覆盖发生过结构变化（见第 4 节）；不要把整段历史当成稳定的五平台面板。");
report.push("- manual 快照不进入 canonical 间隔统计；分析时可用 `kind` 和 `trigger` 筛选。");
report.push("- 该报告基于生成时的本地数据；更新数据后请重新运行 `npm run analyze:panel`。");
report.push("");

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "snapshots.csv"), toCsv(snapshotHeaders, snapshotRows), "utf8");
fs.writeFileSync(path.join(outDir, "platform-coverage.csv"), toCsv(coverageHeaders, coverageRows), "utf8");
fs.writeFileSync(path.join(outDir, "skills.csv"), toCsv(skillHeaders, skillRows), "utf8");
fs.writeFileSync(path.join(outDir, "continuity-report.md"), `${report.join("\n")}\n`, "utf8");

console.log(`Wrote ${snapshotRows.length} snapshot rows, ${coverageRows.length} coverage rows, ${skillRows.length} skill rows.`);
console.log(`Canonical: ${canonical.length} | manual: ${manual.length} | missing dates: ${missingDates.length}`);
console.log(`Output: ${path.relative(repoRoot, outDir)}`);
