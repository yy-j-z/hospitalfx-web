// 药物冲突提示条：今日用药页与识别结果确认页共用，保证口径一致
Component({
  properties: {
    hasConflict: { type: Boolean, value: false },
    conflicts: { type: Array, value: [] }
  }
});
