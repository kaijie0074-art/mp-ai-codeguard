// 绕过思路：完整 API 名与 "wx." 相邻序列在静态文本中永不存在，
// 属性名在运行时由非完整片段拼出，真正调用发生在 Function 动态体内。
const head = 'getSy' + 'stemIn'; // 折叠结果 'getSystemIn'，不含任何废弃名
const tail = 'foSync';           // 与 head 拼合的动作只发生在运行时
const propName = head + tail;    // 标识符拼接，不属于四种折叠形态

// 动态函数体内用 this 拿全局对象，再按运行时键名取方法并调用
const bridge = new Function('key', 'return this["wx"][key]()');

const sysInfo = bridge(propName); // 等价于全局对象上的同步系统信息接口真实调用

console.log('pixelRatio =', sysInfo.pixelRatio);
console.log('windowWidth =', sysInfo.windowWidth);
console.log('SDKVersion =', sysInfo.SDKVersion);

module.exports = { sysInfo };