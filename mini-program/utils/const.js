// 全局常量与固定文案。状态映射必须与后端 status 字段保持一致。
const PLAN_STATUS = {
  ACTIVE: '用药中',
  PENDING_PICKUP: '待取药',
  COMPLETED: '已完成',
  STOPPED: '已停药'
};

// 医疗安全：涉及用药的页面都要显示
const MEDICAL_DISCLAIMER = '本结果仅作用药参考，不构成诊断或处方，具体请咨询医生 / 药师。';

// 知识库回答没有来源时的标注（api-contract.md 第 4 节要求）
const NO_SOURCE_TIP = '该条内容未提供来源，仅供参考，请咨询医生 / 药师。';

// 低置信度提示
const LOW_CONFIDENCE_TIP = '识别置信度偏低，必须人工核对药品名称后才能加入用药计划。';

module.exports = { PLAN_STATUS: PLAN_STATUS, MEDICAL_DISCLAIMER: MEDICAL_DISCLAIMER, NO_SOURCE_TIP: NO_SOURCE_TIP, LOW_CONFIDENCE_TIP: LOW_CONFIDENCE_TIP };
