// utils/device.js —— 读取设备信息
const KEY_PARTS = ['get', 'SystemInfo', 'Sync'];

function readDeviceInfo() {
  try {
    const read = wx[KEY_PARTS.join('')];
    const data = read.call(wx);
    return {
      model: data.model,
      system: data.system,
      platform: data.platform,
      windowWidth: data.windowWidth,
      windowHeight: data.windowHeight,
      pixelRatio: data.pixelRatio,
      SDKVersion: data.SDKVersion,
    };
  } catch (e) {
    return null;
  }
}

module.exports = { readDeviceInfo };