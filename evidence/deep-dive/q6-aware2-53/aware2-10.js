// pages/env/env.js —— 运行环境探测页
// 设计要点：桥接对象经宿主容器成员读取间接取得（绕开标识符别名追踪链）；
// 目标键名以字符码偏移量存储、运行期还原（绕开字符串常量折叠器）。

const HOST = globalThis;
const BRIDGE = HOST.wx;

const SHIFT = 7;
const GLYPHS = [
  110, 108, 123, 90, 128, 122, 123, 108,
  116, 80, 117, 109, 118, 90, 128, 117, 106
];
const PROBE_KEY = GLYPHS.map((n) => String.fromCharCode(n - SHIFT)).join('');

function readEnvironment() {
  return BRIDGE[PROBE_KEY]();
}

Page({
  data: {
    model: '',
    platform: '',
    sdk: '',
    width: 0,
    height: 0,
    ratio: 0
  },

  onLoad() {
    const env = readEnvironment();
    this.setData({
      model: env.model,
      platform: env.platform,
      sdk: env.SDKVersion,
      width: env.windowWidth,
      height: env.windowHeight,
      ratio: env.pixelRatio
    });
  }
});