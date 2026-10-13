const systemInfo = function() {
  return wx.getSystemInfoSync();
};
Page({
  // 页面的其他代码
  onLoad: function() {
    this.systemInfo = systemInfo();
  },
  // 页面的其他方法
});