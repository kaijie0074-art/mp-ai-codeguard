# AGENTS.md — AI 编程工具工作规则（小程序项目）

> 本文件是给 AI 编程工具（Codex / Claude Code / Cursor）的**强制上下文**。
> 每次会话开工，先向用户复述一遍下方「红线」，再动手。
> 来源：岗位问题报告 T3——AI 工具对小程序生态的知识系统性过时，单人无评审，
> 质量担保全靠「你 + 工具」，机械防线是唯一可靠的评审。

## 红线（违反任意一条 = 立即返工）

1. **禁止生成废弃 API**：`wx.getSystemInfoSync` / `wx.getSystemInfo` / `wx.getSystemInfoAsync`
   （基础库 2.20.1 起停止维护）。需要设备/窗口信息时按字段拆分：
   - system 相关 → `wx.getSystemSetting`
   - 授权状态 → `wx.getAppAuthorizeSetting`
   - 设备信息 → `wx.getDeviceInfo`
   - 窗口信息 → `wx.getWindowInfo`
   - 基础信息 → `wx.getAppBaseInfo`
2. **禁止使用白名单外的 wx.\* API**：引入任何新 API 前必须先更新
   `docs/weixin/api-whitelist.md`（查官方文档后登记），再写代码。
3. **基础库门槛必须显式声明**：流式响应（enableChunked/onChunkReceived）≥ 2.20.1；
   云开发 AI（wx.cloud.extend.AI）≥ 3.15.1。代码用到哪个门槛，app.json /
   project.config.json 必须一致，并写低版本降级路径。
4. **每个改动跑门禁**：`npm run gate`（ESLint 废弃 API 拦截 + wx.* 白名单扫描 + 动态混淆扫描），
   红了不许提交。CI 同样强制。
5. **禁止动态构造废弃 API 调用**：字符串拼接/join/fromCharCode 构造 API 名、别名变量、
   Proxy/Reflect 包装，都会被 `scripts/scan-dynamic.mjs` 拦下；经函数参数/返回值间接化传 wx
   是静态分析已知盲区（docs/research/deep-dive-20261014.md Q7），属于恶意规避——
   代码评审看到一律打回。

## 工作流

- 改动涉及 wx.* 调用 → 先读 `docs/weixin/api-whitelist.md` 再写代码。
- 不确定 API 是否存在 → 停下来查官方文档，**不要凭语料记忆生成**——封闭生态的
  新 API 不在训练语料里，编造概率高。
- 废弃名单与门槛版本的唯一权威来源：`docs/weixin/deprecated-apis.json`
  （ESLint 配置由 scripts/build-eslint-config.mjs 从它生成，改一处处处生效）。

## 为什么这么严格（证据）

- 官方文档：wx.getSystemInfoSync 自 2.20.1 停止维护（微信开放文档原文）。
- 生态实锤：vant-weapp #5903、taroify #920、taro-hooks #81（均为废弃调用被用户报 issue）；
  uni-app #5215（微信小程序端 getSystemInfo/getSystemInfoSync 停止维护适配）。
- 连官方系组件库都会残留废弃调用，AI 工具默认输出旧写法是**基线预期**——
  防线必须是机械的，不能靠「小心一点」。
