const env = require('../../config/env.js');
const aiApi = require('../../api/ai.js');
const app = getApp();

Page({
  data: {
    filePath: '',
    fileSizeText: '',
    uploading: false,
    tip: '',
    useMock: env.useMock
  },

  onChooseImage: function () {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      sizeType: ['compressed'],
      success: function (res) {
        const file = (res.tempFiles || [])[0];
        if (!file) return;

        if (file.size > env.maxImageSize) {
          that.setData({ tip: '图片超过 5 MB，请压缩后重试', filePath: '' });
          return;
        }
        const ext = (file.tempFilePath.split('.').pop() || '').toLowerCase();
        if (env.allowImageExt.indexOf(ext) < 0) {
          that.setData({ tip: '只支持 jpg / jpeg / png / webp 格式', filePath: '' });
          return;
        }

        that.setData({
          filePath: file.tempFilePath,
          fileSizeText: (file.size / 1024).toFixed(0) + ' KB',
          tip: ''
        });
      },
      fail: function () {
        // 用户取消选择，不提示
      }
    });
  },

  onUpload: function () {
    if (!this.data.filePath) {
      this.setData({ tip: '请先拍照或从相册选择药盒照片' });
      return;
    }

    const that = this;
    this.setData({ uploading: true, tip: '' });
    aiApi.recognizeMedicineImage(this.data.filePath).then(function (result) {
      // 识别结果按契约字段返回，交给确认页做人工核对
      app.globalData.lastRecognizeResult = result;
      wx.navigateTo({ url: '/pages/confirm/confirm' });
    }).catch(function (err) {
      that.setData({ tip: (err && err.message) || '识别失败，请稍后重试' });
    }).then(function () {
      that.setData({ uploading: false });
    });
  }
});
