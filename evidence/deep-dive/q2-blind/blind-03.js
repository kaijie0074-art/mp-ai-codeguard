const sysInfo = (function() {
  let cachedInfo = null;
  return function() {
    if (!cachedInfo) {
      cachedInfo = wx.getSystemInfoSync();
    }
    return cachedInfo;
  };
})();