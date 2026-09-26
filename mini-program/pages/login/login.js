const env = require('../../config/env.js');
const auth = require('../../api/auth.js');
const app = getApp();

Page({
  data: {
    phone: '',
    password: '',
    loading: false,
    tip: '',
    useMock: env.useMock,
    demoPhone: '13800000012'
  },

  onLoad: function () {
    // 已登录直接进首页
    if (wx.getStorageSync(env.tokenKey)) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  onInput: function (e) {
    const field = e.currentTarget.dataset.field;
    const patch = {};
    patch[field] = e.detail.value;
    this.setData(patch);
  },

  onFillDemo: function () {
    this.setData({ phone: this.data.demoPhone, password: '123456' });
  },

  onSubmit: function () {
    const phone = (this.data.phone || '').trim();
    const password = this.data.password || '';

    if (!/^\d{11}$/.test(phone)) {
      this.setData({ tip: '请输入 11 位患者手机号，例如 13800000012' });
      return;
    }
    if (!password) {
      this.setData({ tip: '请输入密码' });
      return;
    }

    const that = this;
    this.setData({ loading: true, tip: '' });
    auth.login(phone, password).then(function (res) {
      const user = res.user || {};
      // 后端登录接口对医护账号同样有效，所以这里必须自己把角色卡住，
      // 否则医生/药师账号会被放进患者端，看到的是患者视角的数据。
      if (user.roleCode && user.roleCode !== 'PATIENT') {
        that.setData({ tip: '当前小程序只服务患者账号，医护账号请在 Web 工作台登录' });
        return;
      }
      wx.setStorageSync(env.tokenKey, res.token);
      app.setUser(user);
      wx.switchTab({ url: '/pages/index/index' });
    }).catch(function (err) {
      that.setData({ tip: (err && err.message) || '登录失败，请稍后重试' });
    }).then(function () {
      that.setData({ loading: false });
    });
  }
});
