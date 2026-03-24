import { useEffect, useMemo, useState } from "react";
import {
  DEPARTMENTS,
  PURCHASE_TYPE_LABELS,
  REGIST_LEVELS,
  ROLE_LABELS,
  VISIT_STATE_LABELS
} from "./mockData";

export function ActiveViewRouter({ activeView, sessionUser, actions }) {
  switch (activeView) {
    case "dashboard":
      return <DashboardPanel sessionUser={sessionUser} actions={actions} />;
    case "registration":
      return <RegistrationPanel actions={actions} />;
    case "cancel":
      return <CancelRegistrationPanel actions={actions} />;
    case "triage":
      return <RegistrationAiPanel actions={actions} />;
    case "records":
      return <RecordSearchPanel actions={actions} />;
    case "stats":
      return <StatisticsPanel actions={actions} />;
    case "diagnosis":
      return <DiagnosisPanel actions={actions} sessionUser={sessionUser} />;
    case "messages":
      return <DoctorMessagesPanel actions={actions} sessionUser={sessionUser} />;
    case "pharmacy":
      return <PharmacyPanel actions={actions} />;
    case "patientAi":
      return <PatientAiPanel sessionUser={sessionUser} actions={actions} />;
    case "consult":
      return <PatientConsultPanel sessionUser={sessionUser} actions={actions} />;
    case "users":
      return <AdminUsersPanel actions={actions} />;
    default:
      return <DashboardPanel sessionUser={sessionUser} actions={actions} />;
  }
}

