#!/usr/bin/env node
/** 对抗评测 harness：把代码样本分别送入三层静态门禁，记录拦截结果矩阵。
 *
 * 用法：
 *   node scripts/eval-variants.mjs <corpus.json> <out.json> [--dep <废弃API名>]
 * corpus.json: { variants: [{id, category, code}] } 或 adv-gen 的 manifest.json（samples[]）
 * 输出: { results: [{id, category, eslint, scanner, dynamic, caught_by_any}], summary }
 * 判定标准：样本语义上引用了废弃 API → 任意一层报出才算 caught。
 */
import { readFile, writeFile, mkdtemp, rm, writeFile as wf } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Linter } from "eslint";
import config from "../eslint.config.mjs";
import { scan } from "./scan-wx-api.mjs";
import { scanDynamic } from "./scan-dynamic.mjs";

const argv = process.argv.slice(2);
const corpusPath = argv[0];
const outPath = argv[1];
const depIdx = argv.indexOf("--dep");
const depNames = depIdx >= 0 ? argv[depIdx + 1].split(",") : ["getSystemInfoSync", "getSystemInfo"];

if (!corpusPath || !outPath) {
  console.error("用法: node scripts/eval-variants.mjs <corpus.json> <out.json> [--dep a,b]");
  process.exit(2);
}

const linter = new Linter();

async function evalOne(v) {
  // 1) ESLint
  const messages = linter.verify(v.code, config, { filename: v.id + ".js" });
  const depHit = messages.filter(
    (m) => m.ruleId === "no-restricted-properties" && depNames.some((d) => m.message.includes(d)),
  );
  // 等效风险信号：recommended 规则里与动态执行相关的（no-eval 等）也算「另一只眼」，
  // 但需与废弃命中区分记录，不算对废弃 API 本身的拦截。
  const related = messages.filter((m) => ["no-eval", "no-with"].includes(m.ruleId));

  // 2) 白名单扫描器（文件级）
  const dir = await mkdtemp(join(tmpdir(), "cg-eval-"));
  let scannerFindings = [];
  let dynFindings = [];
  try {
    await wf(join(dir, "sample.js"), v.code, "utf8");
    scannerFindings = await scan(dir);
    dynFindings = await scanDynamic(join(dir, "sample.js"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  const scannerDep = scannerFindings.filter((f) => f.level === "deprecated");
  const scannerUnlisted = scannerFindings.filter((f) => f.level === "unlisted");

  // 3) 动态混淆扫描器（文件级）
  const dynDep = dynFindings.filter((f) => f.level === "dynamic-deprecated");
  const dynComputed = dynFindings.filter((f) => f.level === "wx-computed");
  const dynReview = dynFindings.filter((f) => f.level === "review");
  const dynParseError = dynFindings.filter((f) => f.level === "parse-error");

  const eslintCaught = depHit.length > 0;
  const scannerCaught = scannerDep.length > 0;
  // parse-error 也算拦截：无法解析的代码进不了构建（ESLint 也会先炸），不能作为有效绕过
  const dynamicCaught =
    dynDep.length > 0 || dynComputed.length > 0 || dynReview.length > 0 || dynParseError.length > 0;
  return {
    id: v.id,
    category: v.category,
    eslint: { caught: eslintCaught, rule: depHit[0]?.ruleId ?? null, all_rules: messages.map((m) => m.ruleId) },
    scanner: {
      caught: scannerCaught,
      deprecated_hits: scannerDep.map((f) => f.api),
      unlisted_hits: scannerUnlisted.map((f) => f.api),
    },
    dynamic: {
      caught: dynamicCaught,
      deprecated_hits: dynDep.map((f) => f.evidence),
      computed_hits: dynComputed.map((f) => f.evidence),
      review_hits: dynReview.map((f) => f.evidence),
      parse_errors: dynParseError.length,
    },
    related_signals: related.map((m) => m.ruleId),
    caught_by_any: eslintCaught || scannerCaught || dynamicCaught,
  };
}

const corpus = JSON.parse(await readFile(corpusPath, "utf8"));
const variants = corpus.variants ?? corpus.samples.map((s) => ({ ...s, category: "llm" }));
const results = [];
for (const v of variants) results.push(await evalOne(v));

const n = results.length;
const eslintN = results.filter((r) => r.eslint.caught).length;
const scannerN = results.filter((r) => r.scanner.caught).length;
const dynamicN = results.filter((r) => r.dynamic.caught).length;
const anyN = results.filter((r) => r.caught_by_any).length;
const summary = {
  total: n,
  eslint_caught: eslintN,
  eslint_rate: +(eslintN / n).toFixed(3),
  scanner_caught: scannerN,
  scanner_rate: +(scannerN / n).toFixed(3),
  dynamic_caught: dynamicN,
  dynamic_rate: +(dynamicN / n).toFixed(3),
  caught_by_any: anyN,
  bypass_rate: +((n - anyN) / n).toFixed(3),
};
await writeFile(outPath, JSON.stringify({ summary, results }, null, 2), "utf8");
console.log(JSON.stringify(summary, null, 2));
