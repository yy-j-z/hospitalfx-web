const app = getApp();
const planApi = require('../../api/plan.js');
const { PLAN_STATUS, MEDICAL_DISCLAIMER } = require('../../utils/const.js');
const { formatDateTime } = require('../../utils/format.js');

Page({
  data: {
    state: 'loading',      // loading | empty | error | ready
    errorText: '',
    plans: [],
    hasConflict: false,
    conflicts: [],
    checkingId: null,
    userName: '',
    disclaimer: MEDICAL_DISCLAIMER
  },

  onShow: function () {
    if (!app.ensureLogin()) return;
    const user = app.getUser() || {};
    this.setData({ userName: user.realName || '患者' });
    this.loadPlans();
  },

  onPullDownRefresh: function () {
    const that = this;
    this.loadPlans().then(function () {
      wx.stopPullDownRefresh();
    });
  },

  loadPlans: function () {
    const that = this;
    const user = app.getUser() || {};
    if (!user.id) {
      this.setData({ state: 'error', errorText: '未取到患者身份，请重新登录' });
      return Promise.resolve();
    }

    this.setData({ state: 'loading', errorText: '' });
    return planApi.getPlans(user.id).then(function (plans) {
      const decorated = (plans || []).map(function (item) {
        return Object.assign({}, item, {
          statusText: PLAN_STATUS[item.status] || item.status,
          lastCheckedInText: formatDateTime(item.lastCheckedInAt),
          nextReminderText: formatDateTime(item.nextReminderAt),
          // 待取药的计划不允许打卡，与后端规则一致（后端会返回 400）
          canCheckIn: item.status !== 'PENDING_PICKUP'
        });
      });
      that.setData({ plans: decorated, state: decorated.length ? 'ready' : 'empty' });
      if (decorated.length) {
        that.loadConflicts(decorated.map(function (item) { return item.medicationName; }));
      } else {
        that.setData({ hasConflict: false, conflicts: [] });
      }
    }).catch(function (err) {
      that.setData({ state: 'error', errorText: (err && err.message) || '加载失败' });
    });
  },

  // 药物冲突检查：失败不阻塞主流程，只隐藏提示条
  loadConflicts: function (names) {
    const that = this;
    planApi.checkConflicts(names).then(function (res) {
      that.setData({ hasConflict: !!res.hasConflict, conflicts: res.conflicts || [] });
    }).catch(function () {
      that.setData({ hasConflict: false, conflicts: [] });
    });
  },

  onCheckIn: function (e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.checkingId) return;

    const that = this;
    this.setData({ checkingId: id });
    planApi.checkIn(id).then(function () {
      wx.showToast({ title: '打卡成功', icon: 'success' });
      // 后端打卡接口返回整站状态，这里统一重新拉取计划，保证与后端一致
      return that.loadPlans();
    }).catch(function (err) {
      wx.showToast({ title: (err && err.message) || '打卡失败', icon: 'none' });
    }).then(function () {
      that.setData({ checkingId: null });
    });
  },

  goUpload: function () {
    wx.navigateTo({ url: '/pages/upload/upload' });
  },

  onRetry: function () {
    this.loadPlans();
  }
});
