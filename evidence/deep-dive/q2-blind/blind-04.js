Page({
  onLoad: function() {
    var sysInfo = {
      model: '',
      pixelRatio: '',
      windowWidth: '',
      windowHeight: '',
      language: '',
      version: '',
      platform: ''
    };
    sysInfo.model = wx.getSystemInfoSync().model;
    sysInfo.pixelRatio = wx.getSystemInfoSync().pixelRatio;
    sysInfo.windowWidth = wx.getSystemInfoSync().windowWidth;
    sysInfo.windowHeight = wx.getSystemInfoSync().windowHeight;
    sysInfo.language = wx.getSystemInfoSync().language;
    sysInfo.version = wx.getSystemInfoSync().version;
    sysInfo.platform = wx.getSystemInfoSync().platform;
    // ...其他业务逻辑
  }
});