export function InfoBadge({ title, value }) {
  return (
    <div className="info-badge">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DashboardPanel({ sessionUser, actions }) {
  const stats = buildOverview(actions.store.registrations);
  const ownPending =
    sessionUser.roleCode === "DOCTOR"
      ? actions.store.registrations.filter(
          (item) => item.doctorId === sessionUser.doctorId && item.visitState === 1
        ).length
      : 0;
  const ownMessages =
    sessionUser.roleCode === "DOCTOR"
      ? actions.store.consultMessages.filter(
          (item) => item.doctorUserId === sessionUser.id && item.status === "PENDING"
        ).length
      : 0;
  const ownRecords =
    sessionUser.roleCode === "PATIENT"
      ? actions.store.registrations.filter((item) => item.patientUserId === sessionUser.id).length
      : 0;
  const ownConsultPending =
    sessionUser.roleCode === "PATIENT"
      ? actions.store.consultMessages.filter(
          (item) => item.patientUserId === sessionUser.id && item.status === "PENDING"
        ).length
      : 0;
  const ownConsultReplied =
    sessionUser.roleCode === "PATIENT"
      ? actions.store.consultMessages.filter(
          (item) => item.patientUserId === sessionUser.id && item.status === "REPLIED"
        ).length
      : 0;
  const pharmacyQueue =
    sessionUser.roleCode === "PHARMACIST"
      ? actions.store.registrations.filter(
          (item) => item.visitState === 2 && Number(item.purchaseType) === 0
        ).length
      : 0;
  const cards = buildDashboardCards({
    roleCode: sessionUser.roleCode,
    stats,
    ownPending,
    ownMessages,
    ownRecords,
    ownConsultPending,
    ownConsultReplied,
    pharmacyQueue
  });
  const patientRecords =
    sessionUser.roleCode === "PATIENT"
      ? [...actions.store.registrations]
          .sort((left, right) => String(right.registDate || "").localeCompare(String(left.registDate || "")))
          .map((item) => ({
            ...item,
            doctorNameLabel: item.doctorName || "-",
            visitStateLabel: VISIT_STATE_LABELS[item.visitState],
            registfeeLabel: formatCurrency(item.registfee)
          }))
      : [];
  const repliedConsults =
    sessionUser.roleCode === "PATIENT"
      ? actions.store.consultMessages
          .filter((item) => item.patientUserId === sessionUser.id && item.status === "REPLIED")
          .sort((left, right) =>
            String(right.repliedAt || right.createdAt || "").localeCompare(
              String(left.repliedAt || left.createdAt || "")
            )
          )
      : [];

  return (
    <div className="stack">
      <section className="section-card hero-section">
        <div>
          <p className="eyebrow">角色摘要</p>
          <h3>{ROLE_LABELS[sessionUser.roleCode]}工作台</h3>
          <p className="muted-copy">
            当前页面已经按角色拆分业务视角，患者只看自己的挂号和咨询，医生与窗口人员再看各自的处理数据。
          </p>
        </div>
        <div className="metric-grid">
          {cards.map((card) => (
            <MetricCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </section>
      {sessionUser.roleCode === "PATIENT" ? (
        <>
          <section className="section-card">
            <h3>我的挂号记录</h3>
            <p className="section-copy">这里保留患者自己的挂号状态和就诊进度，不再展示收入、总挂号量这类管理端统计。</p>
            <DataTable
              columns={[
                { key: "id", label: "病历号" },
                { key: "deptName", label: "科室" },
                { key: "doctorNameLabel", label: "医生" },
                { key: "registDate", label: "挂号日期" },
                { key: "visitStateLabel", label: "状态" },
                { key: "registfeeLabel", label: "挂号费" }
              ]}
              rows={patientRecords}
              emptyText="暂无挂号记录。"
            />
          </section>
          <section className="section-card">
            <h3>已回复咨询</h3>
            <DataTable
              columns={[
                { key: "doctorName", label: "医生" },
                { key: "symptomSummary", label: "症状摘要" },
                { key: "doctorReplyLabel", label: "医生回复" },
                { key: "repliedAtLabel", label: "回复时间" }
              ]}
              rows={repliedConsults.map((item) => ({
                ...item,
                doctorReplyLabel: item.doctorReply || "医生暂未回复",
                repliedAtLabel: item.repliedAt || "-"
              }))}
              emptyText="暂无已回复咨询记录。"
            />
          </section>
        </>
      ) : (
        <section className="section-card">
          <h3>迁移说明</h3>
          <ul className="plain-list">
            <li>保留了挂号、退号、诊断、发药、留言、统计和 AI 辅助入口。</li>
            <li>登录后按角色展示不同导航，与桌面端工作流一致。</li>
            <li>当前版本已接入 Spring Boot API，前端页面直接读写后端数据。</li>
          </ul>
        </section>
      )}
    </div>
  );
}

function RegistrationPanel({ actions }) {
  const [form, setForm] = useState({
    realname: "",
    gender: "女",
    birthdate: "1995-01-01",
    cardNumber: "",
    homeAddress: "",
    deptName: DEPARTMENTS[0],
    registLevel: REGIST_LEVELS[0],
    doctorId: actions.doctors[0]?.doctorId ?? "",
    isBook: "否",
    registDate: getTodayDateString(),
    receipts: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const age = calculateAge(form.birthdate);
  const availableDoctors = actions.doctors.filter(
    (doctor) =>
      doctor.enabled &&
      doctor.deptName === form.deptName &&
      doctor.registLevel === form.registLevel
  );
  const currentDoctor =
    availableDoctors.find((doctor) => doctor.doctorId === form.doctorId) ?? availableDoctors[0];
  const fee = (currentDoctor?.registFee ?? 0) + (form.isBook === "是" ? 1 : 0);
  const receiptsAmount = toSafeNumber(form.receipts);
  const change = receiptsAmount - fee;

  useEffect(() => {
    if (availableDoctors.length > 0 && !availableDoctors.some((item) => item.doctorId === form.doctorId)) {
      setForm((current) => ({ ...current, doctorId: availableDoctors[0].doctorId }));
    }
  }, [availableDoctors, form.doctorId]);

  function submit(event) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    if (!currentDoctor) {
      actions.showNotice("当前筛选条件下没有可挂号医生。");
      return;
    }
    if (form.realname.trim().length < 2) {
      actions.showNotice("请输入至少 2 个字的患者姓名。");
      return;
    }
    if (!/^\d{17}[\dXx]$/.test(form.cardNumber)) {
      actions.showNotice("请确认身份证号格式正确。");
      return;
    }
    if (!form.registDate) {
      actions.showNotice("请选择挂号日期。");
      return;
    }
    if (!isNonNegativeAmount(form.receipts)) {
      actions.showNotice("请输入正确的实收金额。");
      return;
    }
    if (receiptsAmount < fee) {
      actions.showNotice(`实收金额不足，当前至少需要 ${formatCurrency(fee)}。`);
      return;
    }

    setIsSubmitting(true);
    actions.createRegistration({
      patientUserId: null,
      realname: form.realname.trim(),
      gender: form.gender,
      birthdate: form.birthdate,
      age,
      cardNumber: form.cardNumber.trim().toUpperCase(),
      homeAddress: form.homeAddress.trim(),
      deptName: form.deptName,
      doctorId: currentDoctor.doctorId,
      registLevel: form.registLevel,
      isBook: form.isBook,
      registDate: form.registDate
    }).then(() => {
      actions.showNotice(`挂号成功，应收 ${formatCurrency(fee)}，找零 ${formatCurrency(change)}。`);
      setForm((current) => ({
        ...current,
        realname: "",
        cardNumber: "",
        homeAddress: "",
        receipts: "",
        registDate: getTodayDateString()
      }));
    }).catch((error) => actions.showNotice(error.message || "挂号失败。"))
      .finally(() => setIsSubmitting(false));
  }

  return (
    <section className="section-card">
      <h3>现场挂号</h3>
      <p className="section-copy">系统会根据科室、号别和病历本自动计算应收金额，完成收费后才能提交挂号。</p>
      <form className="stacked-form" onSubmit={submit}>
        <div className="field-grid field-grid-3">
          <label>
            患者姓名
            <input value={form.realname} onChange={(event) => setForm((current) => ({ ...current, realname: event.target.value }))} />
          </label>
          <label>
            性别
            <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}>
              <option value="女">女</option>
              <option value="男">男</option>
            </select>
          </label>
          <label>
            出生日期
            <input type="date" value={form.birthdate} onChange={(event) => setForm((current) => ({ ...current, birthdate: event.target.value }))} />
          </label>
          <label>
            年龄
            <input readOnly value={age} />
          </label>
          <label>
            身份证号
            <input
              maxLength={18}
              value={form.cardNumber}
              onChange={(event) => setForm((current) => ({ ...current, cardNumber: event.target.value }))}
            />
          </label>
          <label>
            挂号日期
            <input type="date" value={form.registDate} onChange={(event) => setForm((current) => ({ ...current, registDate: event.target.value }))} />
          </label>
        </div>
        <label>
          家庭住址
          <textarea rows="3" value={form.homeAddress} onChange={(event) => setForm((current) => ({ ...current, homeAddress: event.target.value }))} />
        </label>
        <div className="field-grid field-grid-4">
          <label>
            科室
            <select value={form.deptName} onChange={(event) => setForm((current) => ({ ...current, deptName: event.target.value }))}>
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            号别
            <select value={form.registLevel} onChange={(event) => setForm((current) => ({ ...current, registLevel: event.target.value }))}>
              {REGIST_LEVELS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            医生
            <select value={currentDoctor?.doctorId ?? ""} onChange={(event) => setForm((current) => ({ ...current, doctorId: event.target.value }))}>
              {availableDoctors.map((item) => (
                <option key={item.doctorId} value={item.doctorId}>{item.realName}</option>
              ))}
            </select>
          </label>
          <label>
            病历本
            <select value={form.isBook} onChange={(event) => setForm((current) => ({ ...current, isBook: event.target.value }))}>
              <option value="否">否</option>
              <option value="是">是</option>
            </select>
          </label>
          <label>
            实收
            <input
              inputMode="decimal"
              placeholder="请输入实收金额"
              value={form.receipts}
              onChange={(event) => setForm((current) => ({ ...current, receipts: event.target.value }))}
            />
          </label>
          <label>
            应收
            <input readOnly value={formatCurrency(fee)} />
          </label>
          <label>
            找零
            <input readOnly value={formatCurrency(change)} />
          </label>
        </div>
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "正在提交..." : "确认挂号"}
        </button>
      </form>
    </section>
  );
}

function CancelRegistrationPanel({ actions }) {
  const [recordId, setRecordId] = useState("");
  const record = actions.store.registrations.find((item) => String(item.id) === recordId.trim());

  function cancelRecord() {
    if (!record) {
      actions.showNotice("请先输入有效病历号。");
      return;
    }
    if (record.visitState !== 1) {
      actions.showNotice("仅待就诊记录允许退号。");
      return;
    }
    actions.cancelRegistration(record.id)
      .then(() => {
        setRecordId("");
        actions.showNotice(`病历号 ${record.id} 已退号。`);
      })
      .catch((error) => actions.showNotice(error.message || "退号失败。"));
  }

  return (
    <section className="section-card">
      <h3>退号管理</h3>
      <div className="inline-search">
        <input placeholder="输入病历号" value={recordId} onChange={(event) => setRecordId(event.target.value)} />
        <button className="secondary-button" type="button" onClick={cancelRecord}>确认退号</button>
      </div>
      {record ? (
        <div className="info-grid">
          <InfoPair label="患者" value={record.realname} />
          <InfoPair label="科室" value={record.deptName} />
          <InfoPair label="医生" value={record.doctorName} />
          <InfoPair label="挂号员" value={record.registeredByName || "-"} />
          <InfoPair label="状态" value={VISIT_STATE_LABELS[record.visitState]} />
          <InfoPair label="挂号费" value={formatCurrency(record.registfee)} />
          <InfoPair label="发药员" value={record.dispensedByName || "-"} />
          <InfoPair label="身份证号" value={maskCardNumber(record.cardNumber)} />
        </div>
      ) : (
        <p className="muted-copy">输入病历号后可查看当前记录并执行退号。</p>
      )}
    </section>
  );
}

function RegistrationAiPanel({ actions }) {
  const [form, setForm] = useState({ patientName: "", gender: "女", age: "28", symptomSummary: "" });
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAskAi() {
    if (!form.symptomSummary.trim()) {
      actions.showNotice("请先输入症状摘要。");
      return;
    }
    try {
      setLoading(true);
      const result = await actions.requestRegistrationAi(form);
      setRecommendation(result);
    } catch (error) {
      actions.showNotice(error.message || "AI 分诊失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section-card">
      <h3>AI 挂号分诊</h3>
      <p className="section-copy">用于快速演示智能导诊能力，输出内容仅作辅助建议，不替代线下就诊。</p>
      <div className="field-grid field-grid-4">
        <label>
          患者姓名
          <input value={form.patientName} onChange={(event) => setForm((current) => ({ ...current, patientName: event.target.value }))} />
        </label>
        <label>
          性别
          <select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}>
            <option value="女">女</option>
            <option value="男">男</option>
          </select>
        </label>
        <label>
          年龄
          <input value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} />
        </label>
      </div>
      <label>
        症状摘要
        <textarea rows="5" value={form.symptomSummary} onChange={(event) => setForm((current) => ({ ...current, symptomSummary: event.target.value }))} />
      </label>
      <button className="secondary-button" disabled={loading} type="button" onClick={handleAskAi}>
        {loading ? "正在分析..." : "生成 AI 推荐"}
      </button>
      {recommendation ? (
        <div className="ai-result">
          <h4>推荐结果</h4>
          <InfoPair label="推荐科室" value={recommendation.primary} />
          <InfoPair label="推荐医生" value={recommendation.secondary} />
          <InfoPair label="建议时间" value={recommendation.tertiary} />
          <InfoPair label="风险提醒" value={recommendation.risk} />
        </div>
      ) : (
        <p className="muted-copy">输入症状后，这里会给出推荐科室和医生。</p>
      )}
    </section>
  );
}

function RecordSearchPanel({ actions }) {
  const [cardNumber, setCardNumber] = useState("");
  const results = actions.store.registrations.filter((item) => item.cardNumber === cardNumber.trim().toUpperCase());

  return (
    <section className="section-card">
      <h3>病历查询</h3>
      <p className="section-copy">支持按身份证号精确检索挂号和接诊记录，方便窗口快速核验患者信息。</p>
      <div className="inline-search">
        <input placeholder="输入身份证号" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} />
      </div>
      <DataTable
        columns={[
          { key: "id", label: "病历号" },
          { key: "realname", label: "患者姓名" },
          { key: "deptName", label: "挂号科室" },
          { key: "doctorName", label: "接诊医生" },
          { key: "registeredByNameLabel", label: "挂号员" },
          { key: "dispensedByNameLabel", label: "发药员" },
          { key: "registDate", label: "挂号日期" },
          { key: "visitStateLabel", label: "状态" }
        ]}
        rows={results.map((item) => ({
          ...item,
          registeredByNameLabel: item.registeredByName || "-",
          dispensedByNameLabel: item.dispensedByName || "-",
          visitStateLabel: VISIT_STATE_LABELS[item.visitState]
        }))}
        emptyText="暂无匹配记录。"
      />
    </section>
  );
}

function StatisticsPanel({ actions }) {
  const overview = buildOverview(actions.store.registrations);
  const deptRows = buildDepartmentStats(actions.store.registrations);
  const doctorRows = buildDoctorStats(actions.store.registrations, actions.doctors);
  const visitedRows = actions.store.registrations
    .filter((item) => item.visitState >= 2)
    .map((item) => ({
      ...item,
      visitStateLabel: VISIT_STATE_LABELS[item.visitState],
      purchaseTypeLabel: PURCHASE_TYPE_LABELS[item.purchaseType],
      registeredByNameLabel: item.registeredByName || "-",
      dispensedByNameLabel: item.dispensedByName || "-"
    }));

  return (
    <div className="stack">
      <section className="section-card">
        <h3>总览统计</h3>
        <div className="metric-grid">
          <MetricCard title="总挂号量" value={overview.totalRegistrations} />
          <MetricCard title="已看诊" value={overview.visitedCount} />
          <MetricCard title="药房发药" value={overview.dispensedCount} />
          <MetricCard title="总收入" value={formatCurrency(overview.totalIncome)} />
        </div>
      </section>
      <section className="section-card">
        <h3>科室统计</h3>
        <DataTable
          columns={[{ key: "deptName", label: "科室" }, { key: "total", label: "总挂号" }, { key: "waiting", label: "待就诊" }, { key: "visited", label: "已看诊" }, { key: "incomeLabel", label: "收入" }]}
          rows={deptRows.map((row) => ({ ...row, incomeLabel: formatCurrency(row.income) }))}
          emptyText="暂无科室统计数据。"
        />
      </section>
      <section className="section-card">
        <h3>医生统计</h3>
        <DataTable
          columns={[{ key: "doctorName", label: "医生" }, { key: "deptName", label: "科室" }, { key: "registLevel", label: "号别" }, { key: "total", label: "总挂号" }, { key: "visited", label: "已看诊" }, { key: "waiting", label: "待就诊" }]}
          rows={doctorRows}
          emptyText="暂无医生统计数据。"
        />
      </section>
      <section className="section-card">
        <h3>已看诊患者</h3>
        <DataTable
          columns={[{ key: "id", label: "病历号" }, { key: "realname", label: "患者" }, { key: "deptName", label: "科室" }, { key: "doctorName", label: "医生" }, { key: "registeredByNameLabel", label: "挂号员" }, { key: "dispensedByNameLabel", label: "发药员" }, { key: "registfeeLabel", label: "挂号费" }, { key: "drugPriceLabel", label: "药费" }, { key: "purchaseTypeLabel", label: "购药方式" }, { key: "visitStateLabel", label: "状态" }]}
          rows={visitedRows.map((row) => ({ ...row, registfeeLabel: formatCurrency(row.registfee), drugPriceLabel: formatCurrency(row.drugPrice) }))}
          emptyText="暂无已看诊患者。"
        />
      </section>
    </div>
  );
}

function DiagnosisPanel({ actions, sessionUser }) {
  const queue = actions.store.registrations.filter(
    (item) => item.doctorId === sessionUser.doctorId && item.visitState === 1
  );
  const visitedRows = actions.store.registrations
    .filter((item) => item.doctorId === sessionUser.doctorId && item.visitState >= 2)
    .sort((left, right) =>
      String(right.registDate || "").localeCompare(String(left.registDate || ""))
    )
    .map((item) => ({
      ...item,
      purchaseTypeLabel: PURCHASE_TYPE_LABELS[item.purchaseType],
      visitStateLabel: VISIT_STATE_LABELS[item.visitState],
      drugPriceLabel: formatCurrency(item.drugPrice)
    }));
  const [selectedId, setSelectedId] = useState(queue[0]?.id ?? null);
  const selected = queue.find((item) => item.id === selectedId) ?? queue[0] ?? null;
  const [form, setForm] = useState({ diagiosis: "", prescription: "", drugPrice: "", purchaseType: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [aiSymptomSummary, setAiSymptomSummary] = useState("");
  const [aiAdvice, setAiAdvice] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    if (!selected) {
      return;
    }
    setSelectedId(selected.id);
    setForm({
      diagiosis: selected.diagiosis || "",
      prescription: selected.prescription || "",
      drugPrice: selected.drugPrice || "",
      purchaseType: Number(selected.purchaseType || 0)
    });
    setAiSymptomSummary("");
    setAiAdvice(null);
  }, [selected?.id]);

  function saveDiagnosis() {
    if (isSaving) {
      return;
    }
    if (!selected) {
      actions.showNotice("当前没有待接诊患者。");
      return;
    }
    if (!form.diagiosis.trim() || !form.prescription.trim()) {
      actions.showNotice("请先填写诊断结果和处方。");
      return;
    }
    if (!isNonNegativeAmount(form.drugPrice || 0)) {
      actions.showNotice("药费必须是大于或等于 0 的数字。");
      return;
    }
    setIsSaving(true);
    actions.saveDiagnosis(selected.id, {
      diagiosis: form.diagiosis.trim(),
      prescription: form.prescription.trim(),
      drugPrice: toSafeNumber(form.drugPrice),
      purchaseType: Number(form.purchaseType)
    }).then(() => {
      actions.showNotice(`病历号 ${selected.id} 已保存诊断。`);
    }).catch((error) => actions.showNotice(error.message || "保存诊断失败。"))
      .finally(() => setIsSaving(false));
  }

  async function requestMedicationAdvice() {
    if (isLoadingAi) {
      return;
    }
    if (!selected) {
      actions.showNotice("当前没有待接诊患者。");
      return;
    }
    if (!aiSymptomSummary.trim()) {
      actions.showNotice("请先输入症状描述，再生成 AI 用药参考。");
      return;
    }
    try {
      setIsLoadingAi(true);
      const response = await actions.requestDoctorMedicationAi({
        patientName: selected.realname,
        gender: selected.gender,
        age: String(selected.age ?? ""),
        currentDiagnosis: form.diagiosis,
        symptomSummary: aiSymptomSummary.trim()
      });
      setAiAdvice(response);
    } catch (error) {
      actions.showNotice(error.message || "AI 用药参考生成失败。");
    } finally {
      setIsLoadingAi(false);
    }
  }

  function applyAiDiagnosis() {
    if (!aiAdvice?.primary) {
      return;
    }
    setForm((current) => ({ ...current, diagiosis: aiAdvice.primary }));
    actions.showNotice("已将 AI 参考诊断带入诊断结果，可继续修改。");
  }

  function applyAiPrescription() {
    if (!aiAdvice?.secondary) {
      return;
    }
    setForm((current) => ({ ...current, prescription: aiAdvice.secondary }));
    actions.showNotice("已将 AI 建议药方带入处方，可继续修改。");
  }

  return (
    <div className="stack">
      <div className="split-layout">
        <section className="section-card">
          <h3>待接诊患者</h3>
          <div className="list-stack">
            {queue.length === 0 ? <p className="muted-copy">当前没有待接诊患者。</p> : null}
            {queue.map((item) => (
              <button
                className={item.id === selected?.id ? "list-button list-button-active" : "list-button"}
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
              >
                <strong>{item.realname}</strong>
                <span>病历号 {item.id} · {item.registDate}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="section-card">
          <h3>接诊记录</h3>
          {selected ? (
            <>
              <div className="info-grid">
                <InfoPair label="患者姓名" value={selected.realname} />
                <InfoPair label="性别年龄" value={`${selected.gender} / ${selected.age}`} />
                <InfoPair label="身份证号" value={maskCardNumber(selected.cardNumber)} />
                <InfoPair label="挂号科室" value={selected.deptName} />
              </div>
              <label>
                诊断结果
                <textarea rows="4" value={form.diagiosis} onChange={(event) => setForm((current) => ({ ...current, diagiosis: event.target.value }))} />
              </label>
              <label>
                处方
                <textarea rows="4" value={form.prescription} onChange={(event) => setForm((current) => ({ ...current, prescription: event.target.value }))} />
              </label>
              <section className="ai-assist-card">
                <h4>AI 用药参考</h4>
                <p className="section-copy">医生可根据症状描述生成参考诊断与建议药方，仅作辅助，不会强制采用。</p>
                <label>
                  症状描述
                  <textarea
                    rows="4"
                    value={aiSymptomSummary}
                    placeholder="例如：发热两天，咽痛，伴轻微咳嗽，无呼吸困难。"
                    onChange={(event) => setAiSymptomSummary(event.target.value)}
                  />
                </label>
                <button className="secondary-button" disabled={isLoadingAi} type="button" onClick={requestMedicationAdvice}>
                  {isLoadingAi ? "正在生成..." : "生成 AI 用药参考"}
                </button>
                {aiAdvice ? (
                  <div className="stack">
                    <div className="info-grid">
                      <InfoPair label="参考诊断" value={aiAdvice.primary || "-"} />
                      <InfoPair label="建议药方" value={aiAdvice.secondary || "-"} />
                      <InfoPair label="用药说明" value={aiAdvice.tertiary || "-"} />
                      <InfoPair label="风险提醒" value={aiAdvice.risk || "-"} />
                    </div>
                    <div className="inline-actions">
                      <button className="ghost-button" disabled={!aiAdvice.primary} type="button" onClick={applyAiDiagnosis}>
                        带入诊断结果
                      </button>
                      <button className="ghost-button" disabled={!aiAdvice.secondary} type="button" onClick={applyAiPrescription}>
                        带入处方
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="muted-copy">这里会根据医生填写的症状描述生成建议药方，最终是否采用由医生决定。</p>
                )}
              </section>
              <div className="field-grid field-grid-3">
                <label>
                  药费
                  <input value={form.drugPrice} onChange={(event) => setForm((current) => ({ ...current, drugPrice: event.target.value }))} />
                </label>
                <label>
                  购药方式
                  <select value={form.purchaseType} onChange={(event) => setForm((current) => ({ ...current, purchaseType: Number(event.target.value) }))}>
                    <option value={0}>药房取药</option>
                    <option value={1}>自行购买</option>
                  </select>
                </label>
              </div>
              <button className="primary-button" disabled={isSaving} type="button" onClick={saveDiagnosis}>
                {isSaving ? "正在保存..." : "保存看诊"}
              </button>
            </>
          ) : (
            <p className="muted-copy">请选择左侧患者进行接诊。</p>
          )}
        </section>
      </div>
      <section className="section-card">
        <h3>已看诊患者记录</h3>
        <DataTable
          columns={[
            { key: "id", label: "病历号" },
            { key: "realname", label: "患者" },
            { key: "registDate", label: "挂号日期" },
            { key: "diagiosis", label: "诊断" },
            { key: "prescription", label: "处方" },
            { key: "purchaseTypeLabel", label: "购药方式" },
            { key: "drugPriceLabel", label: "药费" },
            { key: "visitStateLabel", label: "状态" }
          ]}
          rows={visitedRows}
          emptyText="暂无已看诊患者记录。"
        />
      </section>
    </div>
  );
}

function DoctorMessagesPanel({ actions, sessionUser }) {
  const messages = actions.store.consultMessages
    .filter((item) => item.doctorUserId === sessionUser.id)
    .sort((left, right) =>
      String(right.repliedAt || right.createdAt || "").localeCompare(
        String(left.repliedAt || left.createdAt || "")
      )
    );
  const pendingMessages = messages.filter((item) => item.status !== "REPLIED");
  const repliedMessages = messages.filter((item) => item.status === "REPLIED");
  const [activeTab, setActiveTab] = useState("pending");
  const visibleMessages = activeTab === "history" ? repliedMessages : pendingMessages;
  const [selectedId, setSelectedId] = useState(null);
  const selected = visibleMessages.find((item) => item.id === selectedId) ?? visibleMessages[0] ?? null;
  const [reply, setReply] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeTab === "pending" && pendingMessages.length === 0 && repliedMessages.length > 0) {
      setActiveTab("history");
    }
    if (activeTab === "history" && repliedMessages.length === 0 && pendingMessages.length > 0) {
      setActiveTab("pending");
    }
  }, [activeTab, pendingMessages.length, repliedMessages.length]);

  useEffect(() => {
    setSelectedId(selected?.id ?? null);
  }, [selected?.id]);

  useEffect(() => {
    setReply(selected?.doctorReply ?? "");
  }, [selected?.id]);

  function saveReply() {
    if (isSaving) {
      return;
    }
    if (!selected) {
      actions.showNotice("当前没有患者留言。");
      return;
    }
    if (!reply.trim()) {
      actions.showNotice("请输入回复内容。");
      return;
    }
    setIsSaving(true);
    const isEditingHistory = selected.status === "REPLIED";
    actions.replyConsultMessage(selected.id, { doctorReply: reply.trim() })
      .then((nextState) => {
        const nextDoctorMessages = (nextState.consultMessages ?? []).filter(
          (item) => item.doctorUserId === sessionUser.id
        );
        const nextPendingCount = nextDoctorMessages.filter((item) => item.status !== "REPLIED").length;
        if (!isEditingHistory) {
          setReply("");
          setSelectedId(null);
          if (nextPendingCount === 0) {
            setActiveTab("history");
          }
        }
        actions.showNotice(isEditingHistory ? "医生回复已更新。" : "医生回复已发送，并移入已回复记录。");
      })
      .catch((error) => actions.showNotice(error.message || "保存回复失败。"))
      .finally(() => setIsSaving(false));
  }

  return (
    <div className="split-layout">
      <section className="section-card">
        <h3>患者留言</h3>
        <div className="segmented-actions">
          <button
            className={activeTab === "pending" ? "tiny-button tiny-button-active" : "tiny-button"}
            type="button"
            onClick={() => setActiveTab("pending")}
          >
            待回复 {pendingMessages.length}
          </button>
          <button
            className={activeTab === "history" ? "tiny-button tiny-button-active" : "tiny-button"}
            type="button"
            onClick={() => setActiveTab("history")}
          >
            已回复 {repliedMessages.length}
          </button>
        </div>
        <div className="list-stack">
          {visibleMessages.length === 0 ? (
            <p className="muted-copy">
              {activeTab === "pending" ? "当前没有待回复留言。" : "暂无已回复记录。"}
            </p>
          ) : null}
          {visibleMessages.map((item) => (
            <button
              className={item.id === selected?.id ? "list-button list-button-active" : "list-button"}
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
            >
              <strong>{item.patientName}</strong>
              <span>
                {item.status === "REPLIED" ? "已回复" : "待回复"} · {item.repliedAt || item.createdAt}
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="section-card">
        <h3>{selected?.status === "REPLIED" ? "回复记录" : "回复详情"}</h3>
        {selected ? (
          <>
            <div className="info-grid">
              <InfoPair label="患者" value={selected.patientName} />
              <InfoPair label="症状摘要" value={selected.symptomSummary} />
              <InfoPair label="留言时间" value={selected.createdAt || "-"} />
              <InfoPair label="回复时间" value={selected.repliedAt || "尚未回复"} />
            </div>
            <label>
              患者问题
              <textarea rows="5" value={selected.patientMessage} readOnly />
            </label>
            <label>
              医生回复
              <textarea rows="5" value={reply} onChange={(event) => setReply(event.target.value)} />
            </label>
            <button className="primary-button" disabled={isSaving} type="button" onClick={saveReply}>
              {isSaving ? "正在保存..." : selected.status === "REPLIED" ? "更新回复" : "发送回复"}
            </button>
          </>
        ) : (
          <p className="muted-copy">
            {activeTab === "pending" ? "选择一条待回复留言后即可处理。" : "这里会保留医生已回复过的患者记录。"}
          </p>
        )}
      </section>
    </div>
  );
}

function PharmacyPanel({ actions }) {
  const queue = actions.store.registrations.filter(
    (item) => item.visitState === 2 && Number(item.purchaseType) === 0
  );
  const [pendingId, setPendingId] = useState(null);

  function markDispensed(id) {
    if (pendingId) {
      return;
    }
    setPendingId(id);
    actions.markDispensed(id)
      .then(() => actions.showNotice(`病历号 ${id} 已完成发药。`))
      .catch((error) => actions.showNotice(error.message || "发药失败。"))
      .finally(() => setPendingId(null));
  }

  return (
    <section className="section-card">
      <h3>药房发药</h3>
      <DataTable
        columns={[
          { key: "id", label: "病历号" },
          { key: "realname", label: "患者" },
          { key: "doctorName", label: "医生" },
          { key: "registeredByNameLabel", label: "挂号员" },
          { key: "deptName", label: "科室" },
          { key: "diagiosis", label: "诊断" },
          { key: "prescription", label: "处方" },
          { key: "drugPriceLabel", label: "药费" },
          { key: "action", label: "操作" }
        ]}
        rows={queue.map((item) => ({
          ...item,
          registeredByNameLabel: item.registeredByName || "-",
          drugPriceLabel: formatCurrency(item.drugPrice),
          action: (
            <button className="tiny-button" disabled={pendingId === item.id} type="button" onClick={() => markDispensed(item.id)}>
              {pendingId === item.id ? "提交中..." : "确认发药"}
            </button>
          )
        }))}
        emptyText="暂无待发药记录。"
      />
    </section>
  );
}

function PatientAiPanel({ sessionUser, actions }) {
  const profile = actions.store.patientProfiles.find((item) => item.userId === sessionUser.id);
  const [symptomSummary, setSymptomSummary] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAskAi() {
    if (!symptomSummary.trim()) {
      actions.showNotice("请先输入症状描述。");
      return;
    }
    try {
      setLoading(true);
      const response = await actions.requestPatientAi({
        patientName: sessionUser.realName,
        gender: profile?.gender ?? "",
        age: String(profile?.age ?? ""),
        symptomSummary
      });
      setResult(response);
    } catch (error) {
      actions.showNotice(error.message || "AI 自测失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section-card">
      <h3>AI 自测</h3>
      <p className="section-copy">用于展示患者端自助问诊入口，输出内容只提供方向性参考。</p>
      <div className="info-grid">
        <InfoPair label="患者" value={sessionUser.realName} />
        <InfoPair label="性别" value={profile?.gender ?? "-"} />
        <InfoPair label="年龄" value={profile?.age ?? "-"} />
      </div>
      <label>
        症状描述
        <textarea rows="6" value={symptomSummary} onChange={(event) => setSymptomSummary(event.target.value)} />
      </label>
      <button className="secondary-button" disabled={loading} type="button" onClick={handleAskAi}>
        {loading ? "正在分析..." : "生成 AI 建议"}
      </button>
      {result ? (
        <div className="ai-result">
          <h4>AI 分析</h4>
          <InfoPair label="可能疾病" value={result.primary} />
          <InfoPair label="建议科室" value={result.secondary} />
          <InfoPair label="分析说明" value={result.tertiary} />
          <InfoPair label="风险提醒" value={result.risk} />
        </div>
      ) : (
        <p className="muted-copy">这里会根据症状给出方向性建议，不替代医生面诊。</p>
      )}
    </section>
  );
}

function PatientConsultPanel({ sessionUser, actions }) {
  const messages = actions.store.consultMessages.filter((item) => item.patientUserId === sessionUser.id);
  const [form, setForm] = useState({
    doctorUserId: actions.doctors[0]?.userId ?? "",
    symptomSummary: "",
    patientMessage: ""
  });
  const [isSending, setIsSending] = useState(false);

  function sendMessage() {
    if (isSending) {
      return;
    }
    const doctor = actions.doctors.find((item) => item.userId === Number(form.doctorUserId));
    if (!doctor || !form.symptomSummary.trim() || !form.patientMessage.trim()) {
      actions.showNotice("请选择医生，并完整填写留言内容。");
      return;
    }
    setIsSending(true);
    actions.sendConsultMessage({
      patientUserId: sessionUser.id,
      doctorUserId: doctor.userId,
      symptomSummary: form.symptomSummary.trim(),
      patientMessage: form.patientMessage.trim()
    }).then(() => {
      setForm((current) => ({ ...current, symptomSummary: "", patientMessage: "" }));
      actions.showNotice("留言已发送给医生。");
    }).catch((error) => actions.showNotice(error.message || "发送留言失败。"))
      .finally(() => setIsSending(false));
  }

  return (
    <div className="stack">
      <section className="section-card">
        <h3>给医生留言</h3>
        <div className="field-grid field-grid-2">
          <label>
            选择医生
            <select value={form.doctorUserId} onChange={(event) => setForm((current) => ({ ...current, doctorUserId: event.target.value }))}>
              {actions.doctors.filter((doctor) => doctor.enabled).map((doctor) => (
                <option key={doctor.userId} value={doctor.userId}>
                  {doctor.realName} / {doctor.deptName} / {doctor.registLevel}
                </option>
              ))}
            </select>
          </label>
          <label>
            症状摘要
            <input value={form.symptomSummary} onChange={(event) => setForm((current) => ({ ...current, symptomSummary: event.target.value }))} />
          </label>
        </div>
        <label>
          留言内容
          <textarea rows="5" value={form.patientMessage} onChange={(event) => setForm((current) => ({ ...current, patientMessage: event.target.value }))} />
        </label>
        <button className="primary-button" disabled={isSending} type="button" onClick={sendMessage}>
          {isSending ? "正在发送..." : "发送留言"}
        </button>
      </section>
      <section className="section-card">
        <h3>我的咨询记录</h3>
        <DataTable
          columns={[{ key: "doctorName", label: "医生" }, { key: "symptomSummary", label: "症状摘要" }, { key: "statusLabel", label: "状态" }, { key: "createdAt", label: "创建时间" }, { key: "doctorReplyLabel", label: "医生回复" }]}
          rows={messages.map((item) => ({ ...item, statusLabel: item.status === "REPLIED" ? "已回复" : "待回复", doctorReplyLabel: item.doctorReply || "医生暂未回复" }))}
          emptyText="暂无咨询记录。"
        />
      </section>
    </div>
  );
}

function AdminUsersPanel({ actions }) {
  const [selectedId, setSelectedId] = useState(actions.store.users[0]?.id ?? null);
  const selected = actions.store.users.find((item) => item.id === selectedId) ?? actions.store.users[0] ?? null;
  const doctorProfile = selected?.doctorId ? actions.store.doctors.find((item) => item.doctorId === selected.doctorId) : null;
  const [draft, setDraft] = useState({
    roleCode: selected?.roleCode ?? "PATIENT",
    enabled: selected?.enabled ?? true,
    deptName: doctorProfile?.deptName ?? DEPARTMENTS[0],
    registLevel: doctorProfile?.registLevel ?? REGIST_LEVELS[0]
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft({
      roleCode: selected?.roleCode ?? "PATIENT",
      enabled: selected?.enabled ?? true,
      deptName: doctorProfile?.deptName ?? DEPARTMENTS[0],
      registLevel: doctorProfile?.registLevel ?? REGIST_LEVELS[0]
    });
  }, [selected?.id, doctorProfile?.doctorId]);

  function saveUser() {
    if (isSaving) {
      return;
    }
    if (!selected) {
      return;
    }
    if (selected.username === "admin" && draft.roleCode !== "ADMIN") {
      actions.showNotice("固定管理员账号不允许降级。");
      return;
    }
    setIsSaving(true);
    actions.updateUser(selected.id, {
      roleCode: draft.roleCode,
      enabled: draft.enabled,
      deptName: draft.deptName,
      registLevel: draft.registLevel
    }).then(() => {
      actions.showNotice("用户角色配置已更新。");
    }).catch((error) => actions.showNotice(error.message || "保存角色失败。"))
      .finally(() => setIsSaving(false));
  }

  return (
    <div className="split-layout">
      <section className="section-card">
        <h3>用户列表</h3>
        <div className="list-stack">
          {actions.store.users.map((user) => (
            <button
              className={user.id === selected?.id ? "list-button list-button-active" : "list-button"}
              key={user.id}
              type="button"
              onClick={() => setSelectedId(user.id)}
            >
              <strong>{user.username}</strong>
              <span>{user.realName} · {ROLE_LABELS[user.roleCode]}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="section-card">
        <h3>用户角色管理</h3>
        {selected ? (
          <>
            <div className="info-grid">
              <InfoPair label="用户名" value={selected.username} />
              <InfoPair label="真实姓名" value={selected.realName} />
              <InfoPair label="当前角色" value={ROLE_LABELS[selected.roleCode]} />
            </div>
            <div className="field-grid field-grid-3">
              <label>
                角色
                <select value={draft.roleCode} onChange={(event) => setDraft((current) => ({ ...current, roleCode: event.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                账号状态
                <select value={draft.enabled ? "enabled" : "disabled"} onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.value === "enabled" }))}>
                  <option value="enabled">启用</option>
                  <option value="disabled">停用</option>
                </select>
              </label>
              {draft.roleCode === "DOCTOR" ? (
                <>
                  <label>
                    科室
                    <select value={draft.deptName} onChange={(event) => setDraft((current) => ({ ...current, deptName: event.target.value }))}>
                      {DEPARTMENTS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    号别
                    <select value={draft.registLevel} onChange={(event) => setDraft((current) => ({ ...current, registLevel: event.target.value }))}>
                      {REGIST_LEVELS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}
            </div>
            <button className="primary-button" disabled={isSaving} type="button" onClick={saveUser}>
              {isSaving ? "正在保存..." : "保存角色设置"}
            </button>
          </>
        ) : (
          <p className="muted-copy">请选择左侧用户进行编辑。</p>
        )}
      </section>
    </div>
  );
}

function DataTable({ columns, rows, emptyText }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty-cell">{emptyText}</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id ?? `${row.doctorName ?? "row"}-${index}`}>
                {columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InfoPair({ label, value }) {
  return (
    <div className="info-pair">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function calculateAge(dateString) {
  if (!dateString) {
    return 0;
  }
  const birth = new Date(dateString);
  if (Number.isNaN(birth.getTime())) {
    return 0;
  }
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(age, 0);
}

function formatCurrency(value) {
  return `¥${toSafeNumber(value).toFixed(2)}`;
}

function getTodayDateString() {
  return new Date().toLocaleDateString("sv-SE");
}

function toSafeNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function isNonNegativeAmount(value) {
  const text = String(value).trim();
  if (!text) {
    return false;
  }
  const numericValue = Number(text);
  return Number.isFinite(numericValue) && numericValue >= 0;
}

function maskCardNumber(cardNumber) {
  const normalized = String(cardNumber || "").trim();
  if (normalized.length < 8) {
    return normalized || "-";
  }
  return `${normalized.slice(0, 4)} ******** ${normalized.slice(-4)}`;
}

function buildOverview(registrations) {
  const totalRegistrations = registrations.length;
  const visitedCount = registrations.filter((item) => item.visitState >= 2).length;
  const dispensedCount = registrations.filter((item) => item.visitState === 3 && Number(item.purchaseType) === 0).length;
  const totalIncome = registrations.reduce((sum, item) => {
    const drugPart = item.visitState >= 2 && Number(item.purchaseType) === 0 ? Number(item.drugPrice || 0) : 0;
    return sum + Number(item.registfee || 0) + drugPart;
  }, 0);
  return { totalRegistrations, visitedCount, dispensedCount, totalIncome };
}

function buildDashboardCards({
  roleCode,
  stats,
  ownPending,
  ownMessages,
  ownRecords,
  ownConsultPending,
  ownConsultReplied,
  pharmacyQueue
}) {
  switch (roleCode) {
    case "ADMIN":
    case "CLERK":
      return [
        { title: "总挂号量", value: stats.totalRegistrations },
        { title: "已看诊", value: stats.visitedCount },
        { title: "药房发药", value: stats.dispensedCount },
        { title: "总收入", value: formatCurrency(stats.totalIncome) }
      ];
    case "DOCTOR":
      return [
        { title: "待接诊患者", value: ownPending },
        { title: "待回复留言", value: ownMessages },
        { title: "已看诊", value: stats.visitedCount }
      ];
    case "PHARMACIST":
      return [
        { title: "待发药记录", value: pharmacyQueue },
        { title: "已发药", value: stats.dispensedCount }
      ];
    case "PATIENT":
      return [
        { title: "我的挂号记录", value: ownRecords },
        { title: "待回复留言", value: ownConsultPending },
        { title: "已回复留言", value: ownConsultReplied }
      ];
    default:
      return [
        { title: "总挂号量", value: stats.totalRegistrations },
        { title: "已看诊", value: stats.visitedCount }
      ];
  }
}

function buildDepartmentStats(registrations) {
  return DEPARTMENTS.map((deptName) => {
    const rows = registrations.filter((item) => item.deptName === deptName);
    const income = rows.reduce((sum, item) => {
      const drugPart = item.visitState >= 2 && Number(item.purchaseType) === 0 ? Number(item.drugPrice || 0) : 0;
      return sum + Number(item.registfee || 0) + drugPart;
    }, 0);
    return {
      deptName,
      total: rows.length,
      waiting: rows.filter((item) => item.visitState === 1).length,
      visited: rows.filter((item) => item.visitState >= 2).length,
      income
    };
  }).filter((item) => item.total > 0);
}

function buildDoctorStats(registrations, doctors) {
  return doctors.map((doctor) => {
    const rows = registrations.filter((item) => item.doctorId === doctor.doctorId);
    return {
      doctorName: doctor.realName,
      deptName: doctor.deptName,
      registLevel: doctor.registLevel,
      total: rows.length,
      visited: rows.filter((item) => item.visitState >= 2).length,
      waiting: rows.filter((item) => item.visitState === 1).length
    };
  });
}

function generateRegistrationAdvice(symptomSummary, doctors) {
  const lower = symptomSummary.toLowerCase();
  let deptName = "内科";
  if (lower.includes("皮") || lower.includes("痒")) deptName = "皮肤科";
  else if (lower.includes("耳") || lower.includes("鼻") || lower.includes("咽")) deptName = "耳鼻喉科";
  else if (lower.includes("骨") || lower.includes("膝") || lower.includes("扭伤")) deptName = "骨科";
  else if (lower.includes("腹") || lower.includes("痛")) deptName = "外科";
  const doctor = doctors.find((item) => item.deptName === deptName) ?? doctors[0];
  return {
    deptName,
    doctorName: doctor.realName,
    timeAdvice: lower.includes("高热") || lower.includes("呼吸困难") ? "立即急诊或尽快就诊" : "建议今天内就诊",
    reason: `根据“${symptomSummary.slice(0, 18)}”的描述，当前更适合先从${deptName}入口筛查。`,
    risk: lower.includes("呼吸困难") || lower.includes("剧烈疼痛") ? "存在急症风险，请优先线下就医。" : "该建议仅做分诊参考，不能替代医生面诊。"
  };
}

function generatePatientAdvice(symptomSummary) {
  const lower = symptomSummary.toLowerCase();
  if (lower.includes("咳") || lower.includes("发热")) {
    return { disease: "上呼吸道感染 / 支气管炎方向", dept: "内科", analysis: "症状更偏向呼吸系统炎症，建议结合体温、咽痛和咳痰情况进一步判断。", risk: "若出现高热不退、胸闷或呼吸困难，请尽快线下就诊。" };
  }
  if (lower.includes("皮") || lower.includes("痒")) {
    return { disease: "过敏性皮炎 / 湿疹方向", dept: "皮肤科", analysis: "皮肤类症状更适合先由皮肤科判断是否属于过敏、感染或慢性炎症。", risk: "若皮疹扩散、伴发热或出现呼吸不适，应及时就医。" };
  }
  if (lower.includes("胃") || lower.includes("反酸")) {
    return { disease: "胃炎 / 反流性不适方向", dept: "内科", analysis: "饭后反酸、胃胀常见于消化系统刺激或胃酸相关问题。", risk: "如出现黑便、持续呕吐或剧烈腹痛，请尽快就诊。" };
  }
  return { disease: "需结合线下病史进一步判断", dept: "内科", analysis: "当前症状信息还不够完整，建议补充持续时间、诱因和加重因素。", risk: "AI 建议只作方向性参考，不能代替面诊和检查。" };
}
