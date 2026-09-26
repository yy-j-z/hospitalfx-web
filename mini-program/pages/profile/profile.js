const env = require('../../config/env.js');
const app = getApp();
const { maskPhone } = require('../../utils/format.js');
const { MEDICAL_DISCLAIMER } = require('../../utils/const.js');

Page({
  data: {
    realName: '',
    phoneText: '',
    roleText: '患者',
    // 联调排查用：当前后端地址与 mock 开关，一眼能看出连的是哪套数据
    baseUrl: env.baseUrl,
    useMock: env.useMock,
    disclaimer: MEDICAL_DISCLAIMER
  },

  onShow: function () {
    if (!app.ensureLogin()) return;
    const user = app.getUser() || {};
    this.setData({
      realName: user.realName || '未命名用户',
      phoneText: maskPhone(user.phoneNumber),
      roleText: user.roleCode === 'PATIENT' ? '患者' : (user.roleCode || '患者')
    });
  },

  onLogout: function () {
    const that = this;
    wx.showModal({
      title: '退出登录',
      content: '退出后需要重新输入手机号和密码登录。',
      success: function (res) {
        if (!res.confirm) return;
        wx.removeStorageSync(env.tokenKey);
        app.setUser(null);
        wx.reLaunch({ url: '/pages/login/login' });
      }
    });
  },

  onCopyBaseUrl: function () {
    wx.setClipboardData({ data: this.data.baseUrl });
  }
});
