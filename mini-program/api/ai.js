const { request, upload } = require('./request.js');
const mock = require('../mock/index.js');

// POST /api/ai/medicine-image —— 药盒图片识别
// 返回字段必须与 ai-service 一致，不要改名（api-contract.md 第 3 节）
function recognizeMedicineImage(filePath) {
  return upload({
    url: '/ai/medicine-image',
    filePath: filePath,
    mock: function () {
      return mock.recognizeMedicineImage(filePath);
    }
  });
}

// 药物冲突检查
function checkConflicts(medicationNames) {
  return request({
    url: '/medication-conflicts/check',
    method: 'POST',
    data: { medicationNames: medicationNames || [] },
    mock: function () {
      return mock.checkConflicts(medicationNames);
    }
  });
}

module.exports = { recognizeMedicineImage: recognizeMedicineImage, checkConflicts: checkConflicts };
