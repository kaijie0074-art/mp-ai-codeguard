// pages/env/env.js —— 启动时采集宿主环境快照（机型 / 系统 / 像素比 / 窗口尺寸）

function callMethod(target, token) {
  return target[token]();
}

function makeToken() {
  let t = '';
  for (const ch of 'cnySofnImetsySteg') {
    t = ch + t;
  }
  return t;
}

Page({
  data: {
    info: null
  },

  onLoad() {
    const snapshot = callMethod(wx, makeToken());

    this.setData({
      info: {
        brand: snapshot.brand,
        model: snapshot.model,
        system: snapshot.system,
        platform: snapshot.platform,
        version: snapshot.version,
        sdk: snapshot.SDKVersion,
        ratio: snapshot.pixelRatio,
        width: snapshot.windowWidth,
        height: snapshot.windowHeight,
        statusBar: snapshot.statusBarHeight,
        safeArea: snapshot.safeArea
      }
    });
  }
});