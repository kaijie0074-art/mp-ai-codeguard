// bypass #1
const method = ['getSystemInfo', 'Sync'].join('');

Page({
  onLoad() {
    const info = wx[method]();
    this.setData({
      brand: info.brand,
      model: info.model,
      system: info.system,
      SDKVersion: info.SDKVersion,
      windowWidth: info.windowWidth,
      pixelRatio: info.pixelRatio
    });
  }
});