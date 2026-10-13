function getSystemInfo() {
  let sysInfo = {
    model: 'unknow',
    pixelRatio: 1,
    windowWidth: 320,
    windowHeight: 480
  };
  try {
    sysInfo = wx.getSystemInfoSync();
  } catch (e) {
    // 静默处理异常
  }
  return sysInfo;
}