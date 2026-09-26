const medicationApi = require('../../api/medication.js');
const { MEDICAL_DISCLAIMER } = require('../../utils/const.js');
const { emptyText } = require('../../utils/format.js');

Page({
  data: {
    state: 'loading',
    errorText: '',
    detail: null,
    hasSource: false,
    disclaimer: MEDICAL_DISCLAIMER
  },

  onLoad: function (options) {
    const id = options.id;
    const that = this;
    if (!id) {
      this.setData({ state: 'error', errorText: '缺少药品 id' });
      return;
    }

    medicationApi.getMedication(id).then(function (res) {
      that.setData({
        detail: res,
        // 知识表建好前 indications / sourceName 等字段为 null，页面要按空值处理
        hasSource: !!(res.sourceName || res.sourceUrl),
        state: 'ready'
      });
      wx.setNavigationBarTitle({ title: res.medicationName || '药品详情' });
    }).catch(function (err) {
      that.setData({ state: 'error', errorText: (err && err.message) || '加载失败' });
    });
  },

  onRetry: function () {
    this.onLoad({ id: this.data.detail && this.data.detail.id });
  }
});
