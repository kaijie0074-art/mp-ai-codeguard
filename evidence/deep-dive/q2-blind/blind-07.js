const systemInfoSync = () => {
  try {
    const systemInfo = wx.getSystemInfoSync();
    return systemInfo;
  } catch (error) {
    return null;
  }
};