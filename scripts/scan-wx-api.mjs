#!/usr/bin/env node
/** wx.* API 白名单扫描器：扫描源码中所有 wx.xxx 调用，对照 docs/weixin/api-whitelist.md 表格。
 *
 * 白名单外的 API → 报「需查文档登记」，exit 1。
 * 废弃名单内的 API → 单独标红（正常应已被 ESLint 拦截，这里兜底）。
 * 白名单来源是 markdown 表格本身（文档即数据）：查文档的人和跑脚本的人看到同一份名单。
 *
 * 用法：node scripts/scan-wx-api.mjs <目录>
 */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const WHITELIST_DOC = new URL("../docs/weixin/api-whitelist.md", import.meta.url);
const DEPRECATED_DOC = new URL("../docs/weixin/deprecated-apis.json", import.meta.url);

export async function loadWhitelist() {
  const md = await readFile(WHITELIST_DOC, "utf8");
  const apis = [];
  for (const line of md.split("\n")) {
    const m = line.match(/^\|\s*(wx\.[A-Za-z][\w.]*)\s*\|/);
    if (m) apis.push(m[1]);
  }
  return apis;
}

export async function loadDeprecated() {
  const json = JSON.parse(await readFile(DEPRECATED_DOC, "utf8"));
  return json.deprecated_apis.map((a) => a.name);
}

async function walk(dir) {
  const out = [];
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}

export async function scan(root) {
  const whitelist = new Set(await loadWhitelist());
  const deprecated = new Set(await loadDeprecated());
  const findings = [];
  for (const file of await walk(root)) {
    const text = await readFile(file, "utf8");
    const used = new Set(text.match(/wx\.[A-Za-z][\w.]*/g) ?? []);
    for (const api of used) {
      if (deprecated.has(api)) {
        findings.push({ file, api, level: "deprecated", message: "废弃 API（ESLint 应已拦截，此为兜底）" });
      } else if (!whitelist.has(api)) {
        findings.push({ file, api, level: "unlisted", message: "白名单外 API——先查官方文档，再登记 docs/weixin/api-whitelist.md，然后才允许使用" });
      }
    }
  }
  return findings;
}

async function main() {
  const root = process.argv[2];
  if (!root) {
    console.error("用法: node scripts/scan-wx-api.mjs <目录>");
    process.exit(2);
  }
  const findings = await scan(root);
  if (findings.length === 0) {
    console.log(`✔ wx.* 白名单扫描通过（${root}）`);
    process.exit(0);
  }
  for (const f of findings) {
    console.log(`${f.level === "deprecated" ? "✖" : "▲"} [${f.level}] ${f.api}  @ ${f.file}`);
    console.log(`    ${f.message}\n`);
  }
  console.log(`结论：${findings.length} 处需处理（deprecated=${findings.filter((f) => f.level === "deprecated").length}）`);
  process.exit(1);
}

if (process.argv[1]?.endsWith("scan-wx-api.mjs")) main().catch((e) => {
  console.error(e.message);
  process.exit(2);
});
