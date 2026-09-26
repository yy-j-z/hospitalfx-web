// mock 实现：只在 config/env.js 的 useMock = true 时生效。
// 所有字段与 api-contract.md 完全一致，接真接口时页面代码不用改。
// 失败场景通过 throw { status, message } 抛出，由 api/request.js 统一转成 reject。
const medications = require('./medications.json');
const detailMap = require('./medication-detail.json');
const plans = require('./plans.json');
const conflictRules = require('./conflicts.json');
const medicineImage = require('./medicine-image.json');
const knowledgeSeed = require('./knowledge-search.json');
const patients = require('./users.json');

// 打卡状态存在本地存储，保证 mock 模式下切页面回来仍能看到「已打卡」
const CHECKIN_KEY = 'rc_mock_checkins';

function readCheckIns() {
  return wx.getStorageSync(CHECKIN_KEY) || {};
}

function pad(value) {
  return value < 10 ? '0' + value : '' + value;
}

function nowText() {
  const now = new Date();
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
    'T' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
}

function nextReminderText(frequencyCode) {
  const hours = frequencyCode === 'TID' ? 8 : (frequencyCode === 'BID' ? 12 : 24);
  const next = new Date(Date.now() + hours * 3600 * 1000);
  return next.getFullYear() + '-' + pad(next.getMonth() + 1) + '-' + pad(next.getDate()) +
    'T' + pad(next.getHours()) + ':' + pad(next.getMinutes()) + ':00';
}

// POST /api/auth/login —— 字段与后端 LoginRequest 一致：loginId + password
function login(loginId, password) {
  const user = patients.filter(function (item) {
    return item.phoneNumber === loginId || item.loginCode === loginId;
  })[0];
  if (!user) throw { status: 401, message: '账号或密码错误' };
  if (password !== '123456') throw { status: 401, message: '账号或密码错误' };
  if (user.roleCode !== 'PATIENT') {
    throw { status: 403, message: '当前小程序只服务患者账号，医护账号请在 Web 工作台登录' };
  }
  return { token: 'mock-token-' + user.id, user: user };
}

// GET /api/medications?keyword=&page=&size=
function searchMedications(keyword, page, size) {
  const currentPage = Number(page) || 1;
  const pageSize = Number(size) || 20;
  const kw = (keyword || '').trim();
  const list = medications.filter(function (item) {
    if (!kw) return true;
    return item.medicationName.indexOf(kw) >= 0 || item.medicationCode.indexOf(kw) >= 0;
  });
  const start = (currentPage - 1) * pageSize;
  return {
    total: list.length,
    page: currentPage,
    size: pageSize,
    items: list.slice(start, start + pageSize)
  };
}

// GET /api/medications/{id}
function getMedication(id) {
  const detail = detailMap[String(id)];
  if (detail) return detail;
  const base = medications.filter(function (item) {
    return String(item.id) === String(id);
  })[0];
  if (!base) throw { status: 404, message: '未找到该药品' };
  // 知识表建好前，这 5 个字段按契约先返回 null，前端按空值处理
  return Object.assign({}, base, {
    indications: null, contraindications: null,
    sourceName: null, sourceUrl: null, versionLabel: null, updatedAt: null
  });
}

// POST /api/medication-conflicts/check
function checkConflicts(medicationNames) {
  const names = medicationNames || [];
  const conflicts = conflictRules.filter(function (rule) {
    return names.indexOf(rule.leftMedicationName) >= 0 && names.indexOf(rule.rightMedicationName) >= 0;
  }).map(function (rule) {
    return {
      leftMedicationName: rule.leftMedicationName,
      rightMedicationName: rule.rightMedicationName,
      severity: rule.severity,
      guidance: rule.guidance
    };
  });
  return { hasConflict: conflicts.length > 0, conflicts: conflicts, modelVersion: 'rule-baseline-0.1' };
}

// GET /api/medication-plans?patientUserId=
function getPlans(patientUserId) {
  const checkIns = readCheckIns();
  return plans.filter(function (item) {
    return String(item.patientUserId) === String(patientUserId);
  }).map(function (item) {
    const local = checkIns[item.id];
    return local ? Object.assign({}, item, local) : item;
  });
}

// PUT /api/medication-plans/{id}/check-in
// 注意：真实接口返回的是整站状态（AppStateResponse），不是单个计划。
// 这里沿用「打卡成功后重新拉一次计划」的写法，所以两种模式下页面代码一致。
function checkIn(planId) {
  const plan = plans.filter(function (item) {
    return String(item.id) === String(planId);
  })[0];
  if (!plan) throw { status: 404, message: '服药计划不存在' };
  if (plan.status === 'PENDING_PICKUP') throw { status: 400, message: '请先完成取药，再进行服药打卡' };
  const checkedInAt = nowText();
  const checkIns = readCheckIns();
  checkIns[planId] = { lastCheckedInAt: checkedInAt, nextReminderAt: nextReminderText(plan.frequencyCode) };
  wx.setStorageSync(CHECKIN_KEY, checkIns);
  return { ok: true, planId: Number(planId), lastCheckedInAt: checkedInAt };
}

// POST /api/medication-plans（识别结果人工确认后调用）
function createPlan(payload) {
  if (!payload || !payload.medicationName) throw { status: 400, message: '缺少药品名称，请先人工确认' };
  return { ok: true, id: Date.now(), payload: payload };
}

// POST /api/ai/medicine-image（multipart/form-data，字段名 image）
// mock 默认返回低置信度结果，用来验证「必须人工确认」这条医疗安全红线
function recognizeMedicineImage() {
  return medicineImage;
}

// POST /api/knowledge/search
function searchKnowledge(query) {
  const kw = (query || '').trim();
  const answers = kw ? knowledgeSeed.answers.filter(function (item) {
    return item.title.indexOf(kw) >= 0 || item.content.indexOf(kw) >= 0;
  }) : knowledgeSeed.answers;
  if (!answers.length) throw { status: 404, message: '知识库中暂未检索到相关内容，请咨询医生 / 药师' };
  return { answers: answers };
}

module.exports = {
  login: login,
  searchMedications: searchMedications,
  getMedication: getMedication,
  checkConflicts: checkConflicts,
  getPlans: getPlans,
  checkIn: checkIn,
  createPlan: createPlan,
  recognizeMedicineImage: recognizeMedicineImage,
  searchKnowledge: searchKnowledge
};
