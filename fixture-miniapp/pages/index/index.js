// pages/index/index.js —— AI 编程工具生成（第二个废弃调用：异步版）
Page({
  onLoad() {
    // 异步获取系统信息，回调里拿 windowWidth 做自适应
    wx.getSystemInfo({
      success: (res) => {
        this.setData({ windowWidth: res.windowWidth });
      },
    });
    // 白名单外 API：AI 凭语料"记忆"编造的分享配置接口（不存在）
    wx.setShareConfig({ title: "苍蝇馆子助手" });
    wx.showToast({ title: "欢迎", icon: "none" });
  },
  data: { windowWidth: 375 },
});
