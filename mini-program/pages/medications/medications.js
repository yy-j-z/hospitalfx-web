const medicationApi = require('../../api/medication.js');

Page({
  data: {
    keyword: '',
    state: 'loading',
    errorText: '',
    items: [],
    total: 0,
    page: 1,
    size: 20,
    loadingMore: false
  },

  onLoad: function () {
    this.search(true);
  },

  onInput: function (e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch: function () {
    this.search(true);
  },

  onClear: function () {
    this.setData({ keyword: '' });
    this.search(true);
  },

  search: function (reset) {
    const that = this;
    const page = reset ? 1 : this.data.page + 1;
    if (reset) this.setData({ state: 'loading', errorText: '' });
    else this.setData({ loadingMore: true });

    return medicationApi.searchMedications(this.data.keyword, page, this.data.size).then(function (res) {
      const items = res.items || [];
      that.setData({
        items: reset ? items : that.data.items.concat(items),
        total: res.total || 0,
        page: res.page || page,
        state: (reset ? items.length : that.data.items.length + items.length) ? 'ready' : 'empty'
      });
    }).catch(function (err) {
      that.setData({ state: 'error', errorText: (err && err.message) || '加载失败' });
    }).then(function () {
      that.setData({ loadingMore: false });
    });
  },

  // 触底加载下一页；没有更多时不再请求
  onReachBottom: function () {
    if (this.data.items.length >= this.data.total) return;
    this.search(false);
  },

  goDetail: function (e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  onRetry: function () {
    this.search(true);
  }
});
