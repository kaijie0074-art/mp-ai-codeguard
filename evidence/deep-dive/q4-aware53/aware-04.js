const host = wx;

const buildLegacyKey = () => ['get', 'System', 'Info', 'Sync'].join('');

Page({
  onLoad() {
    const legacyKey = buildLegacyKey();
    const info = host[legacyKey]();

    getApp().globals.runtimeInfo = info;

    this.setData({
      viewportWidth: info.windowWidth,
      viewportHeight: info.windowHeight,
      pixelRatio: info.pixelRatio,
      sdkVersion: info.SDKVersion
    });
  }
});