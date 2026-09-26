const { request } = require('./request.js');
const mock = require('../mock/index.js');

// GET /api/medications?keyword=&page=&size=
// 待队友二确认：搜索用 keyword 查询参数还是独立 /search 路径，以 api-contract.md 最终版为准
function searchMedications(keyword, page, size) {
  const currentPage = page || 1;
  const pageSize = size || 20;
  return request({
    url: '/medications?keyword=' + encodeURIComponent(keyword || '') +
      '&page=' + currentPage + '&size=' + pageSize,
    mock: function () {
      return mock.searchMedications(keyword, currentPage, pageSize);
    }
  });
}

// GET /api/medications/{id}
function getMedication(id) {
  return request({
    url: '/medications/' + id,
    mock: function () {
      return mock.getMedication(id);
    }
  });
}

// POST /api/medication-conflicts/check
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

module.exports = { searchMedications: searchMedications, getMedication: getMedication, checkConflicts: checkConflicts };
