(function() {
  var sysInfo = wx.getSystemInfoSync();
  Page({
    data: {
      sysInfo: sysInfo
    }
  });
})();