(function() {
  var __getSystemInfoSync = wx.getSystemInfoSync;
  Page({
    data: {
      systemInfo: __getSystemInfoSync()
    }
  });
})();