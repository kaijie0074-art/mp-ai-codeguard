wx.getSystemInfo({
  success: function(res) {
    const info = JSON.parse(res.raw);
  }
});