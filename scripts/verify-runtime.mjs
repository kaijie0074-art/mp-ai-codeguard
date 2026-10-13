#!/usr/bin/env node
/** 运行时语义验证器：在 mock wx 环境里执行对抗样本，确认其运行时真正调用了废弃 API。
 * 防止把「任务失败（根本没调用）」误计为「绕过成功」。
 *
 * 用法：node scripts/verify-runtime.mjs <manifest.json> <out.json>
 */
import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const argv = process.argv.slice(2);
const manifest = JSON.parse(await readFile(argv[0], "utf8"));
const out = [];

function makeContext(calls) {
  const deprecated = ["getSystemInfoSync", "getSystemInfo", "getSystemInfoAsync"];
  const wx = new Proxy(
    {},
    {
      get(_, prop) {
        if (deprecated.includes(prop)) {
          return (...a) => {
            calls.push(prop);
            return { platform: "mock", model: "mock", windowWidth: 375, brand: "mock", SDKVersion: "3.0.0", system: "mock", screenWidth: 375, pixelRatio: 2 };
          };
        }
        if (prop === "getStorage") return (opts) => opts?.success?.({ data: "getSystemInfoSync" });
        if (prop === "base64ToArrayBuffer") return (s) => Buffer.from(s, "base64").buffer;
        if (prop === "getDeviceInfo") return () => ({ platform: "mock" });
        return typeof prop === "string" ? (...a) => ({ args: a }) : undefined;
      },
    },
  );
  return {
    wx,
    Page: (cfg) => {
      try { cfg.onLoad?.call(cfg); cfg.onShow?.call(cfg); cfg.onReady?.call(cfg); } catch {}
      cfg.setData ??= () => {};
    },
    App: (cfg) => {},
    getApp: () => ({ globals: {} }),
    require: () => ({}),
    module: { exports: {} },
    exports: {},
    console: { log: () => {}, error: () => {}, warn: () => {} },
    setTimeout: (f) => {},
  };
}

for (const s of manifest.samples) {
  const calls = [];
  const ctx = makeContext(calls);
  let error = null;
  try {
    vm.runInNewContext(s.code, ctx, { timeout: 3000 });
  } catch (e) {
    error = e.message;
  }
  const invoked = calls.filter((c) => ["getSystemInfoSync", "getSystemInfo", "getSystemInfoAsync"].includes(c));
  out.push({ id: s.id, runtime_invoked_deprecated: invoked.length > 0, invoked: [...new Set(invoked)], error });
}
await writeFile(argv[1], JSON.stringify(out, null, 2), "utf8");
for (const r of out) {
  console.log(r.id.padEnd(12), r.runtime_invoked_deprecated ? "✓ 真调用(" + r.invoked.join(",") + ")" : "✗ 未调用", r.error ? `[err: ${r.error.slice(0, 50)}]` : "");
}
