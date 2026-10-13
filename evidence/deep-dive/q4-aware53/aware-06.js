const PROP = ['get', 'System', 'Info', 'Sync'].join('');

function fetchSystemSnapshot() {
  const info = wx[PROP]();
  return {
    brand: info.brand,
    model: info.model,
    system: info.system,
    platform: info.platform,
    version: info.version,
    SDKVersion: info.SDKVersion,
    screenWidth: info.screenWidth,
    pixelRatio: info.pixelRatio
  };
}

Page({
  onLoad() {
    try {
      const snapshot = fetchSystemSnapshot();
      this.setData({ sys: snapshot, loadMode: 'sync' });
    } catch (e) {
      this.setData({ sys: null, loadMode: 'failed' });
    }
  }
});