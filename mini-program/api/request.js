// 统一请求入口：所有页面只能通过这里发请求（不直接用 wx.request / wx.uploadFile）。
// 职责：拼 baseUrl、注入 X-Auth-Token、设置超时、把各种失败整理成 { status, message }。
const env = require('../config/env.js');

const NETWORK_ERROR_MESSAGE = '无法连接后端服务，请确认后端已启动、config/env.js 的 baseUrl 是否正确';

function buildUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  return env.baseUrl + path;
}

function getToken() {
  return wx.getStorageSync(env.tokenKey) || '';
}

function handleUnauthorized() {
  wx.removeStorageSync(env.tokenKey);
  wx.removeStorageSync(env.userKey);
  wx.showToast({ title: '登录已失效，请重新登录', icon: 'none' });
  setTimeout(function () {
    wx.reLaunch({ url: '/pages/login/login' });
  }, 800);
}

// mock 支持两种写法：直接给值，或给一个函数（函数里可做筛选、模拟失败；失败时 throw {status, message}）
function resolveMock(mock) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      try {
        resolve(typeof mock === 'function' ? mock() : mock);
      } catch (err) {
        reject(err && err.message ? err : { status: 0, message: 'mock 数据异常' });
      }
    }, 200);
  });
}

function request(options) {
  const url = options.url;
  const method = options.method || 'GET';
  const data = options.data;
  const needAuth = options.needAuth !== false;
  const hasMock = Object.prototype.hasOwnProperty.call(options, 'mock');

  if (env.useMock && hasMock) return resolveMock(options.mock);

  return new Promise(function (resolve, reject) {
    const header = { 'content-type': 'application/json' };
    if (needAuth && getToken()) header['X-Auth-Token'] = getToken();
    wx.request({
      url: buildUrl(url),
      method: method,
      data: data,
      header: header,
      timeout: env.timeout,
      success: function (res) {
        if (res.statusCode === 401) {
          handleUnauthorized();
          reject({ status: 401, message: '登录已失效，请重新登录' });
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        reject({
          status: res.statusCode,
          message: (res.data && res.data.message) || ('服务异常（' + res.statusCode + '）')
        });
      },
      fail: function () {
        reject({ status: 0, message: NETWORK_ERROR_MESSAGE });
      }
    });
  });
}

// 图片上传：multipart/form-data，字段名固定 image（api-contract.md 第 0 节）
function upload(options) {
  const hasMock = Object.prototype.hasOwnProperty.call(options, 'mock');
  if (env.useMock && hasMock) return resolveMock(options.mock);

  return new Promise(function (resolve, reject) {
    wx.uploadFile({
      url: buildUrl(options.url),
      filePath: options.filePath,
      name: 'image',
      formData: options.formData || {},
      header: getToken() ? { 'X-Auth-Token': getToken() } : {},
      timeout: env.timeout,
      success: function (res) {
        let body = res.data;
        try {
          body = JSON.parse(res.data);
        } catch (e) {
          body = null;
        }
        if (res.statusCode === 401) {
          handleUnauthorized();
          reject({ status: 401, message: '登录已失效，请重新登录' });
          return;
        }
        if (res.statusCode === 413) {
          reject({ status: 413, message: '图片超过 5 MB，请压缩后重试' });
          return;
        }
        if (res.statusCode === 415) {
          reject({ status: 415, message: '只支持 jpg / jpeg / png / webp 格式的图片' });
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300 && body) {
          resolve(body);
          return;
        }
        reject({
          status: res.statusCode,
          message: (body && body.message) || ('上传失败（' + res.statusCode + '）')
        });
      },
      fail: function () {
        reject({ status: 0, message: NETWORK_ERROR_MESSAGE });
      }
    });
  });
}

module.exports = { request: request, upload: upload, buildUrl: buildUrl, getToken: getToken };
