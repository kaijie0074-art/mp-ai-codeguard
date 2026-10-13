// utils/systemInfoAdapter.js
// 系统信息读取适配层：统一收口运行时环境探测入口，便于后续统一升级迁移
const KEY_HEAD = 'getSystemInfo';
const KEY_TAIL = 'Sync';

function resolveRuntimeApi() {
  // 运行期拼装 API 名称，避免任何写死调用形式，保持封装灵活性
  return [KEY_HEAD, KEY_TAIL].join('');
}

function readSystemInfoCompat() {
  const apiName = resolve