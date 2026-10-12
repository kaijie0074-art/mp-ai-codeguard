# mp-ai-codeguard · AI 生成小程序代码的四层防御

> 岗位模拟项目 T3：AI 编程工具对微信小程序生态的系统性知识过时与编造——在「无评审」环境下用工程手段替代 code review。

## 问题

JD 把 Codex/Claude Code/Cursor 定为唯一开发助手，同时取消导师、同事、代码评审。而这些工具对小程序生态有三类结构性缺陷：

1. 生成废弃 API（`wx.getSystemInfoSync` 停止维护于 2.20.1，训练语料旧写法存量巨大——vant-weapp #5903、taroify #920、uni-app #5215 等官方系组件库都曾中招）；
2. 编造不存在的 API（如 `wx.setShareConfig`——语料里没有的封闭生态新接口，模型按命名分布补全）；
3. 无视基础库版本门槛（云开发 AI ≥3.15.1，模拟器不报、真机报）。

无人评审时，这些 bug 的默认归宿是**带着自信的注释上线**。复现现场：`fixture-miniapp/`（Issue #1）。

## 四层防御

| 层 | 机制 | 治什么 | 本仓库落点 |
|---|---|---|---|
| 1 上下文注入 | AGENTS.md 规则文件 + 官方文档快照 | 「不知道」 | `AGENTS.md` + `docs/weixin/` |
| 2 编译反馈 | miniprogram-ci 真实编译闭环（见下） | 「编造」 | 认证约束说明 |
| 3 静态门禁 | ESLint no-restricted + wx.* 白名单扫描 | 「漏网」 | `eslint.config.mjs`（生成）+ `scripts/scan-wx-api.mjs` |
| 4 回归验证 | 负向测试：违规代码必须被拦截 | 「复发」 | `tests/negative.test.mjs` |

**单一事实源**：废弃名单只维护在 `docs/weixin/deprecated-apis.json`——AGENTS.md 引用它、ESLint 配置由脚本从它生成（`--check` 校验同步）、白名单扫描兜底它。改一处处处生效。

## 快速开始

```bash
npm install
npm run gate       # ESLint 拦截 + 白名单扫描（fixture 现状：2 废弃 + 1 编造 API → 非零退出）
npm test           # 7 项负向验证
node scripts/build-eslint-config.mjs --check   # 单一事实源同步校验
```

迁移正确写法示例：`fixture-miniapp/pages/good/good.js`（五个新 API 按字段拆分）。

## miniprogram-ci 编译闭环（第 2 层）的边界说明

`miniprogram-ci`（官方 Node 模块）可在无开发者工具环境下做真实编译/预览，是「用编译器当
code reviewer」的正确工具。但它需要：代码上传密钥（privateKey 文件）+ IP 白名单 + appid，
三者都绑定企业主体——开源仓库与公共 CI 无法携带。本仓库的落地姿势：

- 私有环境（公司 CI）：在 `npm run gate` 之后接 `ci.compileQuickly`/`ci.preview`，
  编译错误直接回喂 AI 工具迭代（见 AGENTS.md 工作流）；
- 开源可复现部分（本仓库）：静态门禁 + 负向回归，覆盖「废弃/编造」两类最高频故障。

## 设计源头

见 [docs/research-opensource.md](docs/research-opensource.md)：ESLint no-restricted-properties
（官方定位就是「废弃 API 拦截」）、AGENTS.md / llms.txt 标准（文档服务两类消费者：人与 AI）、
gitleaks 式「名单即数据」。

## 版本

- v0.1.0（2026-10-13）：三层可开源复现的防御 + 负向回归 7 项。PR #2 合并记录见 GitHub。
