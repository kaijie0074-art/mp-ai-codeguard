#!/usr/bin/env node
/** 动态混淆扫描器（第 5 层）：对抗「静态成员访问检测」的绕过技术。
 *
 * 背景：no-restricted-properties 只匹配 object 恰为 wx 的静态成员；文本扫描只匹配 wx.xxx 字样。
 * 见 docs/research/deep-dive-20261014.md Q1：15 变体中 9 个绕过（60%）。
 *
 * 本扫描器在 AST 上做四类检测：
 *   D1 字符串常量折叠：'getSystemInfo'+'Sync'、['get','System'].join('')、String.fromCharCode(...)
 *      —— 折叠结果包含废弃名 → dynamic-deprecated
 *   D2 计算访问：wx[非字面量] / 别名[非字面量] / new Proxy(wx,..) / Reflect.get(wx,..)
 *      —— wx-computed（动态访问需人工放行）
 *   D3 别名流（文件内一跳）：const w = wx 后 w.deprecated / w[...]
 *   D4 任意对象上的废弃名静态访问：ctx.wx.getSystemInfoSync、p.getSystemInfoSync（Proxy 后）
 *      —— review（该 API 只应存在于 wx 上，任何对象出现此成员名都值得看一眼）
 *
 * 放行机制：行内注释含 `codeguard: allow` 则跳过该行 finding（白名单要显式）。
 *
 * 用法：node scripts/scan-dynamic.mjs <目录|文件>   有 finding → exit 1
 */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse as espreeParse } from "espree";
import * as estraverse from "estraverse";
import { loadDeprecated } from "./scan-wx-api.mjs";

const ALLOW_MARKER = /codeguard:\s*allow/;

export async function collectFiles(root) {
  const stat = await import("node:fs/promises").then((m) => m.stat(root));
  if (stat.isFile()) return [root];
  const out = [];
  async function walk(dir) {
    for (const ent of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) await walk(p);
      else if (p.endsWith(".js")) out.push(p);
    }
  }
  await walk(root);
  return out;
}

/** 尽力把表达式折叠成字符串；折叠不了返回 null（保守：宁漏报不误报 folding 本身）。
 * env：文件内 const 字符串绑定（本地常量传播，Q6 对抗实测：分片变量拼接绕过单表达式折叠）。
 */
export function foldString(node, depth = 0, env = null) {
  if (depth > 24) return null;
  switch (node.type) {
    case "Literal":
      return typeof node.value === "string" ? node.value : null;
    case "TemplateLiteral":
      return node.expressions.length === 0 && node.quasis.length === 1 ? node.quasis[0].value.cooked : null;
    case "Identifier":
      return env ? (env.get(node.name) ?? null) : null;
    case "BinaryExpression":
      if (node.operator !== "+") return null;
      const l = foldString(node.left, depth + 1, env);
      const r = foldString(node.right, depth + 1, env);
      return l !== null && r !== null ? l + r : null;
    case "CallExpression":
      return foldCall(node, depth, env);
    default:
      return null;
  }
}

function foldCall(call, depth, env = null) {
  const callee = call.callee;
  // String.fromCharCode(104,105,...)
  if (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    callee.object.name === "String" &&
    callee.property.name === "fromCharCode" &&
    call.arguments.every((a) => a.type === "Literal" && typeof a.value === "number")
  ) {
    return String.fromCharCode(...call.arguments.map((a) => a.value));
  }
  // decodeURIComponent('%67%65...')：确定性纯函数，与 fromCharCode 同类
  if (
    callee.type === "Identifier" &&
    callee.name === "decodeURIComponent" &&
    call.arguments.length === 1 &&
    call.arguments[0].type === "Literal" &&
    typeof call.arguments[0].value === "string"
  ) {
    try { return decodeURIComponent(call.arguments[0].value); } catch { return null; }
  }
  // ['a','b'].join('') / .join('')
  if (
    callee.type === "MemberExpression" &&
    callee.property.name === "join" &&
    call.arguments.length <= 1
  ) {
    const sep =
      call.arguments.length === 0 ? "," : foldString(call.arguments[0], depth + 1, env);
    if (sep === null) return null;
    if (callee.object.type === "ArrayExpression") {
      const parts = callee.object.elements.map((e) => (e === null ? "" : foldString(e, depth + 1, env)));
      if (parts.every((p) => p !== null)) return parts.join(sep);
    }
  }
  return null;
}

/** 收集文件内 const 声明的可折叠字符串绑定（本地常量传播）。启发式：不区分作用域影子。 */
function collectConstEnv(ast) {
  const env = new Map();
  estraverse.traverse(ast, {
    enter(node) {
      if (node.type === "VariableDeclarator" && node.init && node.id.type === "Identifier") {
        const v = foldString(node.init, 0, env);
        if (v !== null) env.set(node.id.name, v);
      }
    },
  });
  return env;
}

