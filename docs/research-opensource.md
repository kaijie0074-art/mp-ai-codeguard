# 开源项目调研笔记（T3 · AI 代码防御）

> 调研时间：2026-10-13。项目/标准均经独立检索核实；未能核实的显式标注。

## 1. ESLint no-restricted-properties / no-restricted-globals

- 文档：https://eslint.org/docs/latest/rules/no-restricted-properties
- 官方定位原文：*"Certain properties on objects may be disallowed in a codebase.
  **This is useful for deprecating an API** or restricting usage of a module's methods."*
- 核心机制：`{ object, property, message }` 三元组锁定 `wx.getSystemInfoSync` 这类
  成员访问，message 直接给替代指引——报错即文档。规则同时覆盖**解构赋值**形式
  （`const { getSystemInfoSync } = wx`，评审 OB-4 实测验证，回归测试锁定）。
- **借鉴点**：本仓库第 3 层门禁的主体。关键增强：**配置不手写**，由
  `scripts/build-eslint-config.mjs` 从 `deprecated-apis.json` 生成（`--check` 防漂移）——
  官方规则本身不解决「名单多处维护分叉」问题，生成器解决。
- **生成物入库的取舍（评审 OB-2）**：`eslint.config.mjs` 选择提交进 git 而非
  gitignore + CI 现生成——收益是 IDE 的 ESLint 插件打开仓库即生效（读不到被
  ignore 的文件）、贡献者零引导；漂移风险由 `--check`（CI 强制）关闭。

## 2. AGENTS.md 标准（agents.md）与 llms.txt（llmstxt.site）

- AGENTS.md：仓库根的 AI 编程工具规则文件事实标准（Codex / Claude Code 等工具消费）。
- llms.txt：网站向 LLM 提供结构化文档索引的提案（llmstxt.site）。
- **借鉴点**：第 1 层上下文工程。本仓库的实践是两者思想的组合：
  - `AGENTS.md` = 行为规则（禁什么、必须复述什么）；
  - `docs/weixin/` = 知识快照（官方文档 markdown 化 + 机器可解析数据表）。
  - 微信开放文档没有官方 llms.txt / MCP 服务（对比：智谱有
    docs.bigmodel.cn/llms.txt）——封闭生态缺权威上下文通道，所以快照要自己做，
    且**必须带快照日期**（过期快照比没有快照更危险）。

## 3. gitleaks / secretlint

- 仓库：https://github.com/gitleaks/gitleaks
- **借鉴点**：「名单即数据」——规则与扫描器分离，名单可版本化、可 review、可生成。
  本仓库 `deprecated-apis.json`（机器源）+ `api-whitelist.md`（人读表，脚本同源解析）
  是同一思想的两种投影：改名单走 PR，历史可追溯——**名单的每次变更本身就是一次
  「查过文档」的留痕**，这正是问题报告 T3 第 3 层要强制的动作。

## 4. miniprogram-ci（微信官方）

- npm：https://www.npmjs.com/package/miniprogram-ci · 官方文档：developers.weixin.qq.com/miniprogram/dev/devtools/ci
- 核心机制：开发者工具的编译模块抽离，Node API 做上传/预览/编译；需上传密钥
  （不公开存储）+ IP 白名单。
- **借鉴点与边界**：第 2 层「编译器当 code reviewer」的正确工具——它不评审风格，
  但绝不放过编造的组件名与坏配置。认证绑定企业主体 → 开源 CI 无法携带密钥，
  本仓库把它定义为「私有环境步骤」，开源可复现部分由第 3/4 层覆盖
  （README「边界说明」一节）。诚实的分层比假装全开源更重要。

## 5. 生态实锤（证据基础，全部独立核实）

- 微信开放文档：wx.getSystemInfoSync 自 2.20.1 停止维护 + 五个替代 API（原文）。
- youzan/vant-weapp #5903（open，2024-10）：官方组件库内废弃调用被用户报 issue。
- dcloudio/uni-app #5215（closed，2024-11）：微信端 getSystemInfo/Sync 停止维护适配。
- 同现象：MellowCo/taroify #920、innocces/taro-hooks #81。
- 注：原岗位问题报告引用的 TDesign #3162 本次独立检索未直接命中，以 vant-weapp
  #5903 等同因 issue 替代佐证——证据链不依赖单一仓库。
- WXS 边界（评审 OB-3 证伪依据）：微信开放文档——WXS 为视图层纯 JS 脚本，
  **运行环境没有 wx 对象**，不能调用小程序 API。js-only 扫描面完备。

## 机制对照表

| 本仓库组件 | 思想源头 | 增强点 |
|---|---|---|
| AGENTS.md + docs/weixin/ | AGENTS.md/llms.txt 标准 | 快照带日期；数据表机器可解析 |
| eslint.config.mjs（生成） | ESLint no-restricted | 单一事实源 + --check 防漂移 |
| scan-wx-api.mjs | gitleaks 名单即数据 | 白名单即 md 文档（文档即数据） |
| 负向回归测试 | — | 「违规必须被拦」本身成为被测行为 |

## 未采纳的候选

- **自定义 ESLint 插件（eslint-plugin-mp）**：no-restricted 配置已覆盖废弃 API 拦截，
  写插件解决的是「规则复用分发」问题——单仓库阶段是过度工程。名单膨胀到几十条
  或需跨仓库复用时再抽取。
- **MCP 文档服务**：微信无官方 MCP；自建 MCP 服务对单人 2-4 周项目是新的运维面，
  markdown 快照 + AGENTS.md 已达成同等上下文注入效果。
