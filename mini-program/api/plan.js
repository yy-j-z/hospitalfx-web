const { request } = require('./request.js');
const medicationApi = require('./medication.js');
const mock = require('../mock/index.js');

// GET /api/medication-plans?patientUserId=
function getPlans(patientUserId) {
  return request({
    url: '/medication-plans?patientUserId=' + patientUserId,
    mock: function () {
      return mock.getPlans(patientUserId);
    }
  });
}

// POST /api/medication-plans —— 识别结果人工确认后新建用药计划
function createPlan(payload) {
  return request({
    url: '/medication-plans',
    method: 'POST',
    data: payload,
    mock: function () {
      return mock.createPlan(payload);
    }
  });
}

// PUT /api/medication-plans/{id}/check-in
// 后端返回整站状态，所以调用方在成功后重新拉一次计划（见 pages/index）
function checkIn(planId) {
  return request({
    url: '/medication-plans/' + planId + '/check-in',
    method: 'PUT',
    mock: function () {
      return mock.checkIn(planId);
    }
  });
}

// 药物冲突检查（复用 medication 模块，页面只依赖 plan 模块读今日用药相关数据）
function checkConflicts(medicationNames) {
  return medicationApi.checkConflicts(medicationNames);
}

module.exports = { getPlans: getPlans, createPlan: createPlan, checkIn: checkIn, checkConflicts: checkConflicts };
