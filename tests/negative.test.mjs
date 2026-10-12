/** 负向验证测试（T3 验收判据 §4.4-1）：
 * 故意存在的废弃 API 必须被门禁拦截（ESLint + 白名单扫描双路），
 * 合规代码必须放行（不误杀），单一事实源必须同步。
 */
import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { scan, loadWhitelist, loadDeprecated } from "../scripts/scan-wx-api.mjs";

const run = promisify(execFile);
const ROOT = new URL("..", import.meta.url).pathname;

async function runExpectFail(cmd, args) {
  const { stdout, stderr, code } = await run(cmd, args, { cwd: ROOT }).catch((e) => e);
  return { output: `${stdout ?? ""}\n${stderr ?? ""}`, code: code ?? 0 };
}


test("负向验证：废弃 API wx.getSystemInfoSync 必须被 ESLint 拦截且报错含替代 API（验收判据 1）", async () => {
  const { code, output } = await runExpectFail("npx", ["eslint", "fixture-miniapp/app.js"]);
  assert.equal(code, 1, "存在废弃 API 时 eslint 必须非零退出");
  assert.match(output, /getSystemInfoSync/);
  assert.match(output, /wx\.getDeviceInfo/, "报错信息必须给出替代 API 指引");
  assert.match(output, /2\.20\.1/, "报错信息必须说明废弃起始版本");
});

test("负向验证：废弃 API wx.getSystemInfo（异步版）同样被拦截", async () => {
  const { code, output } = await runExpectFail("npx", ["eslint", "fixture-miniapp/pages/index/index.js"]);
  assert.equal(code, 1);
  assert.match(output, /getSystemInfo['"]?\s+自基础库/);
});
test("解构形式同样被拦截（评审 OB-4 验证：no-restricted-properties 覆盖解构赋值）", async () => {
  const { writeFile, rm } = await import("node:fs/promises");
  const tmp = join(ROOT, "fixture-miniapp", "pages", "destructure-check.tmp.js");
  await writeFile(tmp, "const { getSystemInfoSync } = wx;\nconst info = getSystemInfoSync();\nvoid info;\n", "utf8");
  try {
    const { code, output } = await runExpectFail("npx", ["eslint", tmp]);
    assert.equal(code, 1, "解构形式必须同样被拦截");
    assert.match(output, /getSystemInfoSync/);
  } finally {
    await rm(tmp);
  }
});

test("白名单扫描：编造 API（wx.setShareConfig）被识别为 unlisted", async () => {
  const findings = await scan(join(ROOT, "fixture-miniapp"));
  const unlisted = findings.filter((f) => f.level === "unlisted");
  const deprecated = findings.filter((f) => f.level === "deprecated");
  assert.ok(deprecated.length >= 2, "两个废弃调用都应命中");
  assert.ok(unlisted.some((f) => f.api === "wx.setShareConfig"), "AI 编造的 API 必须被识别");
});

test("不误杀：迁移后的正确代码（pages/good）零违规", async () => {
  const findings = await scan(join(ROOT, "fixture-miniapp", "pages", "good"));
  assert.equal(findings.length, 0);
  const { code } = await run("npx", ["eslint", "fixture-miniapp/pages/good/good.js"], { cwd: ROOT })
    .then((r) => ({ code: 0 }))
    .catch((e) => ({ code: e.code }));
  assert.equal(code, 0);
});

test("单一事实源：eslint.config.mjs 与 deprecated-apis.json 同步（--check）", async () => {
  const { code, output } = await runExpectFail("node", ["scripts/build-eslint-config.mjs", "--check"]);
  assert.equal(code, 0, output);
});

test("单一事实源：白名单 md 表格可被机器解析（文档即数据）", async () => {
  const whitelist = await loadWhitelist();
  assert.ok(whitelist.length >= 10, `白名单应至少 10 条，实际 ${whitelist.length}`);
  assert.ok(whitelist.every((a) => /^wx\.[A-Za-z][\w.]*$/.test(a)));
  const deprecated = await loadDeprecated();
  for (const d of deprecated) {
    assert.ok(!whitelist.includes(d), `废弃 API ${d} 不得出现在白名单`);
  }
});

test("废弃名单完整性：三个 getSystemInfo 变体 + 五个替代 API", async () => {
  const deprecated = await loadDeprecated();
  assert.deepEqual(
    deprecated.sort(),
    ["wx.getSystemInfo", "wx.getSystemInfoAsync", "wx.getSystemInfoSync"].sort()
  );
});
