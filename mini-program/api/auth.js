const { request } = require('./request.js');
const mock = require('../mock/index.js');

// POST /api/auth/login
// 字段名与后端 LoginRequest 一致：loginId + password；患者用手机号作为 loginId
function login(loginId, password) {
  return request({
    url: '/auth/login',
    method: 'POST',
    needAuth: false,
    data: { loginId: loginId, password: password },
    mock: function () {
      return mock.login(loginId, password);
    }
  });
}

module.exports = { login: login };
