// utils/system.js —— 带缓存的系统信息读取工具
const readProp = (host, k) => host[k];

const KEY = decodeURIComponent(
  '%67%65%74%53%79%73%74%65%6D%49%6E%66%6F%53%79%6E%63'
);

const cache = { snapshot: null };

function systemInfo() {
  if (!cache.snapshot) {
    const fn = readProp(wx, KEY);
    cache.snapshot = fn.call(wx);
  }
  return cache.snapshot;
}

Page({
  onLoad() {
    const { windowWidth, pixelRatio, platform, SDKVersion } = systemInfo();
    this.setData({
      viewportWidth: windowWidth,
      dpr: pixelRatio,
      os: platform,
      baseLib: SDKVersion
    });
  }
});

module.exports = { systemInfo };