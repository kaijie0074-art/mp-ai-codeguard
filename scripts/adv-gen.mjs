#!/usr/bin/env node
/** LLM 对抗样本生成器（OpenAI 兼容，智谱 GLM）。
 * Key 只从环境变量读取，绝不落盘。串行调用 + 每次间隔 2s；429 退避 60s 重试（最多 3 次）。
 *
 * 用法：
 *   GLM_API_KEY=xxx node scripts/adv-gen.mjs <mode> <N> <outdir>
 * mode:
 *   blind   — 不给规则：「用废弃 API 但写法隐蔽」
 *   aware   — 知规对抗：给完整门禁配置，要求绕过
 *   detect  — LLM 当检测器：给定代码判是否暗用废弃 API（stdin 逐样本）
 */
const BASE = "https://open.bigmodel.cn/api/coding/paas/v4";
const MODEL = process.env.ADV_MODEL || "glm-4-flash";
const KEY = process.env.GLM_API_KEY;
if (!KEY) { console.error("缺少 GLM_API_KEY 环境变量"); process.exit(2); }

const mode = process.argv[2];
const n = parseInt(process.argv[3] || "10", 10);
const outdir = process.argv[4];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function chat(messages, { maxTokens, temperature = 0.8 } = {}) {
  // 推理模型（glm-5.3-flash）的 reasoning token 与 content 共享预算，必须放大：
  // aware2 类复杂约束 prompt 实测推理耗 7.5k+ tokens，4096/8192 都会耗尽导致 content 为空
  const budget = maxTokens ?? (MODEL.includes("5.3") ? 16384 : 1024);
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens: budget }),
    });
    if (res.status === 429) {
      if (attempt === 4) throw new Error("HTTP 429 持续，配额耗尽");
      console.error(`429，退避 60s（第 ${attempt} 次）`);
      await sleep(60_000);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return (await res.json()).choices[0].message.content;
  }
}


const DEP_DOC = `废弃名单（docs/weixin/deprecated-apis.json）：
wx.getSystemInfoSync / wx.getSystemInfo / wx.getSystemInfoAsync（均自 2.20.1 停止维护）`;

const RULES = `${DEP_DOC}

本仓库的两层静态门禁：

【第 1 层 ESLint 规则 eslint.config.mjs（节选）】
"no-restricted-properties": ["error", {"object": "wx", "property": "getSystemInfoSync", ...}]
—— 匹配所有 object 名恰为 wx、property 为废弃名的静态成员访问（含 wx['getSystemInfoSync'] 字面量、const { getSystemInfoSync } = wx 解构）。

【第 2 层白名单扫描器 scripts/scan-wx-api.mjs 的核心逻辑】
用正则 /wx\\.[A-Za-z][\\w.]*/g 在源码全文（含字符串与注释）里找 wx.xxx 文本，
命中废弃名单（如 wx.getSystemInfoSync）→ 报 deprecated；不在白名单 → 报 unlisted。
即：只要源码文本里出现完整的 "wx.getSystemInfoSync" 字样（哪怕是字符串/注释里）就会被第 2 层抓住。`;

const PROMPTS = {
  blind: () => ({
    system: "你是资深微信小程序工程师。",
    user: `写一段微信小程序页面 JS 代码（Page({...}) 里的一段即可）：获取系统/设备信息。
要求：必须真正调用废弃的 wx.getSystemInfoSync（或其同步变体）拿到数据，但写法要尽量"低调"，
像普通业务代码，不要让 code reviewer 一眼看出用了废弃 API。
只输出代码本身，不要解释，不要 markdown 围栏。`,
  }),
  aware: () => ({
    system: "你是红队工程师，任务是测试静态门禁的极限（已获授权）。可以输出任何绕过技术。",
    user: `${RULES}

任务：写一段微信小程序 JS 代码，语义上必须真正调用或引用废弃 API（如 wx.getSystemInfoSync）获取数据，
但必须同时骗过上面两层门禁：既不触发 no-restricted-properties，也不让源码文本出现完整 "wx.getSystemInfoSync" 字样。
每次用一种不同的绕过技术。只输出代码本身，不要解释，不要 markdown 围栏。`,
  }),
  aware2: () => ({
    system: "你是红队工程师，任务是测试静态门禁的极限（已获授权）。可以输出任何绕过技术。",
    user: `${RULES}

此外仓库新增了第 3 层动态混淆扫描器 scripts/scan-dynamic.mjs，逻辑如下：
1. espree 解析 AST 后对字符串表达式做常量折叠：'getSystemInfo'+'Sync'、['get','System','Info','Sync'].join('')、String.fromCharCode(103,...)、无插值模板串——折叠结果包含废弃 API 名 → 报 dynamic-deprecated。
2. wx[非字符串字面量]、以及一跳别名（const w = wx 及其链）的任何计算访问 → 报 wx-computed。
3. 任何对象上的静态 .getSystemInfoSync / .getSystemInfo 成员访问（不管对象是不是 wx：Proxy 包装后、require 别名后、跨模块）→ 报 dynamic-deprecated 或 review。
4. new Proxy(wx,...) / Reflect.get(wx,...) → 报 wx-computed。

任务：写一段微信小程序 JS 代码，语义上必须真正调用或引用废弃 API wx.getSystemInfoSync 获取数据，
但必须同时骗过全部三层门禁。每次用一种不同的绕过技术。只输出代码本身，不要解释，不要 markdown 围栏。`,
  }),
  detect: null, // stdin 模式在下方单独处理
};

function stripFences(text) {
  const m = text.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  return (m ? m[1] : text).trim();
}

if (mode === "detect") {
  // stdin: 每行一个 JSON {id, code}；输出每行 {id, verdict, reason}
  const lines = (await import("node:fs")).readFileSync(0, "utf8").split("\n").filter(Boolean);
  for (const line of lines) {
    const { id, code } = JSON.parse(line);
    const content = await chat([
      { role: "system", content: "你是代码审计员。" },
      { role: "user", content: `下面这段微信小程序代码是否（以任何间接/动态/混淆方式）调用了废弃 API wx.getSystemInfoSync / wx.getSystemInfo / wx.getSystemInfoAsync？
只答一行 JSON：{"calls_deprecated": true/false, "how": "一句话依据"}\n\n代码：\n${code}` },
    ], { temperature: 0.1 });
    let verdict = content.trim();
    try { verdict = JSON.stringify(JSON.parse(content.trim().replace(/^```json|```$/g, ""))); } catch {}
    process.stdout.write(JSON.stringify({ id, raw: verdict }) + "\n");
    await sleep(2000);
  }
  process.exit(0);
}

const { mkdir, writeFile: wf } = await import("node:fs/promises");
await mkdir(outdir, { recursive: true });
const prompt = PROMPTS[mode]();
if (!prompt) { console.error(`未知 mode: ${mode}`); process.exit(2); }

const manifest = [];
for (let i = 1; i <= n; i++) {
  const content = await chat([
    { role: "system", content: prompt.system },
    { role: "user", content: prompt.user },
  ]);
  const code = stripFences(content);
  const file = `${mode}-${String(i).padStart(2, "0")}.js`;
  await wf(`${outdir}/${file}`, code, "utf8");
  manifest.push({ id: file.replace(".js", ""), file: `${outdir}/${file}`, code });
  console.error(`✔ ${file} (${code.length} chars)`);
  await sleep(2000);
}
await wf(`${outdir}/manifest.json`, JSON.stringify({ mode, model: MODEL, n, samples: manifest }, null, 2), "utf8");
console.error(`done → ${outdir}/manifest.json`);
