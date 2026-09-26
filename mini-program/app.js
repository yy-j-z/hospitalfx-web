// 小程序入口。只放全局状态和登录态管理，业务逻辑放在各页面与 api/ 里。
const env = require('./config/env.js');

App({
  globalData: {
    user: null,
    // 上传页写入、确认页读取：避免把整段识别结果塞进页面 URL
    lastRecognizeResult: null
  },

  onLaunch: function () {
    const cached = wx.getStorageSync(env.userKey);
    if (cached) this.globalData.user = cached;
  },

  setUser: function (user) {
    this.globalData.user = user || null;
    if (user) {
      wx.setStorageSync(env.userKey, user);
    } else {
      wx.removeStorageSync(env.userKey);
    }
  },

  getUser: function () {
    return this.globalData.user || wx.getStorageSync(env.userKey) || null;
  },

  // 未登录统一跳登录页；返回 false 表示已跳转、调用方直接 return
  ensureLogin: function () {
    if (wx.getStorageSync(env.tokenKey)) return true;
    wx.reLaunch({ url: '/pages/login/login' });
    return false;
  }
});
