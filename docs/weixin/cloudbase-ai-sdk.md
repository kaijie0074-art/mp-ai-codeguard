# 云开发大模型接入门槛（官方文档快照）

> 来源：微信开放文档 developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/guide/ai/IntegratingLLM/model.html
> 快照时间：2026-10-13。

## 要点

- 前端经 `wx.cloud.extend.AI` 直调云开发售卖的大模型（DeepSeek/混元/GLM/Kimi 等）。
- **基础库门槛 ≥ 3.15.1**——低于该版本真机直接不可用，且开发者工具模拟器不报错
  （版本门槛碎片化的典型坑，问题报告 T3 §4.2-2）。
- 前端调用云开发服务不需要 request 合法域名/备案（与自建后端的关键差异，
  见 T2 仓库 mp-compliance-gate 的路径选型分析）。

## 本仓库的应对

- `deprecated-apis.json` 的 `sdk_thresholds` 登记门槛（单一事实源）。
- AGENTS.md 红线第 3 条：用门槛 API 必须显式声明版本 + 写低版本降级路径。
