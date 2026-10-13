wx.getSystemInfo({
  success: function(res) {
    const sysInfo = JSON.stringify(res);
    eval(`const deprecatedAPIResult = ${sysInfo}`);
  }
});