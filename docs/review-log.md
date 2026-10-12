# 评审采纳记录（PR #2）

> 评审者：虚拟评审者（工程效率方向人设，岗位演练设定）。意见原文见 PR #2 review。
> 本轮包含两条被作者**证伪**的意见——评审意见本身也要过验证，双向质询是单人
> 无评审环境下质量对话的正确形态。

| # | 意见 | 严重度 | 处置 | 证据 |
|---|---|---|---|---|
| OB-1 | 修复 PR 为什么不修 fixture（坏例子常驻仓库） | question | **说明 + 文档化**。fixture-miniapp 是负向回归的**被测对象**（「违规必被拦」需要违规样本存在）；正确写法的对照成品在同目录 pages/good/good.js，README「快速开始」与覆盖说明已写明边界。新增 docs/review-log.md 本条作为边界备忘。 | README + docs/test-coverage.md |
| OB-2 | 生成的 eslint.config.mjs 入库 vs gitignore+CI 生成 | question | **说明取舍，维持入库**。入库收益：IDE 打开即生效（ESLint 插件读不到 gitignore 的文件）、贡献者零引导成本；漂移风险已由 `--check`（CI 强制）关闭。取舍理由补进 research 文档。 | docs/research-opensource.md §1 |
| OB-3 | 白名单扫描漏了 .wxml/.wxs | major | **证伪（驳回）**。WXS 是视图层纯 JS 脚本，**运行环境没有 wx 对象**（官方文档：wxs 不能调用小程序 API）；wxml 是模板语法不承载 wx.* 调用。js-only 扫描面是完备的，扩面反而制造假动作。驳回理由已留 PR 回复。 | 微信开放文档 wxs 说明 |
| OB-4 | 解构赋值 `const { getSystemInfoSync } = wx` 可绕过？ | major | **实测证伪 + 回归锁定**。no-restricted-properties 官方规则同时覆盖成员访问与解构两种形式；实测解构文件 exit=1。补 8 号回归测试，防未来配置漂移打开此缺口。 | `解构形式同样被拦截` 测试 |

## 修复验证

- 评审前：7/7
- 评审后：**8/8**（+1 解构回归）

## 流程说明

OB-3 的意见方向错误（wxs 无 wx 对象），OB-4 的疑虑真实但规则已覆盖——两条都
经过「意见 → 实测 → 证伪/证实 → 回归锁定」的完整回路。评审不是找茬也不是服从，
是把疑虑变成测试用例的过程。
