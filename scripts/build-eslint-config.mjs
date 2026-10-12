#!/usr/bin/env node
/** 从 docs/weixin/deprecated-apis.json 生成 ESLint no-restricted 配置片段。
 *
 * 单一事实源实践：废弃名单只维护在 deprecated-apis.json，
 * AGENTS.md 引用它、本脚本消费它生成 eslint.config.mjs 的规则段——
 * 改一处处处生效，杜绝「文档说禁了、lint 却没拦」的分叉。
 *
 * 用法：node scripts/build-eslint-config.mjs [--check]
 *   --check：不写文件，只校验现有 eslint.config.mjs 是否与名单同步（CI 用）
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, "docs/weixin/deprecated-apis.json");
const DST = join(ROOT, "eslint.config.mjs");

function restrictedEntries(apis) {
  return apis.map((a) => ({
    object: "wx",
    property: a.name.replace(/^wx\./, ""),
    message: `${a.name} 自基础库 ${a.deprecated_since} 起停止维护。替代：${a.replaced_by.join(" / ")}。依据 docs/weixin/deprecated-apis.json`,
  }));
}

export function renderConfig(deprecated) {
  const entries = JSON.stringify(restrictedEntries(deprecated.deprecated_apis), null, 6)
    .replace(/"([a-zA-Z_]+)":/g, '"$1":');
  void entries;
  return `// 由 scripts/build-eslint-config.mjs 从 docs/weixin/deprecated-apis.json 生成——请勿手改。
// 改废弃名单：编辑 deprecated-apis.json 后运行 npm run build:eslint。
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { wx: "readonly", Page: "readonly", App: "readonly", getApp: "readonly", require: "readonly", module: "readonly", console: "readonly" },
    },
    rules: {
      "no-restricted-properties": ["error", ...${JSON.stringify(restrictedEntries(deprecated.deprecated_apis), null, 6).replace(/\n/g, "\n      ")}],
      "no-restricted-globals": "off",
    },
  },
];
`;
}

async function main() {
  const deprecated = JSON.parse(await readFile(SRC, "utf8"));
  const config = renderConfig(deprecated);
  if (process.argv.includes("--check")) {
    const current = await readFile(DST, "utf8");
    if (current !== config) {
      console.error("eslint.config.mjs 与 deprecated-apis.json 不同步——运行 npm run build:eslint");
      process.exit(1);
    }
    console.log("✔ eslint 配置与废弃名单同步");
    return;
  }
  await writeFile(DST, config, "utf8");
  console.log(`✔ eslint.config.mjs 已生成（${deprecated.deprecated_apis.length} 条废弃规则）`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(2);
});
