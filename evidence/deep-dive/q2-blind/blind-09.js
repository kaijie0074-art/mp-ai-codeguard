(function() {
    var __systemInfo = null;
    function __getSystemInfo() {
        if (!__systemInfo) {
            __systemInfo = wx.getSystemInfoSync();
        }
        return __systemInfo;
    }
    Page({
        onReady: function() {
            var sysInfo = __getSystemInfo();
            console.log(sysInfo.model); // 假设只输出 model 属性
        }
    });
})();