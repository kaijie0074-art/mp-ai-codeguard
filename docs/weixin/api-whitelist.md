# wx.* API 白名单（单一事实源 · 文档即数据）

> 本文件同时供两类消费者读取：**AI 编程工具**（上下文工程——生成小程序代码前先读本表）
> 与 **scripts/scan-wx-api.mjs**（解析下方表格第一列做白名单校验）。
> 引入白名单外的新 API = 必须先查官方文档并更新本表（强制「查文档」动作）。

## 白名单

| api | 用途 | 最低基础库 | 文档 |
|---|---|---|---|
| wx.request | 网络请求（合法域名 HTTPS） | - | developers.weixin.qq.com |
| wx.setClipboardData | 复制到剪贴板（需追加 AI 标识，见 T2 仓库） | - | developers.weixin.qq.com |
| wx.showToast | 轻提示 | - | developers.weixin.qq.com |
| wx.navigateTo | 页面跳转 | - | developers.weixin.qq.com |
| wx.setStorageSync | 同步存储 | - | developers.weixin.qq.com |
| wx.getStorageSync | 同步读取存储 | - | developers.weixin.qq.com |
| wx.getDeviceInfo | 设备信息（pixelRatio/platform 等） | 2.20.1 | developers.weixin.qq.com |
| wx.getWindowInfo | 窗口信息（windowWidth/statusBarHeight 等） | 2.20.1 | developers.weixin.qq.com |
| wx.getSystemSetting | 系统设置（蓝牙开关/wifi 等） | 2.20.1 | developers.weixin.qq.com |
| wx.getAppAuthorizeSetting | 授权设置状态 | 2.20.1 | developers.weixin.qq.com |
| wx.getAppBaseInfo | 基础信息（SDKVersion/enableDebug 等） | 2.20.1 | developers.weixin.qq.com |
| wx.onNetworkStatusChange | 网络状态监听 | - | developers.weixin.qq.com |
| wx.cloud.extend.AI | 云开发大模型直调 | 3.15.1 | developers.weixin.qq.com |

## 禁用（详见 deprecated-apis.json，ESLint 强制）

- wx.getSystemInfoSync / wx.getSystemInfo / wx.getSystemInfoAsync —— 基础库 2.20.1 起停止维护，
  按字段拆分为五个新 API（getSystemSetting / getAppAuthorizeSetting / getDeviceInfo / getWindowInfo / getAppBaseInfo）。
  官方组件库同样中招：vant-weapp #5903、taroify #920、taro-hooks #81、uni-app #5215 均为
  废弃 getSystemInfoSync 残留 issue——AI 工具默认输出旧写法是基线预期，不是意外。
