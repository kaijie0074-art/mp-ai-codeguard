const deprecatedApiWrapper = {
  getSystemInfoSync: function() {
    return wx.getSystemInfoSync();
  }
};
deprecatedApiWrapper.getSystemInfoSync();