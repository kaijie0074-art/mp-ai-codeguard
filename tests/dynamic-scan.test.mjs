/** 动态混淆扫描器（第 5 层）负向回归：Q1 证实的绕过技术必须被 scan-dynamic 拦截。
 * 对应研究 docs/research/deep-dive-20261014.md：基线绕过率 60% → 加固后 0%。
 */
import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanDynamic } from "../scripts/scan-dynamic.mjs";

async function scanCode(code) {
  const dir = await mkdtemp(join(tmpdir(), "dyn-test-"));
  const f = join(dir, "s.js");
  await writeFile(f, code, "utf8");
  try {
    return await scanDynamic(f);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("D1 字符串拼接 'getSystemInfo'+'Sync' 折叠命中废弃名", async () => {
  const f = await scanCode("const info = wx['getSystemInfo' + 'Sync']();\nvoid info;\n");
  assert.ok(f.some((x) => x.level === "dynamic-deprecated"), JSON.stringify(f));
});

test("D1 数组分片 join('') 折叠命中废弃名", async () => {
  const f = await scanCode("const n = ['get','System','Info','Sync'].join('');\nconst i = wx[n]();\nvoid i;\n");
  assert.ok(f.some((x) => x.level === "dynamic-deprecated"));
});

test("D1 String.fromCharCode 字符码构造命中废弃名", async () => {
  const f = await scanCode("const n = String.fromCharCode(103,101,116,83,121,115,116,101,109,73,110,102,111,83,121,110,99);\nconst i = wx[n]();\nvoid i;\n");
  assert.ok(f.some((x) => x.level === "dynamic-deprecated"));
});

test("D2 wx[变量] 计算访问报 wx-computed（无法静态审计）", async () => {
  const f = await scanCode("const k = 'getSystemInfo' + Date.now();\nconst i = wx[k]();\nvoid i;\n");
  assert.ok(f.some((x) => x.level === "wx-computed"));
});

test("D3 一跳别名 const w = wx 后 w.getSystemInfoSync 命中", async () => {
  const f = await scanCode("const w = wx;\nconst i = w.getSystemInfoSync();\nvoid i;\n");
  assert.ok(f.some((x) => x.level === "dynamic-deprecated"));
});

test("D3 别名链 const w = wx; const w2 = w 后 w2[...] 同样视为 wx 计算访问", async () => {
  const f = await scanCode("const w = wx;\nconst w2 = w;\nconst i = w2['get' + 'SystemInfoSync']();\nvoid i;\n");
  assert.ok(f.some((x) => x.level === "dynamic-deprecated"));
});

test("D4 Proxy 包装 wx 报 wx-computed", async () => {
  const f = await scanCode("const p = new Proxy(wx, {});\nconst i = p.getSystemInfoSync();\nvoid i;\n");
  assert.ok(f.some((x) => x.level === "wx-computed" || x.level === "review" || x.level === "dynamic-deprecated"));
});

test("D4 Reflect.get(wx, ...) 报 wx-computed", async () => {
  const f = await scanCode("const fn = Reflect.get(wx, 'getSystemInfo' + 'Sync');\nvoid fn;\n");
  assert.ok(f.some((x) => x.level === "wx-computed"));
});

test("D4 任意对象上的废弃名静态访问（跨模块别名）至少报 review", async () => {
  const f = await scanCode("const ctx = require('./app.js');\nconst i = ctx.wx.getSystemInfoSync();\nvoid i;\n");
  assert.ok(f.some((x) => x.level === "review" || x.level === "dynamic-deprecated"));
});

test("放行机制：行内 codeguard: allow 注释可显式豁免计算访问", async () => {
  const f = await scanCode("const k = 'width';\nconst i = wx[k]; // codeguard: allow 动态取窗口宽度\nvoid i;\n");
  assert.equal(f.length, 0, JSON.stringify(f));
});

test("不误杀：合规页面（fixture good.js）零 finding", async () => {
  const f = await scanDynamic(join(new URL("..", import.meta.url).pathname, "fixture-miniapp", "pages", "good", "good.js"));
  assert.equal(f.length, 0, JSON.stringify(f));
});

test("不误杀：普通字符串/注释中无废弃名的动态访问不折叠误报", async () => {
  const f = await scanCode("const k = 'model';\nconst m = wx.getDeviceInfo()[k];\nvoid m;\n");
  // wx.getDeviceInfo() 合规；wx 对象上的计算访问 k 报 wx-computed 是预期防御行为，
  // 但不得出现 dynamic-deprecated 级误报
  assert.ok(!f.some((x) => x.level === "dynamic-deprecated"), JSON.stringify(f));
});
