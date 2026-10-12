// pages/good/good.js —— 迁移后的正确写法示例（五个新 API 按字段拆分）
Page({
  onLoad() {
    const windowInfo = wx.getWindowInfo(); // 窗口信息：windowWidth/statusBarHeight
    const deviceInfo = wx.getDeviceInfo(); // 设备信息：platform/pixelRatio
    this.setData({ windowWidth: windowInfo.windowWidth });
    this.setData({ platform: deviceInfo.platform });
    wx.setStorageSync("lastVisit", Date.now());
  },
  data: { windowWidth: 375, platform: "" },
});
