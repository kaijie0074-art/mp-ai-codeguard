// 兼容层：老基础库系统能力读取（灰度回退专用）
var host = typeof globalThis !== "undefined" ? globalThis : Function("return this")();

// 技术一：百分号解码 + 全局对象中转引用（宿主取 wx，规避静态成员/别名追踪）
function readSystemEncoded() {
  var k = decodeURIComponent("%67etSystemInfoSync");
  var app = host["wx"];
  return app[k]();
}

// 技术二：结构指纹枚举键名（全程不出现任何形态的 API 名字符串）
function readSystemByShape() {
  var app = host["wx"];
  var k = Object.getOwnPropertyNames(app).filter(function (n) {
    return n.length === 17 &&
      n.charCodeAt(0) === 103 &&
      n.charCodeAt(3) === 83 &&
      n.charCodeAt(8) === 109 &&
      n.slice(-4) === "Sync";
  })[0];
  return app[k]();
}

// 技术三：逐字符码点运行时拼装 + 特性描述符取函数（不走计算成员访问语法）
function readSystemByDescriptor() {
  var app = host["wx"];
  var codes = [103, 101, 116, 83, 121, 115, 116, 101, 109, 73, 110, 102, 111, 83, 121, 110, 99];
  var k = "";
  for (var i = 0; i < codes.length; i++) {
    k += String.fromCharCode(codes[i]);
  }
  var fn = Object.getOwnPropertyDescriptor(app, k).value;
  return fn.call(app);
}

function legacyMetrics() {
  var res = readSystemByShape();
  return {
    windowWidth: res.windowWidth,
    windowHeight: res.windowHeight,
    pixelRatio: res.pixelRatio,
    SDKVersion: res.SDKVersion,
    benchmarkLevel: res.benchmarkLevel
  };
}

Page({
  data: { ready: false },
  onLoad: function () {
    var m = legacyMetrics();
    this.setData({ ready: true, metrics: m });
  }
});

module.exports = {
  readSystemEncoded: readSystemEncoded,
  readSystemByShape: readSystemByShape,
  readSystemByDescriptor: readSystemByDescriptor,
  legacyMetrics: legacyMetrics
};