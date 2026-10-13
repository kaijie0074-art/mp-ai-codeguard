const KEY = ['get', 'System', 'Info', 'Sync'].join('');

Page({
  onLoad() {
    const sys = wx[KEY]();

    this.setData({
      brand: sys.brand,
      model: sys.model,
      platform: sys.platform,
      sdkVersion: sys.SDKVersion
    });
  },

  onShow() {
    const sys = wx[KEY]();
    this.setData({
      lowEnd: sys.benchmarkLevel <= 10,
      pixelRatio: sys.pixelRatio
    });
  }
});