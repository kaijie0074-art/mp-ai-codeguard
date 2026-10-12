# wx.getSystemInfoSync 停止维护（官方公告快照）

> 来源：微信开放文档 developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getSystemInfoSync.html
> 快照时间：2026-10-13。原文要点摘录，未改写语义。

## 原文要点

> Object wx.getSystemInfoSync()
> **从基础库 2.20.1 开始，本接口停止维护，请使用 wx.getSystemSetting、
> wx.getAppAuthorizeSetting、wx.getDeviceInfo、wx.getWindowInfo、wx.getAppBaseInfo 代替。**

- 同步获取系统信息的旧入口，拆分为五个按领域的新 API。
- 同批停止维护：`wx.getSystemInfo`、`wx.getSystemInfoAsync`。

## 五个替代 API 的字段归属

| 旧字段 | 新 API |
|---|---|
| bluetoothEnabled / locationEnabled / wifiEnabled / deviceOrientation | wx.getSystemSetting |
| locationAuthorized / cameraAuthorized / microphoneAuthorized … | wx.getAppAuthorizeSetting |
| brand / model / system / platform / pixelRatio / benchmarkLevel | wx.getDeviceInfo |
| pixelRatio / windowWidth / windowHeight / statusBarHeight / safeArea | wx.getWindowInfo |
| SDKVersion / enableDebug / host / language / version | wx.getAppBaseInfo |

## 生态影响实锤（AI 工具为何必然中招）

训练语料中旧写法存量巨大，连官方系组件库都曾被用户报出残留：

- vant-weapp #5903（open，2024-10）：Bug Report: wx.getSystemInfoSync is deprecated
- taroify #920、taro-hooks #81：同因
- uni-app #5215（closed，2024-11）：微信小程序端的 wx.getSystemInfo / wx.getSystemInfoSync 停止维护

结论：AI 生成小程序代码默认输出废弃写法是**基线预期**，防线必须机械。
