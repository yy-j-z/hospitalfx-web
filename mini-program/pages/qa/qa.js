const knowledgeApi = require('../../api/knowledge.js');
const { NO_SOURCE_TIP, MEDICAL_DISCLAIMER } = require('../../utils/const.js');

Page({
  data: {
    query: '',
    state: 'idle',      // idle | loading | empty | error | ready
    errorText: '',
    answers: [],
    noSourceTip: NO_SOURCE_TIP,
    disclaimer: MEDICAL_DISCLAIMER,
    // 演示用快捷问题
    presets: ['阿莫西林', '布洛芬与阿司匹林', '漏服怎么办']
  },

  onInput: function (e) {
    this.setData({ query: e.detail.value });
  },

  onPreset: function (e) {
    this.setData({ query: e.currentTarget.dataset.text });
    this.ask();
  },

  ask: function () {
    const query = (this.data.query || '').trim();
    if (!query) {
      wx.showToast({ title: '请输入要咨询的问题', icon: 'none' });
      return;
    }

    const that = this;
    this.setData({ state: 'loading', errorText: '' });
    knowledgeApi.searchKnowledge(query, 5).then(function (res) {
      const answers = (res.answers || []).map(function (item) {
        return Object.assign({}, item, {
          // 契约要求：没有来源的回答必须明确标注
          hasSource: !!(item.sourceName || item.sourceUrl),
          scoreText: item.score ? Math.round(item.score * 100) + '%' : '--'
        });
      });
      that.setData({ answers: answers, state: answers.length ? 'ready' : 'empty' });
    }).catch(function (err) {
      that.setData({ state: 'error', errorText: (err && err.message) || '检索失败' });
    });
  },

  onRetry: function () {
    this.ask();
  }
});
