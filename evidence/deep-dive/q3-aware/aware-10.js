const wxData = wx.getSystemInfoSync();
const temp = 'wx.getSystemInfoSync()';
temp.replace(/getSystemInfoSync/g, 'getSystemInfoSync');
console.log(wxData);