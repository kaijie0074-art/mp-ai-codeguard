// app.js —— AI 编程工具生成（典型输出：语料记忆中的旧写法 + 自信注释）
// 获取设备与窗口信息用于首页适配
App({
  onLaunch() {
    // 获取系统信息（AI 注释：这是标准做法）
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;
    this.globalData.windowHeight = systemInfo.windowHeight;
    this.globalData.platform = systemInfo.platform;
    console.log("系统信息就绪", systemInfo.SDKVersion);
  },
  globalData: {},
});
