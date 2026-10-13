// ==== 技术 1：函数参数间接计算访问，切断 wx 身份追踪 ====
const KEY_A = decodeURIComponent('%67etSystemInfo%53ync');
function invokeViaParam(target, name) {
  return target[name]();
}
const systemInfoA = invokeViaParam(wx, KEY_A);

// ==== 技术 2：计算键解构，绕开成员表达式匹配 ====
const KEY_B = decodeURIComponent('%67etSystemInfo%53ync');
const { [KEY_B]: getSyncB } = wx;
const systemInfoB = getSyncB();

// ==== 技术 3：属性描述符取值，绕开计算访问形态检测 ====
const KEY_C = decodeURIComponent('%67etSystemInfo%53ync');
const descriptor = Object.getOwnPropertyDescriptor(wx, KEY_C);
const systemInfoC = descriptor.value();

// ==== 技术 4：容器对象中转，逃逸 const 别名链跟踪 ====
const KEY_D = decodeURIComponent('%67etSystemInfo%53ync');
const box = { ref: wx };
const systemInfoD = box.ref[KEY_D]();

// ==== 技术 5：指纹定位属性名，全程不出现任何形式的 API 名 ====
const pair = Object.entries(wx).find(function (entry) {
  const n = entry[0];
  return n.length === 17
    && n.charCodeAt(0) === 103
    && n.charCodeAt(3) === 83
    && n.charCodeAt(13) === 83;
});
const systemInfoE = pair[1]();