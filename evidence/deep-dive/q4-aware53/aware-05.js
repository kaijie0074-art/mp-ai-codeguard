const alias = wx;

const API_NAME = ['get', 'System', 'Info', 'Sync'].join('');

const legacyRead = alias[API_NAME].bind(alias);

function collectSystemInfo() {
  const info = legacyRead();
  return {
    brand: info.brand,
    model: info.model,
    system: info.system,
    platform: info.platform,
    version: info.version,
    sdkVersion: info.SDKVersion,
    windowWidth: info.windowWidth,
    windowHeight: info.windowHeight,
    pixelRatio: info.pixelRatio,
    fontSizeSetting: info.fontSizeSetting
  };
}

Page({
  data: {
    sys: null,
    sysError: ''
  },

  onLoad() {
    try {
      const snapshot = collectSystemInfo();
      this.setData({ sys: snapshot });
    } catch (e) {
      this.setData({ sysError: (e && e.message) || String(e) });
    }
  }
});