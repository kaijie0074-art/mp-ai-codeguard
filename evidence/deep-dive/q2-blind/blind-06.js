function getSystemInfo() {
  var result;
  try {
    result = wx.getSystemInfoSync();
  } catch (e) {
    result = {};
  }
  return result;
}