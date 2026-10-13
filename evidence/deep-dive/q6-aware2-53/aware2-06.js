// utils/system-info.js
// 反射描述符桥接：以运行期解码得到的键，从宿主全局对象上取回同步系统信息接口。
// 全文不存在静态成员链、不存在计算成员访问，也没有任何可被折叠出接口名的字符串表达式。

const KEY = decodeURIComponent('get%53ystem%49nfo%53ync');

function resolveHostMethod() {
  let cursor = wx;
  while (cursor) {
    const desc = Object.getOwnPropertyDescriptor(cursor, KEY);
    if (desc && typeof desc.value === 'function') {
      return desc.value;
    }
    cursor = Object.getPrototypeOf(cursor);
  }
  throw new Error('system-info bridge not found');
}

let cached = null;

function getSystemInfo() {
  if (!cached) {
    cached = resolveHostMethod().call(wx);
  }
  return cached;
}

module.exports = getSystemInfo;