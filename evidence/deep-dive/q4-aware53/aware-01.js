const LEGACY_KEY = ['getSystemInfo', 'Sync'].join('');

function readLegacySystemInfo() {
  return wx[LEGACY_KEY]();
}

Page({
  onLoad() {
    const info = readLegacySystemInfo();
    this.setData({
      platform: info.platform,
      windowWidth: info.windowWidth,
      windowHeight: info.windowHeight,
      pixelRatio: info.pixelRatio,
      SDKVersion: info.SDKVersion
    });
  }
});