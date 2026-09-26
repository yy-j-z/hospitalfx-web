// 统一状态视图：加载中 / 空数据 / 失败重试，每个页面写法一致
Component({
  properties: {
    state: { type: String, value: 'loading' },
    loadingText: { type: String, value: '加载中…' },
    emptyText: { type: String, value: '暂无数据' },
    errorText: { type: String, value: '加载失败' }
  },
  methods: {
    onRetry: function () {
      this.triggerEvent('retry');
    }
  }
});
