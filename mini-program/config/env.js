// 环境配置：改后端地址、切 mock / 真接口，只改这个文件。
// 不要在任何页面里硬编码 http:// 地址（团队约定见 _codex_workspace/development-contract.md）。
module.exports = {
  // 开发：微信开发者工具勾选「不校验合法域名」后可直接用本机地址
  baseUrl: 'http://localhost:8080/api',
  // 真机预览：换成电脑的局域网 IP，例如 'http://192.168.1.5:8080/api'（手机与电脑同一 WiFi）
  // 提交比赛 / 发布：必须换成可访问的 HTTPS 地址，并在微信后台配置 request 与 uploadFile 合法域名
  timeout: 10000,

  // 后端接口就绪前保持 true，用 mock/ 下的样例数据跑通页面；后端可用后改成 false
  useMock: true,

  // 识别置信度阈值：低于该值必须人工确认药品名称后才能入库（医疗安全红线，不要调低）
  confidenceThreshold: 0.6,

  // 图片上传限制，与 api-contract.md 第 0 节一致
  maxImageSize: 5 * 1024 * 1024,
  allowImageExt: ['jpg', 'jpeg', 'png', 'webp'],

  // 本地存储键
  tokenKey: 'rc_token',
  userKey: 'rc_user'
};
