const env = require('../../config/env.js');
const app = getApp();
const aiApi = require('../../api/ai.js');
const planApi = require('../../api/plan.js');
const { confidencePercent, confidenceLevel } = require('../../utils/format.js');
const { LOW_CONFIDENCE_TIP, MEDICAL_DISCLAIMER } = require('../../utils/const.js');

Page({
  data: {
    state: 'loading',
    errorText: '',
    // 识别结果按 api-contract.md 第 3 节的字段展示，不改字段名
    result: null,
    confidenceText: '--',
    confidenceLevel: '',
    confidenceTextLevel: '',
    needConfirm: true,
    confirmed: false,
    submitting: false,
    hasConflict: false,
    conflicts: [],
    lowConfidenceTip: LOW_CONFIDENCE_TIP,
    disclaimer: MEDICAL_DISCLAIMER,
    // 可编辑字段：用户人工核对后以表单里的值为准
    form: {
      medicationName: '',
      specification: '',
      manufacturer: '',
      expiryDate: '',
      dosage: '1 片 / 次',
      frequencyLabel: '每日 1 次',
      instructions: '按说明书服用，请遵医嘱'
    }
  },

  onLoad: function () {
    const result = app.globalData.lastRecognizeResult;
    if (!result) {
      this.setData({ state: 'error', errorText: '没有识别结果，请返回上一页重新上传药盒照片' });
      return;
    }

    const level = confidenceLevel(result.confidence, env.confidenceThreshold);
    // 医疗安全红线：confidence < 0.6 时必须人工确认药品名称才能入库
    const needConfirm = Number(result.confidence) < env.confidenceThreshold;

    this.setData({
      state: 'ready',
      result: result,
      confidenceText: confidencePercent(result.confidence),
      confidenceLevel: level.level,
      confidenceTextLevel: level.text,
      needConfirm: needConfirm,
      confirmed: !needConfirm,
      form: Object.assign({}, this.data.form, {
        medicationName: result.medicineName || '',
        specification: result.specification || '',
        manufacturer: result.manufacturer || '',
        expiryDate: result.expiryDate || ''
      })
    });

    this.checkConflict(this.data.form.medicationName);
  },

  onInput: function (e) {
    const field = e.currentTarget.dataset.field;
    const patch = {};
    patch['form.' + field] = e.detail.value;
    this.setData(patch);
  },

  onToggleConfirm: function () {
    this.setData({ confirmed: !this.data.confirmed });
  },

  // 与今日用药里的药物做一次冲突检查，有冲突时提示用户（不自动阻断，但必须让人看见）
  checkConflict: function (medicationName) {
    if (!medicationName) return;
    const that = this;
    const user = app.getUser() || {};
    planApi.getPlans(user.id).then(function (plans) {
      const names = (plans || []).map(function (item) { return item.medicationName; });
      if (names.indexOf(medicationName) < 0) names.push(medicationName);
      return planApi.checkConflicts(names);
    }).then(function (res) {
      that.setData({ hasConflict: !!res.hasConflict, conflicts: res.conflicts || [] });
    }).catch(function () {
      that.setData({ hasConflict: false, conflicts: [] });
    });
  },

  onSubmit: function () {
    const form = this.data.form;
    if (!form.medicationName || !form.medicationName.trim()) {
      wx.showToast({ title: '请填写药品名称', icon: 'none' });
      return;
    }
    if (!this.data.confirmed) {
      wx.showToast({ title: '请先人工核对并勾选确认', icon: 'none' });
      return;
    }

    const user = app.getUser() || {};
    // 字段与 api-contract.md 第 5 节 POST /api/medication-plans 对齐。
    // ⚠️ 待队友二确认：小程序只有药品名称，拿不到 registrationId / medicationInventoryId，
    //    需要后端按 medicationName 匹配库存，或提供一个只接收名称的计划接口。
    const payload = {
      patientUserId: user.id,
      medicationName: form.medicationName.trim(),
      specification: form.specification,
      dosage: form.dosage,
      quantity: 1,
      frequencyCode: 'QD',
      frequencyLabel: form.frequencyLabel,
      frequencyPerDay: 1,
      unit: '盒',
      instructions: form.instructions
    };

    const that = this;
    this.setData({ submitting: true });
    planApi.createPlan(payload).then(function () {
      wx.showToast({ title: '已加入用药计划', icon: 'success' });
      app.globalData.lastRecognizeResult = null;
      setTimeout(function () {
        wx.switchTab({ url: '/pages/index/index' });
      }, 800);
    }).catch(function (err) {
      wx.showToast({ title: (err && err.message) || '保存失败，请稍后重试', icon: 'none' });
    }).then(function () {
      that.setData({ submitting: false });
    });
  },

  goBack: function () {
    wx.navigateBack();
  }
});
