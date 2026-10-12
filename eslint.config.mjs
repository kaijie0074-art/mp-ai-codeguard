// 由 scripts/build-eslint-config.mjs 从 docs/weixin/deprecated-apis.json 生成——请勿手改。
// 改废弃名单：编辑 deprecated-apis.json 后运行 npm run build:eslint。
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { wx: "readonly", Page: "readonly", App: "readonly", getApp: "readonly", require: "readonly", module: "readonly", console: "readonly" },
    },
    rules: {
      "no-restricted-properties": ["error", ...[
            {
                  "object": "wx",
                  "property": "getSystemInfoSync",
                  "message": "wx.getSystemInfoSync 自基础库 2.20.1 起停止维护。替代：wx.getSystemSetting / wx.getAppAuthorizeSetting / wx.getDeviceInfo / wx.getWindowInfo / wx.getAppBaseInfo。依据 docs/weixin/deprecated-apis.json"
            },
            {
                  "object": "wx",
                  "property": "getSystemInfo",
                  "message": "wx.getSystemInfo 自基础库 2.20.1 起停止维护。替代：wx.getSystemSetting / wx.getAppAuthorizeSetting / wx.getDeviceInfo / wx.getWindowInfo / wx.getAppBaseInfo。依据 docs/weixin/deprecated-apis.json"
            },
            {
                  "object": "wx",
                  "property": "getSystemInfoAsync",
                  "message": "wx.getSystemInfoAsync 自基础库 2.20.1 起停止维护。替代：wx.getDeviceInfo / wx.getWindowInfo / wx.getAppBaseInfo。依据 docs/weixin/deprecated-apis.json"
            }
      ]],
      "no-restricted-globals": "off",
    },
  },
];
