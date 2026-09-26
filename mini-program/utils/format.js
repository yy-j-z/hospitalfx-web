// 通用格式化工具，只做展示，不改数据结构。
function formatDateTime(value) {
  if (!value) return '--';
  return String(value).replace('T', ' ').slice(0, 16);
}

function confidencePercent(confidence) {
  const num = Number(confidence);
  if (isNaN(num)) return '--';
  return Math.round(num * 100) + '%';
}

// 置信度分级：>= 0.85 高可信；>= 阈值(0.6) 中可信；否则必须人工确认
function confidenceLevel(confidence, threshold) {
  const num = Number(confidence);
  if (isNaN(num)) return { level: 'unknown', text: '置信度缺失，请人工核对' };
  if (num >= 0.85) return { level: 'high', text: '高可信' };
  if (num >= threshold) return { level: 'medium', text: '中可信，建议核对' };
  return { level: 'low', text: '低可信，必须人工确认' };
}

function maskPhone(phone) {
  const value = String(phone || '');
  if (value.length !== 11) return value || '--';
  return value.slice(0, 3) + '****' + value.slice(7);
}

function emptyText(value) {
  return value === null || value === undefined || value === '' ? '待后端知识表就绪' : value;
}

module.exports = {
  formatDateTime: formatDateTime,
  confidencePercent: confidencePercent,
  confidenceLevel: confidenceLevel,
  maskPhone: maskPhone,
  emptyText: emptyText
};
