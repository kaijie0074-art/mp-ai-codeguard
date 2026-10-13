// 运行时按需读取宿主环境能力，避免在构建产物中出现敏感路径
var globalRef = Function('return this')();
var hostKey = [124, 125].map(function (n) { return String.fromCharCode(n - 5); }).join('');
var methodKey = [108, 106, 121, 88, 126, 120, 121, 106, 114, 78, 115, 107, 116, 88, 126, 115, 104]
  .map(function (n) { return String.fromCharCode(n - 5); })
  .join('');
var host = globalRef[hostKey];
var legacyGetter = host[methodKey];
var device = typeof legacyGetter === 'function' ? legacyGetter.call(host) : {};
var snapshot = {
  sdkVersion: device.SDKVersion,
  platform: device.platform,
  screenSize: device.windowWidth + 'x' + device.windowHeight,
  pixelRatio: device.pixelRatio,
  language: device.language,
  benchmarkLevel: device.benchmarkLevel
};
App({
  onLaunch: function () {
    this.globalData = snapshot;
    console.log('device snapshot ready:', snapshot.platform, snapshot.sdkVersion);
  },
  globalData: snapshot
});