export async function scanDynamic(root) {
  const deprecatedFull = (await loadDeprecated()).map((n) => n.replace(/^wx\./, ""));
  const deprecatedSet = new Set(deprecatedFull);
  const findings = [];
  for (const file of await collectFiles(root)) {
    const text = await readFile(file, "utf8");
    const lines = text.split("\n");
    let ast;
    try {
      ast = espreeParse(text, { ecmaVersion: 2022, loc: true, comment: false });
    } catch (e) {
      // 解析失败≠放行：无法解析的文件（拼接文件/语法错误）必须显式报出，
      // 否则「故意写烂语法」本身成为一种绕过（Q4 aware-09 实测）
      findings.push({ file, line: 0, level: "parse-error", evidence: `AST 解析失败：${e.message.slice(0, 80)}——该文件无法被本扫描器审计，需先保证可解析` });
      continue;
    }
    const aliases = new Set(["wx"]);
    // 第零遍：收集 const 字符串绑定（本地常量传播——分片变量拼接的克星）
    const constEnv = collectConstEnv(ast);
    // 第一遍：收集 const w = wx 一跳别名
    estraverse.traverse(ast, {
      enter(node) {
        if (
          node.type === "VariableDeclarator" &&
          node.init?.type === "Identifier" &&
          aliases.has(node.init.name) &&
          node.id.type === "Identifier"
        ) {
          aliases.add(node.id.name);
        }
      },
    });
    estraverse.traverse(ast, {
      enter(node) {
        const line = node.loc?.start.line ?? 0;
        if (line > 0 && ALLOW_MARKER.test(lines[line - 1] ?? "")) return;

        // D1a 精确裸名：字符串字面量恰为废弃名（跨函数传递的中转值，高信号）
        if (node.type === "Literal" && typeof node.value === "string" && deprecatedSet.has(node.value)) {
          findings.push({ file, line, level: "dynamic-deprecated", evidence: `字符串字面量恰为废弃 API 名 '${node.value}'` });
          return;
        }

        // D1b 任意位置的字符串拼接表达式折叠（含函数实参等内联位置）
        if (node.type === "BinaryExpression") {
          const folded = foldString(node, 0, constEnv);
          if (folded && deprecatedFull.some((d) => folded.includes(d))) {
            findings.push({ file, line, level: "dynamic-deprecated", evidence: `内联拼接折叠 → "${folded.slice(0, 60)}" 含废弃 API 名` });
            return;
          }
        }

        // D1c 变量初始化/对象属性值/join 调用折叠
        if (node.type === "VariableDeclarator" || node.type === "Property" || node.type === "CallExpression") {
          const expr = node.type === "CallExpression" ? node : (node.init ?? node.value);
          if (!expr || expr.type === "Identifier") return; // 无初始化式/纯标识符引用无可折叠内容
          const folded = node.type === "CallExpression" ? foldCall(node, 0, constEnv) : foldString(expr, 0, constEnv);
          if (folded && deprecatedFull.some((d) => folded.includes(d))) {
            findings.push({ file, line, level: "dynamic-deprecated", evidence: `字符串常量折叠 → "${folded.slice(0, 60)}" 含废弃 API 名` });
            return;
          }
        }

        if (node.type !== "MemberExpression") return;
        const objName = node.object.type === "Identifier" ? node.object.name : null;

        // D2 计算访问 wx[...] / 别名[...]（属性非字符串字面量）
        if (node.computed && objName && aliases.has(objName)) {
          const prop = node.property;
          const lit = prop.type === "Literal" ? prop.value : null;
          const folded = typeof lit === "string" ? lit : foldString(prop, 0, constEnv);
          if (typeof folded === "string" && deprecatedSet.has(folded)) {
            findings.push({ file, line, level: "dynamic-deprecated", evidence: `计算访问 ${objName}[...] 常量折叠 → '${folded}'（废弃 API）` });
            return;
          }
          if (typeof folded !== "string" || !/^[A-Za-z][\w$]*$/.test(folded)) {
            findings.push({ file, line, level: "wx-computed", evidence: `计算访问 ${objName}[...]——动态属性无法静态审计，需人工放行（codeguard: allow）` });
            return;
          }
        }

        // D3 别名静态访问 w.getSystemInfoSync；D4 任意对象 .废弃名（API 只应存在于 wx）
        if (!node.computed && node.property.type === "Identifier" && deprecatedSet.has(node.property.name)) {
          findings.push({
            file,
            line,
            level: objName && aliases.has(objName) ? "dynamic-deprecated" : "review",
            evidence: `静态访问 .${node.property.name}（对象：${objName ?? "表达式"}）——该成员名只应存在于 wx，请核实对象来源`,
          });
        }
      },
    });
    // Proxy / Reflect 包装（独立于 MemberExpression）
    estraverse.traverse(ast, {
      enter(node) {
        const line = node.loc?.start.line ?? 0;
        if (line > 0 && ALLOW_MARKER.test(lines[line - 1] ?? "")) return;
        const wrapsWx =
          (node.type === "NewExpression" && node.callee.name === "Proxy" && node.arguments[0]?.name === "wx") ||
          (node.type === "CallExpression" &&
            node.callee.type === "MemberExpression" &&
            node.callee.object.name === "Reflect" &&
            node.callee.property.name === "get" &&
            node.arguments[0]?.name === "wx");
        if (wrapsWx) {
          findings.push({ file, line, level: "wx-computed", evidence: "Proxy/Reflect 包装 wx——间接访问需人工放行" });
        }
      },
    });
  }
  const seen = new Set();
  return findings.filter((f) => {
    const k = `${f.file}:${f.line}:${f.level}:${f.evidence}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function main() {
  const root = process.argv[2];
  if (!root) {
    console.error("用法: node scripts/scan-dynamic.mjs <目录|文件>");
    process.exit(2);
  }
  const findings = await scanDynamic(root);
  if (findings.length === 0) {
    console.log(`✔ 动态混淆扫描通过（${root}）`);
    process.exit(0);
  }
  for (const f of findings) {
    console.log(`✖ [${f.level}] ${f.file}:${f.line}`);
    console.log(`    ${f.evidence}\n`);
  }
  console.log(`结论：${findings.length} 处动态混淆/待审访问`);
  process.exit(1);
}

if (process.argv[1]?.endsWith("scan-dynamic.mjs")) main().catch((e) => {
  console.error(e.message);
  process.exit(2);
});
