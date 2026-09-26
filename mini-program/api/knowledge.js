const { request } = require('./request.js');
const mock = require('../mock/index.js');

// POST /api/knowledge/search
// 医疗安全：answers[].sourceName 为空时，页面必须显示「未提供来源」标注
function searchKnowledge(query, topK) {
  return request({
    url: '/knowledge/search',
    method: 'POST',
    data: { query: query, topK: topK || 5 },
    mock: function () {
      return mock.searchKnowledge(query);
    }
  });
}

module.exports = { searchKnowledge: searchKnowledge };
