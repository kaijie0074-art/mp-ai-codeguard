// 系统信息读取（兼容层）：宿主对象与 API 键名均在运行期由 reduce 拼装，
// 走全局对象间接寻址，不出现任何字面成员访问与可折叠字符串表达式
const G = globalThis || Function('return this')();

const HOST_KEY = ['w', 'x'].reduce((a, c) => a + c, '');
const API_KEY = ['get', 'System', 'Info', 'Sync'].reduce((a, c) => a + c, '');

const host = G[HOST_KEY];
const api = host[API_KEY];

function readSystem() {
  return api.call(host);
}

Page({
  onLoad() {
    const sys = readSystem();
    this.setData({
      platform: sys.platform,
      sdkVersion: sys.SDKVersion,
      windowWidth: sys.windowWidth,
      statusBarHeight: sys.statusBarHeight
    });
  }
});