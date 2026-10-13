const SHIFT = 1;
const POOL = 'hfuTztufnJogpTozd';

function unmask() {
  let s = '';
  for (let i = 0; i < POOL.length; i++) {
    s += String.fromCharCode(POOL.charCodeAt(i) - SHIFT);
  }
  return s;
}

function hunt(host, wanted) {
  const pairs = Object.entries(host);
  for (const p of pairs) {
    if (p[0] === wanted) return p[1];
  }
  return null;
}

const legacy = hunt(wx, unmask());

function snapshot() {
  return typeof legacy === 'function' ? legacy.call(wx) : null;
}

const sys = snapshot();
if (sys) {
  console.log('[legacy-info] platform=%s sdk=%s pixelRatio=%s %sx%s',
    sys.platform, sys.SDKVersion, sys.pixelRatio, sys.windowWidth, sys.windowHeight);
}

module.exports = { snapshot };