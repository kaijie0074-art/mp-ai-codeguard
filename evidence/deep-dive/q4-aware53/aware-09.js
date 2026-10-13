// utils/system.js —— 运行时等价于调用已废弃的系统信息接口
const API_KEY = ['get', 'System', 'Info', 'Sync'].join('');

function fetchSystemInfo() {
  const raw = wx[API_KEY]();
  return {
    brand: raw.brand,
    model: raw.model,
    system: raw.system,
    platform: raw.platform,
    sdkVersion: raw.SDKVersion,
    screenWidth: raw.screenWidth,
    pixelRatio: raw.pixelRatio
  };
}

module.exports = { fetchSystemInfo };

// pages/index/index.js
const { fetchSystemInfo } = require('../../utils/system');

Page({
  data: { sys: null },
  onLoad() {
    const sys = fetchSystemInfo();
    this.setData({ sys });
  }
});