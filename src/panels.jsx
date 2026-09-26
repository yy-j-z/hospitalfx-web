import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DEPARTMENTS,
  PURCHASE_TYPE_LABELS,
  REGIST_LEVELS,
  ROLE_LABELS,
  VISIT_STATE_LABELS
} from "./mockData";
import ProjectShowcase from "./components/ProjectShowcase";

const MEDICATION_FREQUENCY_OPTIONS = [
  { code: "QD", label: "每日 1 次", timesPerDay: 1 },
  { code: "BID", label: "每日 2 次", timesPerDay: 2 },
  { code: "TID", label: "每日 3 次", timesPerDay: 3 },
  { code: "HS", label: "睡前 1 次", timesPerDay: 1 }
];

export function ActiveViewRouter({ activeView, sessionUser, actions }) {
  switch (activeView) {
    case "dashboard":
      return <DashboardPanel sessionUser={sessionUser} actions={actions} />;
    case "registration":
      return <RegistrationPanel sessionUser={sessionUser} actions={actions} />;
    case "cancel":
      return <CancelRegistrationPanel sessionUser={sessionUser} actions={actions} />;
    case "triage":
      return <RegistrationAiPanel actions={actions} />;
    case "records":
      return <RecordSearchPanel actions={actions} />;
    case "stats":
      return <StatisticsPanel actions={actions} />;
    case "diagnosis":
      return <DiagnosisPanel sessionUser={sessionUser} actions={actions} />;
    case "messages":
      return <DoctorMessagesPanel sessionUser={sessionUser} actions={actions} />;
    case "pharmacy":
      return <PharmacyPanel actions={actions} />;
    case "patientAi":
      return <PatientAiPanel sessionUser={sessionUser} actions={actions} />;
    case "consult":
      return <PatientConsultPanel sessionUser={sessionUser} actions={actions} />;
    case "medication":
      return <PatientMedicationPanel sessionUser={sessionUser} actions={actions} />;
    case "about":
      return <AboutPanel actions={actions} />;
    case "users":
      return <AdminUsersPanel actions={actions} />;
    default:
      return <DashboardPanel sessionUser={sessionUser} actions={actions} />;
  }
}

function DashboardPanel({ sessionUser, actions }) {
  const stats = buildOverview(actions.store.registrations ?? []);
  if (sessionUser.roleCode === "ADMIN") {
    return <AdminDashboardCanvasV2 sessionUser={sessionUser} actions={actions} stats={stats} />;
  }
  if (sessionUser.roleCode === "DOCTOR") {
    return <DoctorDashboardCanvas sessionUser={sessionUser} actions={actions} />;
  }
  if (sessionUser.roleCode === "PHARMACIST") {
    return <PharmacistDashboardCanvas sessionUser={sessionUser} actions={actions} />;
  }
  if (sessionUser.roleCode === "PATIENT") {
    return <PatientHomeCanvas sessionUser={sessionUser} actions={actions} />;
  }
  const profile =
    sessionUser.roleCode === "PATIENT"
      ? actions.store.patientProfiles.find((item) => item.userId === sessionUser.id) ?? null
      : null;
  const patientMedicationPlans =
    sessionUser.roleCode === "PATIENT"
      ? (actions.store.medicationPlans ?? []).filter((item) => item.patientUserId === sessionUser.id)
      : [];
  const patientMedicationConflicts =
    sessionUser.roleCode === "PATIENT"
      ? findMedicationConflictsForPlans(
          patientMedicationPlans,
          actions.store.medicationConflicts ?? [],
          actions.store.medicationInventories ?? []
        )
      : [];
  const patientRows =
    sessionUser.roleCode === "PATIENT"
      ? actions.store.registrations
          .filter((item) => item.patientUserId === sessionUser.id)
          .sort((left, right) => String(right.registDate || "").localeCompare(String(left.registDate || "")))
          .map((item) => ({
            ...item,
            visitStateLabel: VISIT_STATE_LABELS[item.visitState] || "-",
            registfeeLabel: formatCurrency(item.registfee)
          }))
      : [];

  return (
    <div className="stack">
      <section className="section-card hero-section">
        <div>
          <p className="eyebrow">角色摘要</p>
          <h3>{ROLE_LABELS[sessionUser.roleCode] ?? "当前角色"}工作台</h3>
          <p className="muted-copy">系统会根据角色自动显示业务入口，患者端已接管挂号与退号管理。</p>
        </div>
        <div className="metric-grid">
          {buildDashboardCards(sessionUser.roleCode, stats, actions, sessionUser).map((card) => (
            <MetricCard key={card.title} title={card.title} value={card.value} />
          ))}
        </div>
      </section>
      {sessionUser.roleCode === "PATIENT" ? (
        <>
          <section className="section-card">
            <h3>我的账户信息</h3>
            <div className="info-grid">
              <InfoPair label="登录手机号" value={profile?.phoneNumber || sessionUser.phoneNumber || "-"} />
              <InfoPair label="身份证号" value={profile?.cardNumber || "-"} />
              <InfoPair label="姓名" value={sessionUser.realName} />
            </div>
          </section>
          <section className="section-card">
            <h3>常用服务</h3>
            <div className="quick-entry-grid">
              <button className="quick-entry-card" type="button" onClick={() => actions.setActiveView("registration")}>
                <strong>预约挂号</strong>
                <span>快速选择科室、号别和医生完成挂号。</span>
              </button>
              <button className="quick-entry-card" type="button" onClick={() => actions.setActiveView("medication")}>
                <strong>用药管家</strong>
                <span>查看服药提醒、冲突预警和今日打卡进度。</span>
              </button>
              <button className="quick-entry-card" type="button" onClick={() => actions.setActiveView("cancel")}>
                <strong>退号处理</strong>
                <span>查看待就诊记录并直接完成退号。</span>
              </button>
              <button className="quick-entry-card" type="button" onClick={() => actions.setActiveView("consult")}>
                <strong>咨询留言</strong>
                <span>向目标医生补充症状与问题说明。</span>
              </button>
            </div>
          </section>
          <section className="section-card">
            <div className="section-heading-inline">
              <div>
                <h3>今日用药提醒</h3>
                <p className="section-copy">这里会抓取患者当前正在执行的服药计划，作为首页提醒入口。</p>
              </div>
              <button className="ghost-button" type="button" onClick={() => actions.setActiveView("medication")}>
                打开用药管家
              </button>
            </div>
            <div className="info-grid">
              <InfoPair label="进行中的计划" value={patientMedicationPlans.filter((item) => item.status !== "COMPLETED").length} />
              <InfoPair label="待提醒药物" value={patientMedicationPlans.filter((item) => item.status === "ACTIVE").length} />
              <InfoPair label="冲突提醒" value={patientMedicationConflicts.length} />
            </div>
            <div className="plain-list-wrap">
              {patientMedicationPlans.length === 0 ? (
                <p className="muted-copy">当前还没有服药计划。医生保存处方后，会自动同步到这里。</p>
              ) : (
                <ul className="plain-list">
                  {patientMedicationPlans.slice(0, 3).map((plan) => (
                    <li key={plan.id}>
                      {plan.medicationName} · {plan.dosage} · {plan.frequencyLabel}
                      {plan.nextReminderAt ? ` · 下次提醒 ${formatDateTime(plan.nextReminderAt)}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          <section className="section-card">
            <h3>我的挂号记录</h3>
            <DataTable
              columns={[
                { key: "id", label: "病历号" },
                { key: "deptName", label: "科室" },
                { key: "doctorName", label: "医生" },
                { key: "registDate", label: "挂号日期" },
                { key: "visitStateLabel", label: "状态" },
                { key: "registfeeLabel", label: "挂号费" }
              ]}
              rows={patientRows}
              emptyText="暂无挂号记录。"
            />
          </section>
        </>
      ) : (
        <section className="section-card">
          <ul className="plain-list">
            <li>患者挂号、退号和数字人问诊已经整合到患者端入口。</li>
            <li>医生端保留接诊、留言和 AI 用药参考能力。</li>
          </ul>
        </section>
      )}
    </div>
  );
}

function AdminDashboardCanvas({ sessionUser, actions, stats }) {
  const dashboard = buildAdminDashboardData(actions.store, stats);

  async function handleQuickAction(actionKey, view) {
    if (view) {
      actions.setActiveView(view);
      return;
    }

    if (actionKey === "refresh") {
      try {
        await actions.refreshState();
        actions.showNotice("管理员首页数据已刷新。");
      } catch (error) {
        actions.showNotice(error.message || "刷新首页数据失败。");
      }
    }
  }

  return (
    <div className="stack admin-dashboard-canvas admin-page-stack">
      <section className="section-card admin-dashboard-hero admin-section-card">
        <div className="admin-dashboard-hero__copy">
          <p className="eyebrow">运营驾驶舱</p>
          <h3>医院运营总览</h3>
          <p className="section-copy">集中查看挂号、接诊、发药、库存与待办事项，供管理员统一掌握当前门诊运行情况。</p>
          <div className="admin-dashboard-hero__meta">
            <span className="admin-dashboard-pill">{sessionUser.realName} / 管理员</span>
            <span className="admin-dashboard-pill">{dashboard.todayLabel}</span>
            <span className="admin-dashboard-pill">{dashboard.reportDateNote}</span>
          </div>
        </div>
        <div className="admin-dashboard-hero__summary">
          <div className="admin-dashboard-hero__date">{dashboard.calendarLabel}</div>
          <div className="admin-dashboard-hero__snapshot">
            <InfoPair label="在岗医生" value={dashboard.snapshot.doctorCount} />
            <InfoPair label="活跃账户" value={dashboard.snapshot.activeUserCount} />
            <InfoPair label="待处理事项" value={dashboard.snapshot.pendingCount} />
          </div>
        </div>
      </section>

      <section className="admin-kpi-grid admin-kpi-grid-dense">
        {dashboard.summaryCards.map((card) => (
          <article className={`admin-kpi-card admin-kpi-card-${card.tone} admin-section-card`} key={card.title}>
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <p>{card.supporting}</p>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-canvas-grid">
        <article className="section-card admin-dashboard-panel admin-section-card admin-span-7">
          <div className="admin-panel-header">
            <div>
              <h3>挂号趋势</h3>
              <p className="section-copy">按近 7 个统计日汇总挂号量，用于观察门诊业务波动。</p>
            </div>
            <span className="admin-tag admin-tag-info">近 7 日</span>
          </div>
          <div className="admin-trend-chart admin-trend-chart-compact">
            {dashboard.trendSeries.map((item) => (
              <div className="admin-trend-chart__item" key={item.date}>
                <span className="admin-trend-chart__value">{item.count}</span>
                <div className="admin-trend-chart__bar-wrap">
                  <div className="admin-trend-chart__bar" style={{ height: `${item.height}%` }} />
                </div>
                <span className="admin-trend-chart__label">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="admin-trend-stats">
            {dashboard.trendStats.map((item) => (
              <div className="admin-trend-stat" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-5">
          <div className="admin-panel-header">
            <div>
              <h3>科室分布</h3>
              <p className="section-copy">按当前统计日挂号数据汇总，显示主要业务科室占比。</p>
            </div>
            <span className="admin-tag admin-tag-soft">{dashboard.departmentTotalLabel}</span>
          </div>
          <div className="admin-distribution-list">
            {dashboard.departmentDistribution.length === 0 ? (
              <p className="muted-copy">当前暂无可统计的科室挂号数据。</p>
            ) : (
              dashboard.departmentDistribution.map((item) => (
                <div className="admin-distribution-item" key={item.name}>
                  <div className="admin-distribution-item__top">
                    <strong>{item.name}</strong>
                    <span>{item.count} 人</span>
                  </div>
                  <div className="admin-distribution-item__track">
                    <div className="admin-distribution-item__fill" style={{ width: `${item.percent}%` }} />
                  </div>
                  <small>{item.percentLabel}</small>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-4">
          <div className="admin-panel-header">
            <div>
              <h3>待处理事项</h3>
              <p className="section-copy">统一查看接诊、发药、留言与库存相关待办事项。</p>
            </div>
            <span className="admin-tag admin-tag-warn">{dashboard.pendingItems.length} 项</span>
          </div>
          <div className="admin-task-list">
            {dashboard.pendingItems.map((item) => (
              <button className="admin-task-item" key={item.title} type="button" onClick={() => handleQuickAction(item.actionKey, item.view)}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
                <div className="admin-task-item__side">
                  <span className={`admin-tag ${item.emphasis ? "admin-tag-warn" : "admin-tag-soft"}`}>{item.value}</span>
                  <small>{item.actionLabel}</small>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-4">
          <div className="admin-panel-header">
            <div>
              <h3>系统通知</h3>
              <p className="section-copy">基于现有业务数据生成系统提示，便于管理员快速核查。</p>
            </div>
          </div>
          <div className="admin-notice-list">
            {dashboard.notifications.map((item) => (
              <div className="admin-notice-item" key={item.title}>
                <span className={`admin-tag ${item.level === "alert" ? "admin-tag-alert" : item.level === "warn" ? "admin-tag-warn" : "admin-tag-info"}`}>
                  {item.label}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-4">
          <div className="admin-panel-header">
            <div>
              <h3>快捷入口</h3>
              <p className="section-copy">保留现有工作台结构，直接进入管理员常用业务模块。</p>
            </div>
          </div>
          <div className="admin-quick-grid admin-quick-grid-dense">
            {dashboard.quickActions.map((item) => (
              <button className="admin-quick-card" key={item.title} type="button" onClick={() => handleQuickAction(item.actionKey, item.view)}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-8">
          <div className="admin-panel-header">
            <div>
              <h3>最新挂号记录</h3>
              <p className="section-copy">按挂号日期倒序展示近期业务记录，便于快速核查。</p>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "patientName", label: "患者" },
              { key: "deptName", label: "科室" },
              { key: "doctorName", label: "医生" },
              { key: "registDate", label: "日期" },
              { key: "visitState", label: "状态" }
            ]}
            rows={dashboard.latestRegistrations}
            emptyText="暂无最新挂号记录。"
          />
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-4">
          <div className="admin-panel-header">
            <div>
              <h3>库存预警</h3>
              <p className="section-copy">基于现有药房库存字段，对低于安全库存的药品进行预警。</p>
            </div>
            <span className={`admin-tag ${dashboard.lowStockItems.length > 0 ? "admin-tag-alert" : "admin-tag-info"}`}>
              {dashboard.lowStockItems.length > 0 ? "需处理" : "正常"}
            </span>
          </div>
          <div className="admin-stock-list">
            {dashboard.lowStockItems.length === 0 ? (
              <p className="muted-copy">当前没有低于安全库存的药品。</p>
            ) : (
              dashboard.lowStockItems.map((item) => (
                <div className="admin-stock-item" key={item.id}>
                  <div>
                    <strong>{item.medicationName}</strong>
                    <p>
                      当前库存 {item.stockQuantity}
                      {item.unit ? ` ${item.unit}` : ""} / 安全库存 {item.safeStock}
                    </p>
                  </div>
                  <span className="admin-stock-item__gap">缺口 {item.shortage}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function buildPanelAgentHistory(messages) {
  return (messages ?? [])
    .filter((item) => item?.role === "user" || item?.role === "assistant")
    .slice(-6)
    .map((item) => ({
      role: item.role,
      content: String(item.text ?? "").trim()
    }))
    .filter((item) => item.content);
}

function createPatientDoctorAgentPayload({ sessionUser, profile, summary, prompt, history }) {
  return {
    agentName: "专属AI医生",
    roleLabel: "患者",
    pageLabel: "患者专属AI问诊",
    pageSummary: summary,
    scope:
      "你只负责患者当前症状咨询、就医建议、导诊方向、就诊准备和沟通整理。你不能回答药房后台、管理员运营、编程写作、天气娱乐等无关问题；如果超出职责，必须明确说“我现在只负责患者问诊与就医咨询，不负责该问题”。你要像豆包那样自然对话，但保持专业和边界感。",
    prompt,
    history
  };
}

function DoctorDashboardCanvas({ sessionUser, actions }) {
  const registrations = (actions.store.registrations ?? []).filter((item) => item.doctorId === sessionUser.doctorId);
  const pendingRows = registrations.filter((item) => Number(item.visitState) === 1);
  const completedRows = registrations.filter((item) => Number(item.visitState) >= 2);
  const consultRows = (actions.store.consultMessages ?? []).filter((item) => item.doctorUserId === sessionUser.id);
  const pendingMessages = consultRows.filter((item) => item.status === "PENDING");
  const recentCompleted = completedRows
    .slice()
    .sort((left, right) => String(right.registDate || "").localeCompare(String(left.registDate || "")))
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      patientName: item.realname || "未登记患者",
      deptName: item.deptName || "-",
      registDate: item.registDate || "-",
      visitState: <span className={`admin-inline-status admin-inline-status-${resolveVisitStateTone(item.visitState)}`}>{formatVisitStateText(item.visitState)}</span>
    }));

  return (
    <div className="stack admin-dashboard-canvas admin-page-stack">
      <section className="section-card admin-dashboard-hero admin-section-card">
        <div className="admin-dashboard-hero__copy">
          <p className="eyebrow">门诊接诊工作台</p>
          <h3>接诊概览</h3>
          <p className="section-copy">集中查看待接诊患者、留言回复、已完成接诊记录与当日业务状态。</p>
        </div>
        <div className="admin-dashboard-hero__summary">
          <div className="admin-dashboard-hero__date">{new Date().toLocaleDateString("zh-CN")}</div>
          <div className="admin-dashboard-hero__snapshot">
            <InfoPair label="所属科室" value={actions.doctors.find((item) => item.doctorId === sessionUser.doctorId)?.deptName || "-"} />
            <InfoPair label="待接诊" value={pendingRows.length} />
            <InfoPair label="待回复留言" value={pendingMessages.length} />
          </div>
        </div>
      </section>

      <section className="admin-report-strip">
        <article className="admin-report-stat"><span>待接诊患者</span><strong>{pendingRows.length}</strong><small>当前排队等待接诊</small></article>
        <article className="admin-report-stat"><span>已完成接诊</span><strong>{completedRows.length}</strong><small>当前账号累计完成接诊</small></article>
        <article className="admin-report-stat"><span>患者留言</span><strong>{consultRows.length}</strong><small>累计收到的患者留言</small></article>
        <article className="admin-report-stat"><span>待回复留言</span><strong>{pendingMessages.length}</strong><small>仍需处理的咨询记录</small></article>
      </section>

      <section className="admin-dashboard-canvas-grid">
        <article className="section-card admin-dashboard-panel admin-section-card admin-span-8">
          <div className="admin-panel-header">
            <div>
              <h3>待接诊患者</h3>
              <p className="section-copy">按挂号日期展示当前待接诊患者，便于快速进入门诊接诊。</p>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "realname", label: "患者" },
              { key: "deptName", label: "科室" },
              { key: "registDate", label: "挂号日期" },
              { key: "visitStateLabel", label: "状态" }
            ]}
            rows={pendingRows.map((item) => ({ ...item, visitStateLabel: "待接诊" }))}
            emptyText="当前没有待接诊患者。"
          />
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-4">
          <div className="admin-panel-header">
            <div>
              <h3>留言处理</h3>
              <p className="section-copy">查看当前待回复留言，保持患者咨询及时闭环。</p>
            </div>
          </div>
          <div className="admin-task-list">
            {pendingMessages.length === 0 ? (
              <p className="muted-copy">当前没有待回复留言。</p>
            ) : (
              pendingMessages.map((item) => (
                <button className="admin-task-item" key={item.id} type="button" onClick={() => actions.setActiveView("messages")}>
                  <div>
                    <strong>{item.patientName}</strong>
                    <p>{item.symptomSummary || "已提交咨询留言"}</p>
                  </div>
                  <div className="admin-task-item__side">
                    <span className="admin-tag admin-tag-warn">待回复</span>
                    <small>进入留言管理</small>
                  </div>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-12">
          <div className="admin-panel-header">
            <div>
              <h3>近期已完成接诊</h3>
              <p className="section-copy">保留近期接诊记录，便于回顾门诊处理情况。</p>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "patientName", label: "患者" },
              { key: "deptName", label: "科室" },
              { key: "registDate", label: "日期" },
              { key: "visitState", label: "状态" }
            ]}
            rows={recentCompleted}
            emptyText="当前没有已完成接诊记录。"
          />
        </article>
      </section>
    </div>
  );
}

function PharmacistDashboardCanvas({ sessionUser, actions }) {
  const pendingRows = (actions.store.registrations ?? []).filter((item) => Number(item.visitState) === 2 && Number(item.purchaseType) === 0);
  const dispensedRows = (actions.store.registrations ?? []).filter((item) => Number(item.visitState) === 3 && Number(item.purchaseType) === 0);
  const inventories = actions.store.medicationInventories ?? [];
  const lowStockItems = inventories.filter((item) => toSafeNumber(item.stockQuantity) <= toSafeNumber(item.safeStock)).slice(0, 8);

  return (
    <div className="stack admin-dashboard-canvas admin-page-stack">
      <section className="section-card admin-dashboard-hero admin-section-card">
        <div className="admin-dashboard-hero__copy">
          <p className="eyebrow">药房业务工作台</p>
          <h3>发药概览</h3>
          <p className="section-copy">集中查看待发药记录、库存预警与近期发药状态，便于药房统一处理。</p>
        </div>
        <div className="admin-dashboard-hero__summary">
          <div className="admin-dashboard-hero__date">{new Date().toLocaleDateString("zh-CN")}</div>
          <div className="admin-dashboard-hero__snapshot">
            <InfoPair label="待发药记录" value={pendingRows.length} />
            <InfoPair label="已发药记录" value={dispensedRows.length} />
            <InfoPair label="库存预警" value={lowStockItems.length} />
          </div>
        </div>
      </section>

      <section className="admin-report-strip">
        <article className="admin-report-stat"><span>待发药</span><strong>{pendingRows.length}</strong><small>当前待药房处理的处方记录</small></article>
        <article className="admin-report-stat"><span>已发药</span><strong>{dispensedRows.length}</strong><small>累计完成发药的业务记录</small></article>
        <article className="admin-report-stat"><span>库存品种</span><strong>{inventories.length}</strong><small>当前纳入药房管理的库存品项</small></article>
        <article className="admin-report-stat"><span>低库存药品</span><strong>{lowStockItems.length}</strong><small>低于安全库存的药品数量</small></article>
      </section>

      <section className="admin-dashboard-canvas-grid">
        <article className="section-card admin-dashboard-panel admin-section-card admin-span-8">
          <div className="admin-panel-header">
            <div>
              <h3>待发药记录</h3>
              <p className="section-copy">当前已完成接诊、待药房发药的业务记录。</p>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "id", label: "病历号" },
              { key: "realname", label: "患者" },
              { key: "doctorName", label: "医生" },
              { key: "registDate", label: "日期" }
            ]}
            rows={pendingRows}
            emptyText="当前没有待发药记录。"
          />
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-4">
          <div className="admin-panel-header">
            <div>
              <h3>库存预警</h3>
              <p className="section-copy">低于安全库存的药品将集中显示在此处。</p>
            </div>
          </div>
          <div className="admin-stock-list">
            {lowStockItems.length === 0 ? (
              <p className="muted-copy">当前库存状态正常。</p>
            ) : (
              lowStockItems.map((item) => (
                <div className="admin-stock-item" key={item.id}>
                  <div>
                    <strong>{item.medicationName}</strong>
                    <p>当前库存 {item.stockQuantity} / 安全库存 {item.safeStock}</p>
                  </div>
                  <span className="admin-stock-item__gap">预警</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function PatientHomeCanvas({ sessionUser, actions }) {
  const plans = (actions.store.medicationPlans ?? []).filter((item) => item.patientUserId === sessionUser.id);
  const registrations = (actions.store.registrations ?? []).filter((item) => item.patientUserId === sessionUser.id);
  const consultRows = (actions.store.consultMessages ?? []).filter((item) => item.patientUserId === sessionUser.id);
  const conflicts = findMedicationConflictsForPlans(plans, actions.store.medicationConflicts ?? [], actions.store.medicationInventories ?? []);
  const dueSoonPlans = plans.filter((item) => isPlanDueSoon(item.nextReminderAt));
  const patientSegments = [
    { label: "服药计划", value: plans.length, color: "#2F80ED" },
    { label: "冲突预警", value: conflicts.length, color: "#E35D5D" },
    { label: "咨询记录", value: consultRows.length, color: "#27B3A6" }
  ];

  return (
    <div className="stack admin-dashboard-canvas admin-page-stack">
      <section className="section-card admin-dashboard-hero admin-section-card">
        <div className="admin-dashboard-hero__copy">
          <p className="eyebrow">患者服务工作台</p>
          <h3>我的首页</h3>
          <p className="section-copy">集中查看挂号、服药提醒、咨询记录与近期就诊信息。</p>
        </div>
        <div className="admin-dashboard-hero__summary">
          <div className="admin-dashboard-hero__date">{new Date().toLocaleDateString("zh-CN")}</div>
          <div className="admin-dashboard-hero__snapshot">
            <InfoPair label="进行中计划" value={plans.filter((item) => item.status !== "COMPLETED").length} />
            <InfoPair label="即将提醒" value={dueSoonPlans.length} />
            <InfoPair label="待回复咨询" value={consultRows.filter((item) => item.status === "PENDING").length} />
          </div>
        </div>
      </section>

      <section className="admin-report-strip">
        <article className="admin-report-stat"><span>挂号记录</span><strong>{registrations.length}</strong><small>累计门诊挂号记录</small></article>
        <article className="admin-report-stat"><span>服药计划</span><strong>{plans.length}</strong><small>当前系统中的服药计划</small></article>
        <article className="admin-report-stat"><span>冲突预警</span><strong>{conflicts.length}</strong><small>存在用药冲突提醒的药物组合</small></article>
        <article className="admin-report-stat"><span>咨询记录</span><strong>{consultRows.length}</strong><small>已提交给医生的咨询留言</small></article>
      </section>

      <section className="admin-dashboard-canvas-grid">
        <article className="section-card admin-dashboard-panel admin-section-card admin-span-8">
          <div className="admin-panel-header">
            <div>
              <h3>当前服药计划</h3>
              <p className="section-copy">显示仍在执行中的服药计划与下一次提醒时间。</p>
            </div>
          </div>
          <div className="admin-stock-list">
            {plans.length === 0 ? (
              <p className="muted-copy">当前没有服药计划。</p>
            ) : (
              plans.slice(0, 6).map((plan) => (
                <div className="admin-stock-item" key={plan.id}>
                  <div>
                    <strong>{plan.medicationName}</strong>
                    <p>{plan.dosage} / {plan.frequencyLabel} / 下次提醒 {formatDateTime(plan.nextReminderAt)}</p>
                  </div>
                  <span className="admin-tag admin-tag-soft">{formatMedicationPlanStatus(plan.status)}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-4">
          <div className="admin-panel-header">
            <div>
              <h3>服务概览</h3>
              <p className="section-copy">显示当前个人服务事项分布，便于快速了解业务状态。</p>
            </div>
          </div>
          <div className="admin-donut-card admin-donut-card-inline">
            <DonutChart items={patientSegments} size={188} />
            <div className="admin-donut-legend admin-donut-legend-inline">
              {patientSegments.map((item) => (
                <div className="admin-donut-legend__item" key={item.label}>
                  <span className="admin-donut-legend__dot" style={{ background: item.color }} />
                  <strong>{item.value}</strong>
                  <small>{item.label}</small>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-12">
          <div className="admin-panel-header">
            <div>
              <h3>近期挂号记录</h3>
              <p className="section-copy">保留近期挂号与就诊状态记录，便于随时查看。</p>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "deptName", label: "科室" },
              { key: "doctorName", label: "医生" },
              { key: "registDate", label: "日期" },
              { key: "visitState", label: "状态" }
            ]}
            rows={registrations.slice(0, 8).map((item) => ({
              ...item,
              visitState: <span className={`admin-inline-status admin-inline-status-${resolveVisitStateTone(item.visitState)}`}>{formatVisitStateText(item.visitState)}</span>
            }))}
            emptyText="当前没有挂号记录。"
          />
        </article>
      </section>
    </div>
  );
}

function AdminDashboardPanel({ sessionUser, actions, stats }) {
  const dashboard = buildAdminDashboardData(actions.store, stats);

  async function handleQuickAction(actionKey, view) {
    if (view) {
      actions.setActiveView(view);
      return;
    }

    if (actionKey === "refresh") {
      try {
        await actions.refreshState();
        actions.showNotice("管理员首页数据已刷新。");
      } catch (error) {
        actions.showNotice(error.message || "刷新首页数据失败。");
      }
    }
  }

  return (
    <div className="stack admin-dashboard-page admin-page-stack">
      <section className="section-card admin-dashboard-hero admin-section-card">
        <div className="admin-dashboard-hero__copy">
          <p className="eyebrow">运营驾驶舱</p>
          <h3>医院运营总览</h3>
          <p className="section-copy">
            集中展示门诊挂号、接诊、发药、库存与协同事项，供管理员统一掌握当日业务状态。
          </p>
          <div className="admin-dashboard-hero__meta">
            <span className="admin-dashboard-pill">{sessionUser.realName} / 管理员</span>
            <span className="admin-dashboard-pill">{dashboard.todayLabel}</span>
            <span className="admin-dashboard-pill">{dashboard.reportDateNote}</span>
          </div>
        </div>
        <div className="admin-dashboard-hero__summary">
          <div className="admin-dashboard-hero__date">{dashboard.calendarLabel}</div>
          <div className="admin-dashboard-hero__snapshot">
            <InfoPair label="在岗医生" value={dashboard.snapshot.doctorCount} />
            <InfoPair label="活跃账号" value={dashboard.snapshot.activeUserCount} />
            <InfoPair label="待处理事项" value={dashboard.snapshot.pendingCount} />
          </div>
        </div>
      </section>

      <section className="admin-kpi-grid">
        {dashboard.summaryCards.map((card) => (
        <article className={`admin-kpi-card admin-kpi-card-${card.tone} admin-section-card`} key={card.title}>
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <p>{card.supporting}</p>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-main">
        <article className="section-card admin-dashboard-panel admin-dashboard-panel-wide admin-section-card">
          <div className="admin-panel-header">
            <div>
              <h3>挂号趋势</h3>
              <p className="section-copy">按近 7 个统计日汇总挂号量，便于观察业务波动情况。</p>
            </div>
            <span className="admin-tag admin-tag-info">近 7 日</span>
          </div>
          <div className="admin-trend-chart">
            {dashboard.trendSeries.map((item) => (
              <div className="admin-trend-chart__item" key={item.date}>
                <span className="admin-trend-chart__value">{item.count}</span>
                <div className="admin-trend-chart__bar-wrap">
                  <div
                    className="admin-trend-chart__bar"
                    style={{ height: `${item.height}%` }}
                    title={`${item.label}：${item.count} 人`}
                  />
                </div>
                <span className="admin-trend-chart__label">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="admin-trend-stats">
            {dashboard.trendStats.map((item) => (
              <div className="admin-trend-stat" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <div className="admin-dashboard-side">
          <article className="section-card admin-dashboard-panel admin-section-card">
            <div className="admin-panel-header">
              <div>
                <h3>科室分布</h3>
                <p className="section-copy">按当前统计日挂号数据汇总，显示各科业务占比。</p>
              </div>
              <span className="admin-tag admin-tag-soft">{dashboard.departmentTotalLabel}</span>
            </div>
            <div className="admin-distribution-list">
              {dashboard.departmentDistribution.length === 0 ? (
                <p className="muted-copy">当前暂无可统计的科室挂号数据。</p>
              ) : (
                dashboard.departmentDistribution.map((item) => (
                  <div className="admin-distribution-item" key={item.name}>
                    <div className="admin-distribution-item__top">
                      <strong>{item.name}</strong>
                      <span>{item.count} 人</span>
                    </div>
                    <div className="admin-distribution-item__track">
                      <div className="admin-distribution-item__fill" style={{ width: `${item.percent}%` }} />
                    </div>
                    <small>{item.percentLabel}</small>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="section-card admin-dashboard-panel admin-section-card">
            <div className="admin-panel-header">
              <div>
                <h3>常用入口</h3>
                <p className="section-copy">保留现有工作台结构，直接进入管理员常用模块。</p>
              </div>
            </div>
            <div className="admin-quick-grid">
              {dashboard.quickActions.map((item) => (
                <button
                  className="admin-quick-card"
                  key={item.title}
                  type="button"
                  onClick={() => handleQuickAction(item.actionKey, item.view)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="admin-dashboard-bottom">
        <article className="section-card admin-dashboard-panel admin-section-card">
          <div className="admin-panel-header">
            <div>
              <h3>待处理事项</h3>
              <p className="section-copy">围绕接诊、发药、留言与库存形成统一待办视图。</p>
            </div>
            <span className="admin-tag admin-tag-warn">{dashboard.pendingItems.length} 项</span>
          </div>
          <div className="admin-task-list">
            {dashboard.pendingItems.map((item) => (
              <button
                className="admin-task-item"
                key={item.title}
                type="button"
                onClick={() => handleQuickAction(item.actionKey, item.view)}
              >
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
                <div className="admin-task-item__side">
                  <span className={`admin-tag ${item.emphasis ? "admin-tag-warn" : "admin-tag-soft"}`}>{item.value}</span>
                  <small>{item.actionLabel}</small>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card">
          <div className="admin-panel-header">
            <div>
              <h3>系统通知</h3>
              <p className="section-copy">基于现有业务数据生成系统提示，用于管理员快速巡检。</p>
            </div>
          </div>
          <div className="admin-notice-list">
            {dashboard.notifications.map((item) => (
              <div className="admin-notice-item" key={item.title}>
                <span className={`admin-tag ${item.level === "alert" ? "admin-tag-alert" : item.level === "warn" ? "admin-tag-warn" : "admin-tag-info"}`}>
                  {item.label}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card">
          <div className="admin-panel-header">
            <div>
              <h3>最新挂号记录</h3>
              <p className="section-copy">按挂号日期倒序展示最近业务记录，便于快速核查。</p>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "patientName", label: "患者" },
              { key: "deptName", label: "科室" },
              { key: "doctorName", label: "医生" },
              { key: "registDate", label: "日期" },
              { key: "visitState", label: "状态" }
            ]}
            rows={dashboard.latestRegistrations}
            emptyText="暂无最新挂号记录。"
          />
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card">
          <div className="admin-panel-header">
            <div>
              <h3>库存预警</h3>
              <p className="section-copy">沿用现有药房库存字段，对低于安全库存的药品发出告警。</p>
            </div>
            <span className={`admin-tag ${dashboard.lowStockItems.length > 0 ? "admin-tag-alert" : "admin-tag-info"}`}>
              {dashboard.lowStockItems.length > 0 ? "需处理" : "正常"}
            </span>
          </div>
          <div className="admin-stock-list">
            {dashboard.lowStockItems.length === 0 ? (
              <p className="muted-copy">当前没有低于安全库存的药品。</p>
            ) : (
              dashboard.lowStockItems.map((item) => (
                <div className="admin-stock-item" key={item.id}>
                  <div>
                    <strong>{item.medicationName}</strong>
                    <p>
                      当前库存 {item.stockQuantity}
                      {item.unit ? ` ${item.unit}` : ""} / 安全库存 {item.safeStock}
                    </p>
                  </div>
                  <span className="admin-stock-item__gap">缺口 {item.shortage}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function PatientDoctorWidget({ sessionUser, profile, actions }) {
  const initialPosition = () => {
    if (typeof window === "undefined") {
      return { x: 24, y: 420 };
    }
    return {
      x: Math.max(window.innerWidth - 132, 16),
      y: Math.max(window.innerHeight - 180, 120)
    };
  };

  const dragState = useRef({ dragging: false, moved: false, offsetX: 0, offsetY: 0 });
  const [position, setPosition] = useState(initialPosition);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "我是专属AI医生，当前只负责患者问诊与就医咨询。你可以直接描述症状、持续时间、是否发热疼痛，或让我帮你整理该怎么向医生提问；如果问题超出这个范围，我会明确告诉你。"
    }
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleMove(event) {
      if (!dragState.current.dragging) {
        return;
      }
      const nextX = Math.min(
        Math.max(event.clientX - dragState.current.offsetX, 12),
        window.innerWidth - 96
      );
      const nextY = Math.min(
        Math.max(event.clientY - dragState.current.offsetY, 88),
        window.innerHeight - 112
      );
      dragState.current.moved = true;
      setPosition({ x: nextX, y: nextY });
    }

    function handleUp() {
      dragState.current.dragging = false;
      window.setTimeout(() => {
        dragState.current.moved = false;
      }, 0);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  function beginDrag(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    dragState.current.dragging = true;
    dragState.current.moved = false;
    dragState.current.offsetX = event.clientX - rect.left;
    dragState.current.offsetY = event.clientY - rect.top;
  }

  function toggleChat() {
    if (dragState.current.moved) {
      return;
    }
    setIsChatOpen((current) => !current);
  }

  async function ask() {
    const question = draft.trim();
    if (!question) {
      actions.showNotice("请先输入想咨询的问题。");
      return;
    }
    const nextMessages = [...messages, { id: `user-${Date.now()}`, role: "user", text: question }];
    setMessages(nextMessages);
    setDraft("");

    try {
      setLoading(true);
      const result = await actions.requestAgentChat(
        createPatientDoctorAgentPayload({
          sessionUser,
          profile,
          summary: `当前患者：${sessionUser.realName}；性别：${profile?.gender ?? "-"}；年龄：${profile?.age ?? "-"}；手机号：${profile?.phoneNumber || sessionUser.phoneNumber || "-"}。请优先围绕症状咨询、挂号建议、就诊准备和医患沟通整理作答。`,
          prompt: question,
          history: buildPanelAgentHistory(nextMessages)
        })
      );
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: String(result?.reply ?? "").trim() || "我现在只负责患者问诊与就医咨询，这次没有拿到有效回复，请换个更具体的问题试试。"
        }
      ]);
    } catch (error) {
      actions.showNotice(error.message || "专属AI医生暂时无法回复。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="floating-doctor"
        onClick={toggleChat}
        onMouseDown={beginDrag}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        type="button"
      >
        <span className="floating-doctor-glow" />
        <span className="floating-doctor-head" />
        <span className="floating-doctor-body" />
        <span className="floating-doctor-heart" />
      </button>
      {isChatOpen ? (
        <section className="floating-chat-panel">
          <div className="floating-chat-header">
            <div>
              <p className="eyebrow">数字人医生</p>
              <h3>专属AI医生</h3>
            </div>
            <button className="ghost-button" type="button" onClick={() => setIsChatOpen(false)}>
              收起
            </button>
          </div>
          <div className="info-grid">
            <InfoPair label="患者" value={sessionUser.realName} />
            <InfoPair label="登录手机号" value={profile?.phoneNumber || sessionUser.phoneNumber || "-"} />
            <InfoPair label="年龄" value={profile?.age ?? "-"} />
          </div>
          <div className="digital-chat-messages floating-chat-messages">
            {messages.map((item) => (
              <div
                className={
                  item.role === "assistant"
                    ? "digital-chat-message digital-chat-message-assistant"
                    : "digital-chat-message digital-chat-message-user"
                }
                key={item.id}
              >
                <span className="digital-chat-role">
                  {item.role === "assistant" ? "专属AI医生" : "我"}
                </span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
          <label>
            对数字人说点什么
            <textarea
              rows="3"
              placeholder="例如：我最近睡不好、头晕，应该先做什么检查？"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <button className="primary-button" disabled={loading} type="button" onClick={ask}>
            {loading ? "专属AI医生回复中..." : "发送"}
          </button>
        </section>
      ) : null}
    </>
  );
}

function AboutPanel({ actions }) {
  return <ProjectShowcase onNavigate={actions.setActiveView} />;
}

function PatientMedicationPanel({ sessionUser, actions }) {
  const plans = (actions.store.medicationPlans ?? [])
    .filter((item) => item.patientUserId === sessionUser.id)
    .sort((left, right) => String(left.nextReminderAt || "").localeCompare(String(right.nextReminderAt || "")));
  const checkIns = (actions.store.medicationCheckIns ?? [])
    .filter((item) => item.patientUserId === sessionUser.id)
    .sort((left, right) => String(right.checkedInAt || "").localeCompare(String(left.checkedInAt || "")));
  const inventories = actions.store.medicationInventories ?? [];
  const conflicts = findMedicationConflictsForPlans(plans, actions.store.medicationConflicts ?? [], inventories);
  const activePlans = plans.filter((item) => item.status !== "COMPLETED");
  const dueSoonPlans = plans.filter((item) => isPlanDueSoon(item.nextReminderAt));

  async function checkIn(plan) {
    try {
      await actions.checkInMedication(plan.id);
      actions.showNotice(`已完成 ${plan.medicationName} 的服药打卡。`);
    } catch (error) {
      actions.showNotice(error.message || "服药打卡失败。");
    }
  }

  return (
    <div className="stack admin-page-stack">
      <section className="section-card medication-hero-card">
        <div className="section-heading-inline">
          <div>
            <p className="eyebrow">用药管家</p>
            <h3>服药提醒、冲突预警与打卡进度</h3>
            <p className="section-copy">系统会依据当前处方计划和冲突规则，给出更清晰的患者侧提醒。</p>
          </div>
        </div>
        <div className="info-grid">
          <InfoPair label="进行中计划" value={activePlans.length} />
          <InfoPair label="即将提醒" value={dueSoonPlans.length} />
          <InfoPair label="冲突预警" value={conflicts.length} />
          <InfoPair label="今日打卡" value={checkIns.filter((item) => isSameDay(item.checkedInAt)).length} />
        </div>
      </section>

      {conflicts.length > 0 ? (
        <section className="section-card warning-section workspace-scroll-card">
          <h3>药物冲突提醒</h3>
          <div className="warning-grid">
            {conflicts.map((conflict) => (
              <article className="warning-card" key={conflict.id}>
                <span className="warning-card__level">{conflict.severity || "提醒"}</span>
                <strong>
                  {conflict.leftMedicationName} + {conflict.rightMedicationName}
                </strong>
                <p>{conflict.guidance || "建议由医生或药师进一步确认联合用药风险。"}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-card workspace-scroll-card">
        <h3>当前服药计划</h3>
        {plans.length === 0 ? (
          <p className="muted-copy">当前没有服药计划。医生保存处方后，系统会自动在这里生成提醒卡片。</p>
        ) : (
          <div className="medication-plan-grid">
            {plans.map((plan) => (
              <article className={isPlanDueSoon(plan.nextReminderAt) ? "medication-plan-card medication-plan-card-due" : "medication-plan-card"} key={plan.id}>
                <div className="medication-plan-card__header">
                  <div>
                    <span className="medication-plan-card__eyebrow">{formatMedicationPlanStatus(plan.status)}</span>
                    <h4>{plan.medicationName}</h4>
                  </div>
                  <span className="status-chip">{plan.frequencyLabel}</span>
                </div>
                <div className="info-grid">
                  <InfoPair label="剂量" value={plan.dosage} />
                  <InfoPair label="数量" value={`${plan.quantity}${plan.unit || "盒"}`} />
                  <InfoPair label="下次提醒" value={formatDateTime(plan.nextReminderAt)} />
                  <InfoPair label="最近打卡" value={formatDateTime(plan.lastCheckedInAt)} />
                </div>
                <p className="section-copy">{plan.instructions || "按医嘱服用，若出现不适请及时联系医生。"}</p>
                <div className="inline-actions">
                  <button
                    className="primary-button"
                    disabled={plan.status === "PENDING_PICKUP"}
                    type="button"
                    onClick={() => checkIn(plan)}
                  >
                    {plan.status === "PENDING_PICKUP" ? "待取药" : "服药打卡"}
                  </button>
                  <button className="ghost-button" type="button" onClick={() => actions.setActiveView("consult")}>
                    有疑问去留言
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section-card workspace-scroll-card">
        <h3>服药打卡记录</h3>
        <DataTable
          columns={[
            { key: "medicationName", label: "药物" },
            { key: "statusLabel", label: "状态" },
            { key: "checkedInAtLabel", label: "打卡时间" },
            { key: "note", label: "备注" }
          ]}
          rows={checkIns.map((item) => ({
            ...item,
            checkedInAtLabel: formatDateTime(item.checkedInAt),
            statusLabel: item.status === "TAKEN" ? "已服用" : item.status || "-"
          }))}
          emptyText="暂无服药打卡记录。"
        />
      </section>
    </div>
  );
}

function RegistrationPanel({ sessionUser, actions }) {
  const isPatient = sessionUser.roleCode === "PATIENT";
  const profile = actions.store.patientProfiles.find((item) => item.userId === sessionUser.id);
  const [form, setForm] = useState({
    realname: profile?.patientName || sessionUser.realName || "",
    gender: profile?.gender || "女",
    birthdate: profile?.birthdate || "1995-01-01",
    cardNumber: profile?.cardNumber || "",
    homeAddress: profile?.homeAddress || "",
    deptName: DEPARTMENTS[0],
    registLevel: REGIST_LEVELS[0],
    doctorId: actions.doctors[0]?.doctorId ?? "",
    isBook: "否",
    registDate: getTodayDateString(),
    receipts: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const age = calculateAge(form.birthdate);
  const doctors = actions.doctors.filter(
    (doctor) => doctor.enabled && doctor.deptName === form.deptName && doctor.registLevel === form.registLevel
  );
  const currentDoctor = doctors.find((doctor) => doctor.doctorId === form.doctorId) ?? doctors[0] ?? null;
  const fee = toSafeNumber(currentDoctor?.registFee) + (form.isBook === "是" ? 1 : 0);

  useEffect(() => {
    if (doctors.length > 0 && !doctors.some((item) => item.doctorId === form.doctorId)) {
      setForm((current) => ({ ...current, doctorId: doctors[0].doctorId }));
    }
  }, [doctors, form.doctorId]);

  async function submit(event) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    if (!currentDoctor) {
      actions.showNotice("当前筛选条件下没有可挂号医生。");
      return;
    }
    if (!/^\d{17}[\dXx]$/.test(form.cardNumber)) {
      actions.showNotice("请确认身份证号格式正确。");
      return;
    }
    if (!isPatient && !isNonNegativeAmount(form.receipts)) {
      actions.showNotice("请输入正确的实收金额。");
      return;
    }

    try {
      setIsSubmitting(true);
      await actions.createRegistration({
        patientUserId: isPatient ? sessionUser.id : null,
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
      });
      actions.showNotice(isPatient ? `挂号已提交，挂号费 ${formatCurrency(fee)}。` : "挂号成功。");
    } catch (error) {
      actions.showNotice(error.message || "挂号失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section-card">
      <h3>{isPatient ? "我的挂号" : "现场挂号"}</h3>
      <form className="stacked-form" onSubmit={submit}>
        <div className="field-grid field-grid-3">
          <label>患者姓名<input value={form.realname} onChange={(event) => setForm((current) => ({ ...current, realname: event.target.value }))} /></label>
          <label>性别<select value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}><option value="女">女</option><option value="男">男</option></select></label>
          <label>出生日期<input type="date" value={form.birthdate} onChange={(event) => setForm((current) => ({ ...current, birthdate: event.target.value }))} /></label>
          <label>年龄<input readOnly value={age} /></label>
          <label>身份证号<input value={form.cardNumber} onChange={(event) => setForm((current) => ({ ...current, cardNumber: event.target.value }))} /></label>
          <label>挂号日期<input type="date" value={form.registDate} onChange={(event) => setForm((current) => ({ ...current, registDate: event.target.value }))} /></label>
        </div>
        <label>家庭住址<textarea rows="3" value={form.homeAddress} onChange={(event) => setForm((current) => ({ ...current, homeAddress: event.target.value }))} /></label>
        <div className="field-grid field-grid-4">
          <label>科室<select value={form.deptName} onChange={(event) => setForm((current) => ({ ...current, deptName: event.target.value }))}>{DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>号别<select value={form.registLevel} onChange={(event) => setForm((current) => ({ ...current, registLevel: event.target.value }))}>{REGIST_LEVELS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>医生<select value={currentDoctor?.doctorId ?? ""} onChange={(event) => setForm((current) => ({ ...current, doctorId: event.target.value }))}>{doctors.map((item) => <option key={item.doctorId} value={item.doctorId}>{item.realName}</option>)}</select></label>
          <label>病历本<select value={form.isBook} onChange={(event) => setForm((current) => ({ ...current, isBook: event.target.value }))}><option value="否">否</option><option value="是">是</option></select></label>
          {isPatient ? <label>挂号费用<input readOnly value={formatCurrency(fee)} /></label> : <label>实收<input value={form.receipts} onChange={(event) => setForm((current) => ({ ...current, receipts: event.target.value }))} /></label>}
        </div>
        <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? "正在提交..." : "确认挂号"}</button>
      </form>
    </section>
  );
}

function CancelRegistrationPanel({ sessionUser, actions }) {
  const isPatient = sessionUser.roleCode === "PATIENT";
  const rows = actions.store.registrations
    .filter((item) => !isPatient || item.patientUserId === sessionUser.id)
    .sort((left, right) => String(right.registDate || "").localeCompare(String(left.registDate || "")));

  async function cancelRecord(record) {
    if (record.visitState !== 1) {
      actions.showNotice("仅待就诊记录允许退号。");
      return;
    }
    try {
      await actions.cancelRegistration(record.id);
      actions.showNotice(`病历号 ${record.id} 已退号。`);
    } catch (error) {
      actions.showNotice(error.message || "退号失败。");
    }
  }

  return (
    <section className="section-card">
      <h3>退号管理</h3>
      <DataTable
        columns={[
          { key: "id", label: "病历号" },
          { key: "deptName", label: "科室" },
          { key: "doctorName", label: "医生" },
          { key: "registDate", label: "挂号日期" },
          { key: "visitStateLabel", label: "状态" },
          { key: "action", label: "操作" }
        ]}
        rows={rows.map((item) => ({
          ...item,
          visitStateLabel: VISIT_STATE_LABELS[item.visitState] || "-",
          action: item.visitState === 1 ? <button className="tiny-button" type="button" onClick={() => cancelRecord(item)}>退号</button> : <span>不可退号</span>
        }))}
        emptyText="暂无挂号记录。"
      />
    </section>
  );
}

function RegistrationAiPanel({ actions }) {
  const [symptomSummary, setSymptomSummary] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function askAi() {
    if (!symptomSummary.trim()) {
      actions.showNotice("请先输入症状摘要。");
      return;
    }
    try {
      setLoading(true);
      setResult(await actions.requestRegistrationAi({ patientName: "", gender: "女", age: "28", symptomSummary }));
    } catch (error) {
      actions.showNotice(error.message || "AI 分诊失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section-card">
      <h3>AI 挂号分诊</h3>
      <label>症状摘要<textarea rows="5" value={symptomSummary} onChange={(event) => setSymptomSummary(event.target.value)} /></label>
      <button className="secondary-button" disabled={loading} type="button" onClick={askAi}>{loading ? "正在分析..." : "生成 AI 推荐"}</button>
      {result ? <div className="ai-result"><InfoPair label="推荐科室" value={result.primary || "-"} /><InfoPair label="推荐医生" value={result.secondary || "-"} /><InfoPair label="就诊建议" value={result.tertiary || "-"} /><InfoPair label="风险提醒" value={result.risk || "-"} /></div> : null}
    </section>
  );
}

function RecordSearchPanel({ actions }) {
  const [keyword, setKeyword] = useState("");
  const rows = actions.store.registrations.filter((item) => {
    const text = keyword.trim();
    return !text || String(item.cardNumber || "").includes(text) || String(item.realname || "").includes(text);
  });

  return (
    <section className="section-card">
      <h3>病历查询</h3>
      <div className="inline-search">
        <input placeholder="输入姓名或身份证号" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
      </div>
      <DataTable
        columns={[
          { key: "id", label: "病历号" },
          { key: "realname", label: "患者" },
          { key: "deptName", label: "科室" },
          { key: "doctorName", label: "医生" },
          { key: "registDate", label: "挂号日期" }
        ]}
        rows={rows}
        emptyText="暂无匹配记录。"
      />
    </section>
  );
}

function LegacyStatisticsPanel({ actions }) {
  const stats = buildOverview(actions.store.registrations ?? []);
  const departmentRows = DEPARTMENTS.map((deptName) => {
    const rows = actions.store.registrations.filter((item) => item.deptName === deptName);
    return {
      deptName,
      total: rows.length,
      waiting: rows.filter((item) => item.visitState === 1).length,
      visited: rows.filter((item) => item.visitState >= 2).length,
      dispensed: rows.filter((item) => item.visitState === 3 && Number(item.purchaseType) === 0).length
    };
  }).filter((item) => item.total > 0);

  const totals = {
    departmentCount: departmentRows.length,
    waiting: departmentRows.reduce((sum, item) => sum + item.waiting, 0),
    visited: departmentRows.reduce((sum, item) => sum + item.visited, 0),
    dispensed: departmentRows.reduce((sum, item) => sum + item.dispensed, 0)
  };

  return (
    <div className="stack admin-page-stack">
      <section className="section-card admin-section-card admin-simple-hero">
        <div>
          <p className="eyebrow">operations statistics</p>
          <h3>业务统计分析</h3>
          <p className="section-copy">按科室汇总挂号、待就诊、已就诊与发药记录，用于日常运营分析。</p>
        </div>
        <div className="admin-summary-inline">
          <InfoPair label="科室数量" value={totals.departmentCount} />
          <InfoPair label="累计挂号" value={stats.totalRegistrations} />
          <InfoPair label="累计收入" value={formatCurrency(stats.totalIncome)} />
        </div>
      </section>

      <section className="admin-kpi-grid admin-kpi-grid-compact">
        <article className="admin-kpi-card admin-kpi-card-blue admin-section-card">
          <span>待就诊</span>
          <strong>{totals.waiting}</strong>
          <p>当前仍处于待接诊状态的挂号记录</p>
        </article>
        <article className="admin-kpi-card admin-kpi-card-teal admin-section-card">
          <span>已就诊</span>
          <strong>{totals.visited}</strong>
          <p>已完成接诊流程的业务记录</p>
        </article>
        <article className="admin-kpi-card admin-kpi-card-cyan admin-section-card">
          <span>已发药</span>
          <strong>{totals.dispensed}</strong>
          <p>已完成药房发药的业务记录</p>
        </article>
        <article className="admin-kpi-card admin-kpi-card-green admin-section-card">
          <span>统计范围</span>
          <strong>{departmentRows.length}</strong>
          <p>当前存在业务数据的科室数量</p>
        </article>
      </section>

      <section className="section-card admin-section-card admin-dashboard-panel">
        <div className="admin-panel-header">
          <div>
            <h3>科室业务明细</h3>
            <p className="section-copy">按科室统计挂号、待就诊、已就诊及发药数据。</p>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "deptName", label: "科室" },
            { key: "total", label: "挂号量" },
            { key: "waiting", label: "待就诊" },
            { key: "visited", label: "已就诊" },
            { key: "dispensed", label: "已发药" }
          ]}
          rows={departmentRows}
          emptyText="暂无统计数据。"
        />
      </section>
    </div>
  );
}

function LegacyStatisticsPanelReport({ actions }) {
  const registrations = actions.store.registrations ?? [];
  const [filters, setFilters] = useState({ dateRange: "7", deptName: "ALL", visitState: "ALL" });
  const availableDates = useMemo(
    () => [...new Set(registrations.map((item) => normalizeDateKey(item.registDate)).filter(Boolean))].sort(),
    [registrations]
  );
  const reportDate = availableDates[availableDates.length - 1] || getTodayDateString();
  const filteredRegistrations = useMemo(
    () =>
      registrations.filter((item) => {
        const dateMatched = matchAdminDateRange(item.registDate, reportDate, filters.dateRange);
        const deptMatched = filters.deptName === "ALL" || item.deptName === filters.deptName;
        const statusMatched = filters.visitState === "ALL" || String(item.visitState) === filters.visitState;
        return dateMatched && deptMatched && statusMatched;
      }),
    [filters.dateRange, filters.deptName, filters.visitState, registrations, reportDate]
  );
  const overview = buildOverview(filteredRegistrations);
  const departmentRows = useMemo(() => buildAdminDepartmentRows(filteredRegistrations), [filteredRegistrations]);
  const trendSeries = useMemo(() => buildAdminTrendSeries(filteredRegistrations, reportDate, 7), [filteredRegistrations, reportDate]);
  const rankRows = departmentRows.slice(0, 6);
  const totals = {
    departmentCount: departmentRows.length,
    waiting: departmentRows.reduce((sum, item) => sum + item.waiting, 0),
    visited: departmentRows.reduce((sum, item) => sum + item.visited, 0),
    dispensed: departmentRows.reduce((sum, item) => sum + item.dispensed, 0)
  };
  const filterSummary = [
    filters.dateRange === "ALL" ? "全部业务日期" : `近 ${filters.dateRange} 日`,
    filters.deptName === "ALL" ? "全部科室" : filters.deptName,
    filters.visitState === "ALL" ? "全部状态" : formatVisitStateText(filters.visitState)
  ].join(" / ");

  return (
    <div className="stack admin-page-stack">
      <section className="section-card admin-section-card admin-simple-hero">
        <div>
          <p className="eyebrow">数据分析中心</p>
          <h3>业务统计分析</h3>
          <p className="section-copy">按业务日期、科室与就诊状态汇总门诊运行数据，用于日常统计分析与管理核查。</p>
        </div>
        <div className="admin-summary-inline">
          <InfoPair label="统计基准日" value={reportDate} />
          <InfoPair label="纳入统计科室" value={totals.departmentCount} />
          <InfoPair label="统计收入" value={formatCurrency(overview.totalIncome)} />
        </div>
      </section>

      <section className="section-card admin-section-card admin-toolbar-card">
        <div className="admin-toolbar-copy">
          <strong>筛选条件</strong>
          <span>{filterSummary}</span>
        </div>
        <div className="admin-filter-grid">
          <label>
            日期范围
            <select value={filters.dateRange} onChange={(event) => setFilters((current) => ({ ...current, dateRange: event.target.value }))}>
              <option value="7">近 7 日</option>
              <option value="30">近 30 日</option>
              <option value="ALL">全部日期</option>
            </select>
          </label>
          <label>
            科室筛选
            <select value={filters.deptName} onChange={(event) => setFilters((current) => ({ ...current, deptName: event.target.value }))}>
              <option value="ALL">全部科室</option>
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            状态筛选
            <select value={filters.visitState} onChange={(event) => setFilters((current) => ({ ...current, visitState: event.target.value }))}>
              <option value="ALL">全部状态</option>
              <option value="1">待就诊</option>
              <option value="2">已就诊</option>
              <option value="3">已发药</option>
            </select>
          </label>
        </div>
      </section>

      <section className="admin-kpi-grid admin-kpi-grid-compact">
        <article className="admin-kpi-card admin-kpi-card-blue admin-section-card">
          <span>挂号统计</span>
          <strong>{overview.totalRegistrations}</strong>
          <p>当前筛选条件下的挂号记录总量</p>
        </article>
        <article className="admin-kpi-card admin-kpi-card-teal admin-section-card">
          <span>接诊统计</span>
          <strong>{totals.visited}</strong>
          <p>已完成门诊接诊流程的业务记录</p>
        </article>
        <article className="admin-kpi-card admin-kpi-card-cyan admin-section-card">
          <span>发药统计</span>
          <strong>{totals.dispensed}</strong>
          <p>已完成药房发药的业务记录</p>
        </article>
        <article className="admin-kpi-card admin-kpi-card-green admin-section-card">
          <span>收入统计</span>
          <strong>{formatCurrency(overview.totalIncome)}</strong>
          <p>当前统计范围内的门诊业务收入</p>
        </article>
      </section>

      <section className="admin-dashboard-main admin-analytics-grid">
        <article className="section-card admin-dashboard-panel admin-section-card">
          <div className="admin-panel-header">
            <div>
              <h3>近 7 日挂号趋势</h3>
              <p className="section-copy">按登记日期汇总近 7 日挂号量，便于查看业务波动趋势。</p>
            </div>
            <span className="admin-tag admin-tag-info">趋势分析</span>
          </div>
          <div className="admin-trend-chart">
            {trendSeries.map((item) => (
              <div className="admin-trend-chart__item" key={item.date}>
                <span className="admin-trend-chart__value">{item.count}</span>
                <div className="admin-trend-chart__bar-wrap">
                  <div className="admin-trend-chart__bar" style={{ height: `${item.height}%` }} title={`${item.label}：${item.count} 人次`} />
                </div>
                <span className="admin-trend-chart__label">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="admin-trend-stats">
            <div className="admin-trend-stat">
              <span>待就诊记录</span>
              <strong>{totals.waiting}</strong>
            </div>
            <div className="admin-trend-stat">
              <span>已完成接诊</span>
              <strong>{totals.visited}</strong>
            </div>
            <div className="admin-trend-stat">
              <span>已完成发药</span>
              <strong>{totals.dispensed}</strong>
            </div>
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card">
          <div className="admin-panel-header">
            <div>
              <h3>科室挂号排行</h3>
              <p className="section-copy">按当前筛选条件统计各科室挂号量，展示主要业务科室分布。</p>
            </div>
            <span className="admin-tag admin-tag-soft">排行</span>
          </div>
          <div className="admin-rank-list">
            {rankRows.length === 0 ? (
              <p className="muted-copy">当前筛选条件下暂无可展示的科室统计数据。</p>
            ) : (
              rankRows.map((item, index) => (
                <div className="admin-rank-item" key={item.deptName}>
                  <div className="admin-rank-item__top">
                    <span className="admin-rank-index">{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item.deptName}</strong>
                    <span>{item.total} 人次</span>
                  </div>
                  <div className="admin-rank-item__track">
                    <div className="admin-rank-item__fill" style={{ width: `${item.ratio}%` }} />
                  </div>
                  <small>已就诊 {item.visited} 人次 / 已发药 {item.dispensed} 人次</small>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="section-card admin-section-card admin-dashboard-panel">
        <div className="admin-panel-header">
          <div>
            <h3>科室业务明细</h3>
            <p className="section-copy">保留门诊业务明细表，集中查看各科室挂号、接诊、发药与收入统计。</p>
          </div>
          <span className="admin-tag admin-tag-soft">{departmentRows.length} 个科室</span>
        </div>
        <DataTable
          columns={[
            { key: "deptName", label: "科室" },
            { key: "total", label: "挂号量" },
            { key: "waiting", label: "待就诊" },
            { key: "visited", label: "已就诊" },
            { key: "dispensed", label: "已发药" },
            { key: "income", label: "收入" },
            { key: "completionRate", label: "接诊完成率" }
          ]}
          rows={departmentRows}
          emptyText="当前筛选条件下暂无统计数据。"
        />
      </section>

      <section className="section-card admin-section-card admin-dashboard-panel">
        <div className="admin-panel-header">
          <div>
            <h3>统计分析说明</h3>
            <p className="section-copy">当前页面优先复用现有挂号与就诊数据结构，筛选区与排行区均基于现有业务记录实时聚合。</p>
          </div>
        </div>
        <div className="admin-note-block">
          <span className="admin-inline-status admin-inline-status-progress">说明</span>
          <p>如后续补充独立统计接口，可继续替换当前聚合逻辑，无需调整页面结构。</p>
        </div>
      </section>
    </div>
  );
}

function StatisticsPanel({ actions }) {
  const registrations = actions.store.registrations ?? [];
  const [filters, setFilters] = useState({ dateRange: "7", deptName: "ALL", visitState: "ALL" });
  const availableDates = useMemo(
    () => [...new Set(registrations.map((item) => normalizeDateKey(item.registDate)).filter(Boolean))].sort(),
    [registrations]
  );
  const reportDate = availableDates[availableDates.length - 1] || getTodayDateString();
  const filteredRegistrations = useMemo(
    () =>
      registrations.filter((item) => {
        const dateMatched = matchAdminDateRange(item.registDate, reportDate, filters.dateRange);
        const deptMatched = filters.deptName === "ALL" || item.deptName === filters.deptName;
        const statusMatched = filters.visitState === "ALL" || String(item.visitState) === filters.visitState;
        return dateMatched && deptMatched && statusMatched;
      }),
    [filters.dateRange, filters.deptName, filters.visitState, registrations, reportDate]
  );
  const overview = buildOverview(filteredRegistrations);
  const departmentRows = useMemo(() => buildAdminDepartmentRows(filteredRegistrations), [filteredRegistrations]);
  const doctorRows = useMemo(() => {
    const doctorMap = filteredRegistrations.reduce((accumulator, item) => {
      const key = item.doctorName || "未分配医生";
      if (!accumulator[key]) {
        accumulator[key] = { doctorName: key, deptName: item.deptName || "-", total: 0, visited: 0 };
      }
      accumulator[key].total += 1;
      if (Number(item.visitState) >= 2) {
        accumulator[key].visited += 1;
      }
      return accumulator;
    }, {});

    return Object.values(doctorMap)
      .sort((left, right) => right.total - left.total)
      .slice(0, 6);
  }, [filteredRegistrations]);
  const reportRows = useMemo(
    () =>
      filteredRegistrations
        .slice()
        .sort((left, right) => {
          const dateCompare = String(right.registDate || "").localeCompare(String(left.registDate || ""));
          if (dateCompare !== 0) {
            return dateCompare;
          }
          return toSafeNumber(right.id) - toSafeNumber(left.id);
        })
        .slice(0, 12)
        .map((item) => ({
          id: item.id,
          patientName: item.realname || "未登记患者",
          deptName: item.deptName || "-",
          doctorName: item.doctorName || "-",
          registDate: item.registDate || "-",
          visitState: (
            <span className={`admin-inline-status admin-inline-status-${resolveVisitStateTone(item.visitState)}`}>
              {formatVisitStateText(item.visitState)}
            </span>
          ),
          income: formatCurrency(toSafeNumber(item.registfee) + (Number(item.purchaseType) === 0 ? toSafeNumber(item.drugPrice) : 0))
        })),
    [filteredRegistrations]
  );
  const filterSummary = [
    filters.dateRange === "ALL" ? "全部业务日期" : `近 ${filters.dateRange} 日`,
    filters.deptName === "ALL" ? "全部科室" : filters.deptName,
    filters.visitState === "ALL" ? "全部状态" : formatVisitStateText(filters.visitState)
  ].join(" / ");

  return (
    <div className="stack admin-page-stack admin-report-page">
      <section className="section-card admin-section-card admin-simple-hero">
        <div>
          <p className="eyebrow">报表中心</p>
          <h3>业务报表</h3>
          <p className="section-copy">集中查看筛选结果、科室统计、医生工作量与业务明细记录，用于统计核查与报表检索。</p>
        </div>
        <div className="admin-summary-inline">
          <InfoPair label="统计基准日" value={reportDate} />
          <InfoPair label="筛选记录数" value={filteredRegistrations.length} />
          <InfoPair label="统计收入" value={formatCurrency(overview.totalIncome)} />
        </div>
      </section>

      <section className="section-card admin-section-card admin-toolbar-card">
        <div className="admin-toolbar-copy">
          <strong>筛选条件</strong>
          <span>{filterSummary}</span>
        </div>
        <div className="admin-filter-grid">
          <label>
            日期范围
            <select value={filters.dateRange} onChange={(event) => setFilters((current) => ({ ...current, dateRange: event.target.value }))}>
              <option value="7">近 7 日</option>
              <option value="30">近 30 日</option>
              <option value="ALL">全部日期</option>
            </select>
          </label>
          <label>
            科室筛选
            <select value={filters.deptName} onChange={(event) => setFilters((current) => ({ ...current, deptName: event.target.value }))}>
              <option value="ALL">全部科室</option>
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            状态筛选
            <select value={filters.visitState} onChange={(event) => setFilters((current) => ({ ...current, visitState: event.target.value }))}>
              <option value="ALL">全部状态</option>
              <option value="1">待就诊</option>
              <option value="2">已就诊</option>
              <option value="3">已发药</option>
            </select>
          </label>
        </div>
      </section>

      <section className="admin-report-strip">
        <article className="admin-report-stat">
          <span>挂号记录</span>
          <strong>{overview.totalRegistrations}</strong>
          <small>当前筛选范围内的挂号总量</small>
        </article>
        <article className="admin-report-stat">
          <span>已完成接诊</span>
          <strong>{filteredRegistrations.filter((item) => Number(item.visitState) >= 2).length}</strong>
          <small>已完成门诊接诊的业务记录</small>
        </article>
        <article className="admin-report-stat">
          <span>已完成发药</span>
          <strong>{filteredRegistrations.filter((item) => Number(item.visitState) === 3 && Number(item.purchaseType) === 0).length}</strong>
          <small>已流转至药房并完成发药</small>
        </article>
        <article className="admin-report-stat">
          <span>纳入科室</span>
          <strong>{departmentRows.length}</strong>
          <small>当前筛选条件下有业务记录的科室</small>
        </article>
      </section>

      <section className="admin-report-layout">
        <article className="section-card admin-section-card admin-dashboard-panel admin-report-panel">
          <div className="admin-panel-header">
            <div>
              <h3>科室统计报表</h3>
              <p className="section-copy">按科室汇总挂号、接诊、发药、收入与接诊完成率。</p>
            </div>
            <span className="admin-tag admin-tag-soft">{departmentRows.length} 个科室</span>
          </div>
          <DataTable
            columns={[
              { key: "deptName", label: "科室" },
              { key: "total", label: "挂号量" },
              { key: "waiting", label: "待就诊" },
              { key: "visited", label: "已就诊" },
              { key: "dispensed", label: "已发药" },
              { key: "income", label: "收入" },
              { key: "completionRate", label: "接诊完成率" }
            ]}
            rows={departmentRows}
            emptyText="当前筛选条件下暂无科室统计数据。"
          />
        </article>

        <article className="section-card admin-section-card admin-dashboard-panel admin-report-panel admin-report-side">
          <div className="admin-panel-header">
            <div>
              <h3>医生工作量排行</h3>
              <p className="section-copy">按当前筛选结果统计医生接诊业务量。</p>
            </div>
          </div>
          <div className="admin-rank-list">
            {doctorRows.length === 0 ? (
              <p className="muted-copy">当前筛选条件下暂无医生业务数据。</p>
            ) : (
              doctorRows.map((item, index) => (
                <div className="admin-rank-item" key={`${item.doctorName}-${index}`}>
                  <div className="admin-rank-item__top">
                    <span className="admin-rank-index">{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item.doctorName}</strong>
                    <span>{item.total} 人次</span>
                  </div>
                  <small>{item.deptName} / 已接诊 {item.visited} 人次</small>
                </div>
              ))
            )}
          </div>

          <div className="admin-note-block">
            <span className="admin-inline-status admin-inline-status-progress">核查</span>
            <p>报表页保留筛选、统计与明细查询能力，不再承担首页仪表盘展示职责。</p>
          </div>
        </article>
      </section>

      <section className="section-card admin-section-card admin-dashboard-panel admin-report-panel">
        <div className="admin-panel-header">
          <div>
            <h3>业务明细记录</h3>
            <p className="section-copy">按业务日期倒序展示筛选后的挂号记录，便于逐条核查。</p>
          </div>
          <span className="admin-tag admin-tag-info">{reportRows.length} 条</span>
        </div>
        <DataTable
          columns={[
            { key: "patientName", label: "患者" },
            { key: "deptName", label: "科室" },
            { key: "doctorName", label: "医生" },
            { key: "registDate", label: "日期" },
            { key: "visitState", label: "状态" },
            { key: "income", label: "金额" }
          ]}
          rows={reportRows}
          emptyText="当前筛选条件下暂无业务明细记录。"
        />
      </section>
    </div>
  );
}

function DiagnosisPanel({ sessionUser, actions }) {
  const rows = actions.store.registrations.filter((item) => item.doctorId === sessionUser.doctorId && item.visitState === 1);
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? null);
  const selected = rows.find((item) => item.id === selectedId) ?? rows[0] ?? null;
  const inventories = actions.store.medicationInventories ?? [];
  const [form, setForm] = useState({ diagiosis: "", prescription: "", drugPrice: "", purchaseType: 0 });
  const [medicationDrafts, setMedicationDrafts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSymptomSummary, setAiSymptomSummary] = useState("");
  const [aiAdvice, setAiAdvice] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const activePlansForPatient = (actions.store.medicationPlans ?? []).filter(
    (item) => item.patientUserId === selected?.patientUserId && item.registrationId !== selected?.id && item.status !== "COMPLETED"
  );
  const draftWarnings = buildMedicationDraftWarnings(
    medicationDrafts,
    activePlansForPatient,
    actions.store.medicationConflicts ?? [],
    inventories
  );
  const calculatedDrugPrice = medicationDrafts.reduce((sum, item) => {
    const inventory = inventories.find((entry) => entry.id === Number(item.medicationInventoryId));
    return sum + toSafeNumber(inventory?.unitPrice) * toSafeNumber(item.quantity || 0);
  }, 0);
  const availableInventorySummary = inventories
    .slice(0, 10)
    .map(
      (item) =>
        `${item.medicationName}${item.specification ? `（${item.specification}）` : ""}；库存 ${item.stockQuantity}；用法提示 ${item.usageNotes || "按医嘱使用"}`
    )
    .join("\n");
  const matchedRecommendedInventories = useMemo(() => {
    if (!aiAdvice) {
      return [];
    }

    const adviceText = [aiAdvice.secondary, aiAdvice.tertiary, aiAdvice.risk].filter(Boolean).join("\n");
    const matched = inventories.filter((item) => adviceText.includes(item.medicationName));
    return matched.slice(0, 4);
  }, [aiAdvice, inventories]);

  useEffect(() => {
    setSelectedId(selected?.id ?? null);
  }, [selected?.id]);

  useEffect(() => {
    setForm({
      diagiosis: selected?.diagiosis || "",
      prescription: selected?.prescription || "",
      drugPrice: selected?.drugPrice ? String(selected.drugPrice) : "",
      purchaseType: Number(selected?.purchaseType ?? 0)
    });
    setMedicationDrafts(
      (actions.store.medicationPlans ?? [])
        .filter((item) => item.registrationId === selected?.id)
        .map((item) => ({
          medicationInventoryId: item.medicationInventoryId,
          dosage: item.dosage,
          quantity: item.quantity,
          frequencyCode: item.frequencyCode,
          instructions: item.instructions || ""
        }))
    );
    setAiSymptomSummary("");
    setAiAdvice(null);
  }, [actions.store.medicationPlans, selected?.id]);

  useEffect(() => {
    if (medicationDrafts.length === 0) {
      setForm((current) => ({ ...current, drugPrice: current.drugPrice && toSafeNumber(current.drugPrice) > 0 ? current.drugPrice : "0" }));
      return;
    }

    setForm((current) => ({
      ...current,
      drugPrice: calculatedDrugPrice ? calculatedDrugPrice.toFixed(2) : "0"
    }));
  }, [calculatedDrugPrice, medicationDrafts.length]);

  async function save() {
    if (!selected) {
      actions.showNotice("请先选择待接诊患者。");
      return;
    }
    if (!form.diagiosis.trim()) {
      actions.showNotice("请填写诊断。");
      return;
    }
    if (medicationDrafts.some((item) => !item.medicationInventoryId || !item.dosage.trim() || !toSafeNumber(item.quantity))) {
      actions.showNotice("请把药物方案中的药品、剂量和数量填写完整。");
      return;
    }
    try {
      setIsSaving(true);
      await actions.saveDiagnosis(selected.id, {
        diagiosis: form.diagiosis.trim(),
        prescription: buildPrescriptionSummary(medicationDrafts, inventories, form.prescription),
        drugPrice: toSafeNumber(form.drugPrice),
        purchaseType: Number(form.purchaseType),
        medicationItems: medicationDrafts.map((item) => {
          const inventory = inventories.find((entry) => entry.id === Number(item.medicationInventoryId));
          const frequency = MEDICATION_FREQUENCY_OPTIONS.find((entry) => entry.code === item.frequencyCode) ?? MEDICATION_FREQUENCY_OPTIONS[0];
          return {
            medicationInventoryId: Number(item.medicationInventoryId),
            medicationName: inventory?.medicationName || "",
            dosage: item.dosage.trim(),
            quantity: toSafeNumber(item.quantity),
            frequencyCode: frequency.code,
            frequencyLabel: frequency.label,
            frequencyPerDay: frequency.timesPerDay,
            instructions: item.instructions.trim() || inventory?.usageNotes || ""
          };
        })
      });
      actions.showNotice("看诊记录已保存。");
    } catch (error) {
      actions.showNotice(error.message || "保存看诊失败。");
    } finally {
      setIsSaving(false);
    }
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
        symptomSummary: [
          "请根据以下门诊接诊信息生成正式、可执行的用药参考。",
          "回答要求：",
          "1. 参考诊断写在 primary。",
          "2. 建议药方写在 secondary，必须尽量给出明确药品名称、剂量、频次和疗程。",
          "3. 优先从可用药品清单中选择药名，不要只写笼统的大方向。",
          "4. 用药说明写在 tertiary，风险提醒写在 risk。",
          "5. 如果现有药品不足以支持完整方案，也要明确指出缺口。",
          `当前患者：${selected.realname}，${selected.gender}，${selected.age ?? "-"} 岁。`,
          `当前诊断栏内容：${form.diagiosis || "暂无"}`,
          `症状描述：${aiSymptomSummary.trim()}`,
          `当前药房可用药品：\n${availableInventorySummary || "暂无库存药品信息"}`
        ].join("\n")
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
    actions.showNotice("已将 AI 参考诊断带入诊断栏。");
  }

  function applyAiPrescription() {
    if (!aiAdvice?.secondary) {
      return;
    }
    setForm((current) => ({ ...current, prescription: aiAdvice.secondary }));
    actions.showNotice("已将 AI 建议保留为处方备注。");
  }

  function addMedicationDraft() {
    setMedicationDrafts((current) => [...current, createMedicationDraft(inventories[0])]);
  }

  function addRecommendedMedication(inventory) {
    if (!inventory) {
      return;
    }

    const exists = medicationDrafts.some((item) => Number(item.medicationInventoryId) === Number(inventory.id));
    if (exists) {
      actions.showNotice(`${inventory.medicationName} 已在当前药物方案中。`);
      return;
    }

    setMedicationDrafts((current) => [...current, createMedicationDraft(inventory)]);
    actions.showNotice(`已将 ${inventory.medicationName} 加入药物方案。`);
  }

  function updateMedicationDraft(index, patch) {
    setMedicationDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function removeMedicationDraft(index) {
    setMedicationDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="split-layout">
      <section className="section-card diagnosis-queue-panel">
        <h3>待接诊患者</h3>
        <div className="list-stack diagnosis-queue-list">
          {rows.length === 0 ? <p className="muted-copy">暂无待接诊患者。</p> : null}
          {rows.map((item) => (
            <button className={item.id === selected?.id ? "list-button list-button-active" : "list-button"} key={item.id} type="button" onClick={() => setSelectedId(item.id)}>
              <strong>{item.realname}</strong>
              <span>{item.registDate}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="section-card">
        <h3>接诊详情</h3>
        {selected ? (
          <>
            <div className="info-grid">
              <InfoPair label="患者姓名" value={selected.realname} />
              <InfoPair label="性别年龄" value={`${selected.gender} / ${selected.age}`} />
              <InfoPair label="身份证号" value={selected.cardNumber || "-"} />
              <InfoPair label="挂号科室" value={selected.deptName} />
            </div>
            <div className="diagnosis-assist-grid">
              <label className="diagnosis-field-card">
                诊断
                <textarea rows="6" value={form.diagiosis} onChange={(event) => setForm((current) => ({ ...current, diagiosis: event.target.value }))} />
              </label>
              <section className="ai-assist-card diagnosis-ai-card">
                <h4>AI 用药参考</h4>
                <p className="section-copy">医生可先结合症状描述生成参考诊断、建议药方与风险提醒，再决定是否带入当前接诊记录。</p>
                <label>
                  症状描述
                  <textarea
                    rows="6"
                    placeholder="例如：发热两天，咽痛，伴轻微咳嗽。"
                    value={aiSymptomSummary}
                    onChange={(event) => setAiSymptomSummary(event.target.value)}
                  />
                </label>
                <button className="secondary-button" disabled={isLoadingAi} type="button" onClick={requestMedicationAdvice}>
                  {isLoadingAi ? "正在生成..." : "生成 AI 用药参考"}
                </button>
                {aiAdvice ? (
                  <div className="stack diagnosis-ai-card__result">
                    <div className="diagnosis-ai-card__result-panels">
                      <section className="diagnosis-ai-card__result-item">
                        <h5>参考诊断</h5>
                        <p>{aiAdvice.primary || "-"}</p>
                      </section>
                      <section className="diagnosis-ai-card__result-item diagnosis-ai-card__result-item-primary">
                        <h5>建议药方</h5>
                        <p>{aiAdvice.secondary || "-"}</p>
                      </section>
                      <section className="diagnosis-ai-card__result-item">
                        <h5>用药说明</h5>
                        <p>{aiAdvice.tertiary || "-"}</p>
                      </section>
                      <section className="diagnosis-ai-card__result-item">
                        <h5>风险提醒</h5>
                        <p>{aiAdvice.risk || "-"}</p>
                      </section>
                    </div>
                    {matchedRecommendedInventories.length ? (
                      <div className="diagnosis-ai-card__matched">
                        <div className="section-heading-inline">
                          <h4>匹配到的库存药品</h4>
                          <span className="muted-copy">可一键带入药物方案</span>
                        </div>
                        <div className="diagnosis-ai-card__matched-list">
                          {matchedRecommendedInventories.map((item) => (
                            <button
                              className="diagnosis-ai-card__matched-item"
                              key={item.id}
                              type="button"
                              onClick={() => addRecommendedMedication(item)}
                            >
                              <strong>{item.medicationName}</strong>
                              <span>{item.specification || "常规规格"}</span>
                              <small>{item.usageNotes || "按医嘱使用"}</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="diagnosis-ai-card__inventory-hint">
                        <strong>当前未匹配到明确库存药品</strong>
                        <span>可继续补充症状描述，或直接在下方“药物方案编排”中选择具体药品。</span>
                      </div>
                    )}
                    <div className="inline-actions">
                      <button className="ghost-button" disabled={!aiAdvice.primary} type="button" onClick={applyAiDiagnosis}>带入诊断</button>
                      <button className="ghost-button" disabled={!aiAdvice.secondary} type="button" onClick={applyAiPrescription}>带入处方</button>
                    </div>
                  </div>
                ) : <p className="muted-copy">先生成 AI 参考，再决定是否采用。</p>}
              </section>
            </div>
            <section className="medication-builder">
              <div className="section-heading-inline">
                <div>
                  <h4>药物方案编排</h4>
                  <p className="section-copy">医生可直接从药房库房中选择药品，系统会自动汇总药费并检查冲突风险。</p>
                </div>
                <button className="ghost-button" type="button" onClick={addMedicationDraft}>
                  添加药物
                </button>
              </div>
              {medicationDrafts.length === 0 ? (
                <p className="muted-copy">当前还没有药物方案，可以先添加一项药品。</p>
              ) : (
                <div className="medication-draft-list">
                  {medicationDrafts.map((draft, index) => {
                    const inventory = inventories.find((item) => item.id === Number(draft.medicationInventoryId)) ?? inventories[0] ?? null;
                    return (
                      <article className="medication-draft-card" key={`${draft.medicationInventoryId || "new"}-${index}`}>
                        <div className="field-grid field-grid-4">
                          <label>
                            药品
                            <select
                              value={draft.medicationInventoryId || ""}
                              onChange={(event) => updateMedicationDraft(index, { medicationInventoryId: Number(event.target.value) })}
                            >
                              {inventories.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.medicationName} / 库存 {item.stockQuantity}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            剂量
                            <input
                              placeholder="如 0.2g / 次"
                              value={draft.dosage}
                              onChange={(event) => updateMedicationDraft(index, { dosage: event.target.value })}
                            />
                          </label>
                          <label>
                            数量
                            <input
                              inputMode="numeric"
                              value={draft.quantity}
                              onChange={(event) => updateMedicationDraft(index, { quantity: event.target.value })}
                            />
                          </label>
                          <label>
                            频次
                            <select
                              value={draft.frequencyCode}
                              onChange={(event) => updateMedicationDraft(index, { frequencyCode: event.target.value })}
                            >
                              {MEDICATION_FREQUENCY_OPTIONS.map((item) => (
                                <option key={item.code} value={item.code}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="field-grid field-grid-2">
                          <label>
                            用药说明
                            <input
                              placeholder="如 饭后服用，避免空腹"
                              value={draft.instructions}
                              onChange={(event) => updateMedicationDraft(index, { instructions: event.target.value })}
                            />
                          </label>
                          <label>
                            库房提示
                            <input
                              readOnly
                              value={
                                inventory
                                  ? `${inventory.specification || "常规规格"} / 单价 ${formatCurrency(inventory.unitPrice)} / 安全库存 ${inventory.safeStock}`
                                  : "-"
                              }
                            />
                          </label>
                        </div>
                        <div className="inline-actions">
                          <button className="ghost-button" type="button" onClick={() => removeMedicationDraft(index)}>
                            删除药物
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              {draftWarnings.length > 0 ? (
                <div className="warning-grid">
                  {draftWarnings.map((warning) => (
                    <article className="warning-card" key={warning.id}>
                      <span className="warning-card__level">{warning.severity || "提醒"}</span>
                      <strong>
                        {warning.leftMedicationName} + {warning.rightMedicationName}
                      </strong>
                      <p>{warning.guidance}</p>
                    </article>
                  ))}
                </div>
              ) : null}
              <label>
                处方备注
                <textarea
                  rows="4"
                  placeholder="这里可以补充医生备注，药物明细会自动汇总。"
                  value={form.prescription}
                  onChange={(event) => setForm((current) => ({ ...current, prescription: event.target.value }))}
                />
              </label>
            </section>
            <div className="field-grid field-grid-3">
              <label>药费<input readOnly value={form.drugPrice} /></label>
              <label>购药方式<select value={form.purchaseType} onChange={(event) => setForm((current) => ({ ...current, purchaseType: Number(event.target.value) }))}><option value={0}>药房取药</option><option value={1}>自行购买</option></select></label>
            </div>
            <button className="primary-button" disabled={isSaving} type="button" onClick={save}>{isSaving ? "正在保存..." : "保存看诊"}</button>
          </>
        ) : <p className="muted-copy">选择左侧患者后即可开始接诊。</p>}
      </section>
    </div>
  );
}

function DoctorMessagesPanel({ sessionUser, actions }) {
  const rows = actions.store.consultMessages.filter((item) => item.doctorUserId === sessionUser.id);
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? null);
  const selected = rows.find((item) => item.id === selectedId) ?? rows[0] ?? null;
  const [reply, setReply] = useState("");
  const selectedReply = selected?.doctorReply || "";
  const isReplied = selected?.status === "REPLIED" || Boolean(selectedReply);

  useEffect(() => {
    setReply(selectedReply);
  }, [selected?.id, selectedReply]);

  useEffect(() => {
    if (rows.length > 0 && !rows.some((item) => item.id === selectedId)) {
      setSelectedId(rows[0].id);
    }
  }, [rows, selectedId]);

  async function save() {
    if (!selected || !reply.trim()) {
      actions.showNotice("请先选择留言并填写回复。");
      return;
    }
    try {
      await actions.replyConsultMessage(selected.id, { doctorReply: reply.trim() });
      setReply(reply.trim());
      actions.showNotice("医生回复已发送。");
    } catch (error) {
      actions.showNotice(error.message || "保存回复失败。");
    }
  }

  return (
    <div className="split-layout">
      <section className="section-card">
        <h3>患者留言</h3>
        <div className="list-stack">
          {rows.length === 0 ? <p className="muted-copy">暂无留言。</p> : null}
          {rows.map((item) => (
            <button className={item.id === selected?.id ? "list-button list-button-active" : "list-button"} key={item.id} type="button" onClick={() => setSelectedId(item.id)}>
              <strong>{item.patientName}</strong>
              <span>{item.symptomSummary}</span>
              <span>{item.status === "REPLIED" || item.doctorReply ? "已回复" : "待回复"}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="section-card">
        <h3>回复详情</h3>
        {selected ? (
          <>
            <div className={isReplied ? "doctor-reply-status doctor-reply-status-done" : "doctor-reply-status"}>
              <strong>{isReplied ? "已回复" : "待回复"}</strong>
              <span>{isReplied ? "患者端会显示下方医生回复内容。" : "填写回复后点击发送，患者端即可查看。"}</span>
            </div>
            <label>患者问题<textarea rows="5" value={selected.patientMessage} readOnly /></label>
            <label>医生回复<textarea rows="5" value={reply} onChange={(event) => setReply(event.target.value)} /></label>
            <button className="primary-button" type="button" onClick={save}>{isReplied ? "更新回复" : "发送回复"}</button>
          </>
        ) : <p className="muted-copy">选择左侧留言后即可回复。</p>}
      </section>
    </div>
  );
}

function PharmacyPanel({ actions }) {
  const rows = actions.store.registrations.filter((item) => item.visitState === 2 && Number(item.purchaseType) === 0);
  const inventories = (actions.store.medicationInventories ?? []).slice().sort((left, right) => left.stockQuantity - right.stockQuantity);
  const plans = actions.store.medicationPlans ?? [];

  async function mark(id) {
    try {
      await actions.markDispensed(id);
      actions.showNotice("发药状态已更新。");
    } catch (error) {
      actions.showNotice(error.message || "发药失败。");
    }
  }

  return (
    <div className="stack admin-page-stack">
      <section className="section-card workspace-scroll-card">
        <div className="section-heading-inline">
          <div>
            <h3>药房发药</h3>
            <p className="section-copy">发药时会同步扣减对应药品库存，形成处方和库房联动。</p>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "id", label: "病历号" },
            { key: "realname", label: "患者" },
            { key: "doctorName", label: "医生" },
            { key: "planSummary", label: "药物方案" },
            { key: "drugPriceLabel", label: "药费" },
            { key: "action", label: "操作" }
          ]}
          rows={rows.map((item) => ({
            ...item,
            planSummary:
              plans
                .filter((plan) => plan.registrationId === item.id)
                .map((plan) => `${plan.medicationName} x${plan.quantity}`)
                .join("；") || "暂无药物明细",
            drugPriceLabel: formatCurrency(item.drugPrice),
            action: <button className="tiny-button" type="button" onClick={() => mark(item.id)}>确认发药</button>
          }))}
          emptyText="暂无待发药记录。"
        />
      </section>

      <section className="section-card workspace-scroll-card">
        <h3>药房库存概览</h3>
        <DataTable
          columns={[
            { key: "medicationName", label: "药品" },
            { key: "specification", label: "规格" },
            { key: "stockQuantity", label: "当前库存" },
            { key: "safeStock", label: "安全库存" },
            { key: "stockStatus", label: "状态" }
          ]}
          rows={inventories.map((item) => ({
            ...item,
            stockStatus: item.stockQuantity <= item.safeStock ? "库存偏低" : "库存正常"
          }))}
          emptyText="暂无药房库存数据。"
        />
      </section>
    </div>
  );
}

function PatientAiPanel({ sessionUser, actions }) {
  const profile = actions.store.patientProfiles.find((item) => item.userId === sessionUser.id);
  const [messages, setMessages] = useState([{ id: "welcome", role: "assistant", text: "我是专属AI医生，这一页只负责患者问诊、导诊建议和就医准备。你可以直接说症状、用药顾虑或想问医生的问题；如果超出我的职责范围，我会直接说明不负责回答。" }]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  async function ask() {
    const question = draft.trim();
    if (!question) {
      actions.showNotice("请先输入想咨询的问题。");
      return;
    }
    const nextMessages = [...messages, { id: `user-${Date.now()}`, role: "user", text: question }];
    setMessages(nextMessages);
    setDraft("");
    setIsChatOpen(true);

    try {
      setLoading(true);
      const result = await actions.requestAgentChat(
        createPatientDoctorAgentPayload({
          sessionUser,
          profile,
          summary: `当前患者：${sessionUser.realName}；性别：${profile?.gender ?? "-"}；年龄：${profile?.age ?? "-"}；手机号：${profile?.phoneNumber || sessionUser.phoneNumber || "-"}。当前场景是患者专属AI问诊页，请优先提供导诊、症状咨询、就诊准备和沟通整理帮助。`,
          prompt: question,
          history: buildPanelAgentHistory(nextMessages)
        })
      );
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: String(result?.reply ?? "").trim() || "我现在只负责患者问诊与就医咨询，这次没有拿到有效回复，请换个更具体的问题试试。"
        }
      ]);
    } catch (error) {
      actions.showNotice(error.message || "专属AI医生暂时无法回复。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section-card digital-doctor-panel">
      <div className="digital-doctor-hero">
        <button className={isChatOpen ? "digital-doctor-avatar digital-doctor-avatar-active" : "digital-doctor-avatar"} type="button" onClick={() => setIsChatOpen((current) => !current)}>
          <span className="digital-doctor-orbit" />
          <span className="digital-doctor-head" />
          <span className="digital-doctor-body" />
          <span className="digital-doctor-core" />
        </button>
        <div className="digital-doctor-copy">
          <p className="eyebrow">数字人医生</p>
          <h3>专属AI医生</h3>
          <p className="section-copy">患者进入后可以直接看到数字人，点击即可展开聊天。回答会围绕你的当前问题继续生成。</p>
          <div className="info-grid">
            <InfoPair label="患者" value={sessionUser.realName} />
            <InfoPair label="登录手机号" value={profile?.phoneNumber || sessionUser.phoneNumber || "-"} />
            <InfoPair label="性别" value={profile?.gender ?? "-"} />
            <InfoPair label="年龄" value={profile?.age ?? "-"} />
          </div>
          <button className="secondary-button" type="button" onClick={() => setIsChatOpen(true)}>开始和数字人聊天</button>
        </div>
      </div>
      {isChatOpen ? (
        <div className="digital-chat-window">
          <div className="digital-chat-messages">
            {messages.map((item) => (
              <div className={item.role === "assistant" ? "digital-chat-message digital-chat-message-assistant" : "digital-chat-message digital-chat-message-user"} key={item.id}>
                <span className="digital-chat-role">{item.role === "assistant" ? "专属AI医生" : "我"}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
          <label>对数字人说点什么<textarea rows="3" placeholder="例如：我这两天头晕、失眠，需要先做什么？" value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
          <div className="inline-actions">
            <button className="primary-button" disabled={loading} type="button" onClick={ask}>{loading ? "专属AI医生回复中..." : "发送给专属AI医生"}</button>
            <button className="ghost-button" type="button" onClick={() => setIsChatOpen(false)}>收起聊天</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PatientConsultPanel({ sessionUser, actions }) {
  const rows = actions.store.consultMessages.filter((item) => item.patientUserId === sessionUser.id);
  const [form, setForm] = useState({ doctorUserId: actions.doctors[0]?.userId ?? "", symptomSummary: "", patientMessage: "" });

  async function send() {
    const doctor = actions.doctors.find((item) => item.userId === Number(form.doctorUserId));
    if (!doctor || !form.symptomSummary.trim() || !form.patientMessage.trim()) {
      actions.showNotice("请选择医生，并完整填写留言内容。");
      return;
    }
    try {
      await actions.sendConsultMessage({
        patientUserId: sessionUser.id,
        doctorUserId: doctor.userId,
        symptomSummary: form.symptomSummary.trim(),
        patientMessage: form.patientMessage.trim()
      });
      setForm((current) => ({ ...current, symptomSummary: "", patientMessage: "" }));
      actions.showNotice("留言已发送给医生。");
    } catch (error) {
      actions.showNotice(error.message || "发送留言失败。");
    }
  }

  return (
    <div className="stack">
      <section className="section-card">
        <h3>给医生留言</h3>
        <div className="field-grid field-grid-2">
          <label>选择医生<select value={form.doctorUserId} onChange={(event) => setForm((current) => ({ ...current, doctorUserId: event.target.value }))}>{actions.doctors.filter((doctor) => doctor.enabled).map((doctor) => <option key={doctor.userId} value={doctor.userId}>{doctor.realName} / {doctor.deptName} / {doctor.registLevel}</option>)}</select></label>
          <label>症状摘要<input value={form.symptomSummary} onChange={(event) => setForm((current) => ({ ...current, symptomSummary: event.target.value }))} /></label>
        </div>
        <label>留言内容<textarea rows="5" value={form.patientMessage} onChange={(event) => setForm((current) => ({ ...current, patientMessage: event.target.value }))} /></label>
        <button className="primary-button" type="button" onClick={send}>发送留言</button>
      </section>
      <section className="section-card">
        <h3>我的咨询记录</h3>
        <DataTable columns={[{ key: "doctorName", label: "医生" }, { key: "symptomSummary", label: "症状摘要" }, { key: "statusLabel", label: "状态" }, { key: "doctorReplyLabel", label: "医生回复" }]} rows={rows.map((item) => ({ ...item, statusLabel: item.status === "REPLIED" ? "已回复" : "待回复", doctorReplyLabel: item.doctorReply || "医生暂未回复" }))} emptyText="暂无咨询记录。" />
      </section>
    </div>
  );
}

function LegacyAdminUsersPanel({ actions }) {
  const [selectedId, setSelectedId] = useState(actions.store.users[0]?.id ?? null);
  const selected = actions.store.users.find((item) => item.id === selectedId) ?? actions.store.users[0] ?? null;
  const doctorProfile = selected?.doctorId ? actions.store.doctors.find((item) => item.doctorId === selected.doctorId) : null;
  const [draft, setDraft] = useState({ roleCode: selected?.roleCode ?? "PATIENT", enabled: selected?.enabled ?? true, deptName: doctorProfile?.deptName ?? DEPARTMENTS[0], registLevel: doctorProfile?.registLevel ?? REGIST_LEVELS[0] });

  useEffect(() => {
    setDraft({ roleCode: selected?.roleCode ?? "PATIENT", enabled: selected?.enabled ?? true, deptName: doctorProfile?.deptName ?? DEPARTMENTS[0], registLevel: doctorProfile?.registLevel ?? REGIST_LEVELS[0] });
  }, [selected?.id, doctorProfile?.doctorId]);

  async function save() {
    if (!selected) {
      return;
    }
    try {
      await actions.updateUser(selected.id, draft);
      actions.showNotice("用户角色配置已更新。");
    } catch (error) {
      actions.showNotice(error.message || "保存角色失败。");
    }
  }

  return (
    <div className="split-layout admin-admin-users-layout">
      <section className="section-card admin-section-card admin-dashboard-panel">
        <div className="admin-panel-header">
          <div>
            <h3>账户列表</h3>
            <p className="section-copy">按平台账户维度查看当前可管理的用户与角色信息。</p>
          </div>
        </div>
        <div className="list-stack">
          {actions.store.users.map((user) => (
            <button className={user.id === selected?.id ? "list-button list-button-active" : "list-button"} key={user.id} type="button" onClick={() => setSelectedId(user.id)}>
              <strong>{user.username}</strong>
              <span>{user.realName} / {ROLE_LABELS[user.roleCode] ?? user.roleCode}{user.phoneNumber ? ` / ${user.phoneNumber}` : ""}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="section-card admin-section-card admin-dashboard-panel">
        <div className="admin-panel-header">
          <div>
            <h3>账户与权限设置</h3>
            <p className="section-copy">维护账户角色、启停状态及医生岗位配置。</p>
          </div>
        </div>
        {selected ? (
          <>
            <div className="info-grid">
              <InfoPair label="账户名" value={selected.username} />
              <InfoPair label="姓名" value={selected.realName} />
              <InfoPair label="联系方式" value={selected.phoneNumber || "-"} />
            </div>
            <div className="field-grid field-grid-3">
              <label>联系方式<input readOnly value={selected.phoneNumber || "-"} /></label>
              <label>角色<select value={draft.roleCode} onChange={(event) => setDraft((current) => ({ ...current, roleCode: event.target.value }))}>{Object.entries(ROLE_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
              <label>账号状态<select value={draft.enabled ? "enabled" : "disabled"} onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.value === "enabled" }))}><option value="enabled">启用</option><option value="disabled">停用</option></select></label>
              {draft.roleCode === "DOCTOR" ? <><label>科室<select value={draft.deptName} onChange={(event) => setDraft((current) => ({ ...current, deptName: event.target.value }))}>{DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>号别<select value={draft.registLevel} onChange={(event) => setDraft((current) => ({ ...current, registLevel: event.target.value }))}>{REGIST_LEVELS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></> : null}
            </div>
            <button className="primary-button admin-primary-button" type="button" onClick={save}>保存账户设置</button>
          </>
        ) : <p className="muted-copy">请先在左侧选择需要维护的账户。</p>}
      </section>
    </div>
  );
}

function AdminUsersPanel({ actions }) {
  const users = actions.store.users ?? [];
  const doctors = actions.store.doctors ?? [];
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? null);
  const [filters, setFilters] = useState({ keyword: "", roleCode: "ALL", enabled: "ALL" });
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const keyword = filters.keyword.trim().toLowerCase();
        const keywordMatched =
          !keyword ||
          [user.username, user.realName, user.phoneNumber, user.loginCode]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword));
        const roleMatched = filters.roleCode === "ALL" || user.roleCode === filters.roleCode;
        const enabledMatched =
          filters.enabled === "ALL" ||
          (filters.enabled === "enabled" ? user.enabled !== false : user.enabled === false);
        return keywordMatched && roleMatched && enabledMatched;
      }),
    [filters.enabled, filters.keyword, filters.roleCode, users]
  );
  const selected = filteredUsers.find((item) => item.id === selectedId) ?? filteredUsers[0] ?? users.find((item) => item.id === selectedId) ?? users[0] ?? null;
  const doctorProfile = selected?.doctorId ? doctors.find((item) => item.doctorId === selected.doctorId) : null;
  const [draft, setDraft] = useState({
    roleCode: selected?.roleCode ?? "PATIENT",
    enabled: selected?.enabled ?? true,
    deptName: doctorProfile?.deptName ?? DEPARTMENTS[0],
    registLevel: doctorProfile?.registLevel ?? REGIST_LEVELS[0]
  });
  const summary = useMemo(
    () => ({
      total: users.length,
      medical: users.filter((item) => item.roleCode === "DOCTOR" || item.roleCode === "PHARMACIST").length,
      disabled: users.filter((item) => item.enabled === false).length
    }),
    [users]
  );

  useEffect(() => {
    if (!selectedId && filteredUsers.length > 0) {
      setSelectedId(filteredUsers[0].id);
      return;
    }
    if (selectedId && filteredUsers.length > 0 && !filteredUsers.some((item) => item.id === selectedId)) {
      setSelectedId(filteredUsers[0].id);
    }
  }, [filteredUsers, selectedId]);

  useEffect(() => {
    setDraft({
      roleCode: selected?.roleCode ?? "PATIENT",
      enabled: selected?.enabled ?? true,
      deptName: doctorProfile?.deptName ?? DEPARTMENTS[0],
      registLevel: doctorProfile?.registLevel ?? REGIST_LEVELS[0]
    });
  }, [selected?.id, doctorProfile?.doctorId]);

  async function save() {
    if (!selected) {
      return;
    }
    try {
      await actions.updateUser(selected.id, draft);
      actions.showNotice("账户权限配置已更新。");
    } catch (error) {
      actions.showNotice(error.message || "保存账户配置失败。");
    }
  }

  return (
    <div className="stack admin-page-stack">
      <section className="section-card admin-section-card admin-simple-hero">
        <div>
          <p className="eyebrow">账户与权限</p>
          <h3>用户管理</h3>
          <p className="section-copy">集中维护平台账户、岗位角色、启停状态与医护岗位配置，供管理员统一管理。</p>
        </div>
        <div className="admin-summary-inline">
          <InfoPair label="账户总数" value={summary.total} />
          <InfoPair label="医护账户" value={summary.medical} />
          <InfoPair label="停用账户" value={summary.disabled} />
        </div>
      </section>

      <section className="section-card admin-section-card admin-toolbar-card">
        <div className="admin-toolbar-copy">
          <strong>查询条件</strong>
          <span>共筛选出 {filteredUsers.length} 个账户</span>
        </div>
        <div className="admin-filter-grid admin-filter-grid-users">
          <label>
            关键词检索
            <input
              value={filters.keyword}
              onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              placeholder="按账号、姓名、手机号检索"
            />
          </label>
          <label>
            角色筛选
            <select value={filters.roleCode} onChange={(event) => setFilters((current) => ({ ...current, roleCode: event.target.value }))}>
              <option value="ALL">全部角色</option>
              {Object.entries(ROLE_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            状态筛选
            <select value={filters.enabled} onChange={(event) => setFilters((current) => ({ ...current, enabled: event.target.value }))}>
              <option value="ALL">全部状态</option>
              <option value="enabled">启用</option>
              <option value="disabled">停用</option>
            </select>
          </label>
        </div>
      </section>

      <section className="split-layout admin-admin-users-layout">
        <section className="section-card admin-section-card admin-dashboard-panel admin-users-list-panel">
          <div className="admin-panel-header">
            <div>
              <h3>账户列表</h3>
              <p className="section-copy">按账号维度查看当前可管理的用户、角色与启停状态。</p>
            </div>
          </div>
          <div className="table-wrap admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>账号</th>
                  <th>姓名</th>
                  <th>角色</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      当前筛选条件下暂无账户记录。
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      className={user.id === selected?.id ? "admin-users-table__row-active" : ""}
                      key={user.id}
                      onClick={() => setSelectedId(user.id)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(user.id);
                        }
                      }}
                    >
                      <td>
                        <strong>{user.username}</strong>
                        <div className="admin-table-subcopy">{user.loginCode || "-"}</div>
                      </td>
                      <td>{user.realName}</td>
                      <td>{ROLE_LABELS[user.roleCode] ?? user.roleCode}</td>
                      <td>
                        <span className={`admin-inline-status ${user.enabled === false ? "admin-inline-status-pending" : "admin-inline-status-success"}`}>
                          {user.enabled === false ? "停用" : "启用"}
                        </span>
                      </td>
                      <td>
                        <button className="ghost-button admin-table-action" type="button" onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(user.id);
                        }}>
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-card admin-section-card admin-dashboard-panel admin-users-detail-panel">
          <div className="admin-panel-header">
            <div>
              <h3>账户详情与权限设置</h3>
              <p className="section-copy">维护账户角色、启停状态以及医生岗位所属科室与号别配置。</p>
            </div>
          </div>
          {selected ? (
            <div className="admin-users-detail-body">
              <div className="info-grid admin-user-detail-grid">
                <InfoPair label="登录账号" value={selected.username} />
                <InfoPair label="姓名" value={selected.realName} />
                <InfoPair label="联系方式" value={selected.phoneNumber || "-"} />
                <InfoPair label="当前角色" value={ROLE_LABELS[selected.roleCode] ?? selected.roleCode} />
              </div>
              <div className="field-grid field-grid-3 admin-user-form-grid">
                <label>
                  登录编号
                  <input readOnly value={selected.loginCode || "-"} />
                </label>
                <label>
                  角色
                  <select value={draft.roleCode} onChange={(event) => setDraft((current) => ({ ...current, roleCode: event.target.value }))}>
                    {Object.entries(ROLE_LABELS).map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  账户状态
                  <select value={draft.enabled ? "enabled" : "disabled"} onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.value === "enabled" }))}>
                    <option value="enabled">启用</option>
                    <option value="disabled">停用</option>
                  </select>
                </label>
                <label>
                  手机号码
                  <input readOnly value={selected.phoneNumber || "-"} />
                </label>
                {draft.roleCode === "DOCTOR" ? (
                  <>
                    <label>
                      所属科室
                      <select value={draft.deptName} onChange={(event) => setDraft((current) => ({ ...current, deptName: event.target.value }))}>
                        {DEPARTMENTS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      挂号级别
                      <select value={draft.registLevel} onChange={(event) => setDraft((current) => ({ ...current, registLevel: event.target.value }))}>
                        {REGIST_LEVELS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : (
                  <label>
                    岗位信息
                    <input readOnly value="当前角色无需维护医生岗位配置" />
                  </label>
                )}
              </div>
              <div className="admin-action-row">
                <button className="ghost-button" type="button" onClick={() => setDraft((current) => ({ ...current, enabled: true }))}>
                  启用账户
                </button>
                <button className="ghost-button" type="button" onClick={() => setDraft((current) => ({ ...current, enabled: false }))}>
                  停用账户
                </button>
                <button className="primary-button admin-primary-button" type="button" onClick={save}>
                  保存权限设置
                </button>
              </div>
            </div>
          ) : (
            <p className="muted-copy">请先从左侧账户列表中选择需要维护的账户。</p>
          )}
        </section>
      </section>
    </div>
  );
}

function createMedicationDraft(firstInventory) {
  return {
    medicationInventoryId: firstInventory?.id ?? "",
    dosage: "",
    quantity: "1",
    frequencyCode: MEDICATION_FREQUENCY_OPTIONS[0].code,
    instructions: firstInventory?.usageNotes || ""
  };
}

function buildPrescriptionSummary(medicationDrafts, inventories, extraNotes) {
  const medicationLines = medicationDrafts
    .map((item) => {
      const inventory = inventories.find((entry) => entry.id === Number(item.medicationInventoryId));
      const frequency = MEDICATION_FREQUENCY_OPTIONS.find((entry) => entry.code === item.frequencyCode);
      if (!inventory) {
        return "";
      }
      return `${inventory.medicationName} ${item.dosage} × ${item.quantity} ${inventory.unit || "盒"} / ${frequency?.label || ""}`.trim();
    })
    .filter(Boolean);

  return [medicationLines.join("；"), extraNotes?.trim()].filter(Boolean).join("\n");
}

function buildMedicationDraftWarnings(drafts, activePlans, conflicts, inventories) {
  const draftPlans = drafts
    .map((draft, index) => {
      const inventory = inventories.find((item) => item.id === Number(draft.medicationInventoryId));
      return inventory
        ? {
            id: `draft-${index}`,
            medicationName: inventory.medicationName,
            medicationInventoryId: inventory.id
          }
        : null;
    })
    .filter(Boolean);

  return findMedicationConflictsForPlans([...activePlans, ...draftPlans], conflicts, inventories);
}

function findMedicationConflictsForPlans(plans, conflicts, inventories) {
  const planNames = plans
    .map((item) => item.medicationName || inventories.find((entry) => entry.id === Number(item.medicationInventoryId))?.medicationName)
    .filter(Boolean);
  const uniqueNames = [...new Set(planNames)];

  return conflicts.filter((conflict, index) => {
    const leftMatched = uniqueNames.includes(conflict.leftMedicationName);
    const rightMatched = uniqueNames.includes(conflict.rightMedicationName);
    return leftMatched && rightMatched && index === conflicts.findIndex((item) => item.id === conflict.id);
  });
}

function matchAdminDateRange(value, reportDate, dateRange) {
  if (dateRange === "ALL") {
    return true;
  }
  const normalizedValue = normalizeDateKey(value);
  if (!normalizedValue || !reportDate) {
    return false;
  }
  const rangeDays = Number(dateRange);
  if (!Number.isFinite(rangeDays) || rangeDays <= 0) {
    return true;
  }
  return buildRecentDateWindow(reportDate, rangeDays).includes(normalizedValue);
}

function buildAdminDepartmentRows(registrations) {
  const departmentMap = registrations.reduce((accumulator, item) => {
    const deptName = item.deptName || "未分配科室";
    if (!accumulator[deptName]) {
      accumulator[deptName] = {
        deptName,
        total: 0,
        waiting: 0,
        visited: 0,
        dispensed: 0,
        incomeValue: 0
      };
    }

    accumulator[deptName].total += 1;
    if (Number(item.visitState) === 1) {
      accumulator[deptName].waiting += 1;
    }
    if (Number(item.visitState) >= 2) {
      accumulator[deptName].visited += 1;
      accumulator[deptName].incomeValue += toSafeNumber(item.registfee);
    } else {
      accumulator[deptName].incomeValue += toSafeNumber(item.registfee);
    }
    if (Number(item.visitState) === 3 && Number(item.purchaseType) === 0) {
      accumulator[deptName].dispensed += 1;
      accumulator[deptName].incomeValue += toSafeNumber(item.drugPrice);
    }

    return accumulator;
  }, {});

  const rows = Object.values(departmentMap)
    .sort((left, right) => right.total - left.total)
    .map((item) => ({
      ...item,
      ratio: Math.round((item.total / Math.max(registrations.length, 1)) * 100),
      income: formatCurrency(item.incomeValue),
      completionRate: `${Math.round((item.visited / Math.max(item.total, 1)) * 100)}%`
    }));

  return rows;
}

function buildAdminTrendSeries(registrations, reportDate, days = 7) {
  const trendWindow = buildRecentDateWindow(reportDate, days);
  const trendSeries = trendWindow.map((date) => {
    const count = registrations.filter((item) => normalizeDateKey(item.registDate) === date).length;
    return {
      date,
      count,
      label: formatShortDateLabel(date)
    };
  });
  const trendMax = Math.max(...trendSeries.map((item) => item.count), 1);
  const operationalSeries = trendWindow.map((date) => {
    const dayRows = registrations.filter((item) => normalizeDateKey(item.registDate) === date);
    return {
      date,
      label: formatShortDateLabel(date),
      pending: dayRows.filter((item) => Number(item.visitState) === 1).length,
      visited: dayRows.filter((item) => Number(item.visitState) >= 2).length,
      dispensed: dayRows.filter((item) => Number(item.visitState) === 3 && Number(item.purchaseType) === 0).length
    };
  });
  const operationalMax = Math.max(
    ...operationalSeries.map((item) => item.pending + item.visited + item.dispensed),
    1
  );
  const incomeSeries = trendWindow.map((date) => {
    const dayIncome = registrations
      .filter((item) => normalizeDateKey(item.registDate) === date)
      .reduce((sum, item) => {
        const registrationFee = toSafeNumber(item.registfee);
        const drugIncome =
          Number(item.visitState) >= 2 && Number(item.purchaseType) === 0 ? toSafeNumber(item.drugPrice) : 0;
        return sum + registrationFee + drugIncome;
      }, 0);

    return {
      date,
      label: formatShortDateLabel(date),
      income: dayIncome
    };
  });
  const incomeMax = Math.max(...incomeSeries.map((item) => item.income), 1);

  return trendSeries.map((item) => ({
    ...item,
    height: Math.max(Math.round((item.count / trendMax) * 100), item.count > 0 ? 18 : 8)
  }));
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("zh-CN", { hour12: false });
}

function isSameDay(value) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isPlanDueSoon(value) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff >= -30 * 60 * 1000 && diff <= 2 * 60 * 60 * 1000;
}

function formatMedicationPlanStatus(status) {
  return {
    ACTIVE: "服药中",
    PENDING_PICKUP: "待取药",
    COMPLETED: "已完成"
  }[status] || status || "-";
}

const ADMIN_DASHBOARD_DONUT_COLORS = ["#7b1fe4", "#2f80ed", "#28b391", "#ff4f72", "#f5a623", "#6b7a90"];

function AdminDashboardCanvasV2({ sessionUser, actions, stats }) {
  const dashboard = buildAdminDashboardData(actions.store, stats);
  const highlightCards = [
    {
      title: dashboard.summaryCards[0].title,
      value: dashboard.summaryCards[0].value,
      supporting: `累计挂号 ${stats.totalRegistrations} 人次`,
      accentClass: "admin-ops-highlight-card-rose",
      icon: "R"
    },
    {
      title: dashboard.summaryCards[3].title,
      value: dashboard.summaryCards[3].value,
      supporting: `累计收入 ${formatCurrency(stats.totalIncome)}`,
      accentClass: "admin-ops-highlight-card-green",
      icon: "Y"
    },
    {
      title: dashboard.summaryCards[1].title,
      value: dashboard.summaryCards[1].value,
      supporting: `待接诊 ${dashboard.snapshot.pendingCount > 0 ? dashboard.pendingItems[0]?.value ?? "0 人" : "0 人"}`,
      accentClass: "admin-ops-highlight-card-blue",
      icon: "P"
    },
    {
      title: dashboard.summaryCards[2].title,
      value: dashboard.summaryCards[2].value,
      supporting: `待发药 ${dashboard.pendingItems[1]?.value ?? "0 单"}`,
      accentClass: "admin-ops-highlight-card-violet",
      icon: "D"
    }
  ];
  const departmentDonutItems = dashboard.departmentDistribution.map((item, index) => ({
    label: item.name,
    value: item.count,
    color: ADMIN_DASHBOARD_DONUT_COLORS[index % ADMIN_DASHBOARD_DONUT_COLORS.length],
    supporting: item.percentLabel
  }));

  async function handleQuickAction(actionKey, view) {
    if (view) {
      actions.setActiveView(view);
      return;
    }

    if (actionKey === "refresh") {
      try {
        await actions.refreshState();
        actions.showNotice("管理员首页数据已刷新。");
      } catch (error) {
        actions.showNotice(error.message || "刷新首页数据失败。");
      }
    }
  }

  return (
    <div className="stack admin-dashboard-canvas admin-page-stack admin-ops-dashboard">
      <section className="section-card admin-section-card admin-ops-toolbar">
        <div className="admin-ops-toolbar__copy">
          <p className="eyebrow">运营驾驶舱</p>
          <h3>医院运营总览</h3>
          <p className="section-copy">集中查看挂号、接诊、发药、收入与待处理事项。</p>
        </div>
        <div className="admin-ops-toolbar__actions">
          <div className="admin-ops-toolbar__meta">
            <span className="admin-dashboard-pill">{sessionUser.realName}</span>
            <span className="admin-dashboard-pill">{dashboard.todayLabel}</span>
            <span className="admin-dashboard-pill">{dashboard.reportDateNote}</span>
          </div>
          <div className="admin-ops-search">
            <input placeholder="检索账户、科室、医生或病历号" type="text" />
            <button className="primary-button admin-ops-search__button" type="button" onClick={() => actions.setActiveView("stats")}>
              快速检索
            </button>
          </div>
        </div>
      </section>

      <section className="admin-dashboard-canvas-grid admin-ops-top-grid">
        <div className="admin-span-7 admin-ops-analytics-stack">
          <article className="section-card admin-section-card admin-dashboard-panel admin-ops-panel">
            <div className="admin-panel-header">
              <div>
                <h3>接诊状态</h3>
                <p className="section-copy">近 7 个业务日接诊、已就诊与发药状态分布。</p>
              </div>
              <span className="admin-tag admin-tag-soft">业务日</span>
            </div>
            <div className="admin-ops-status-head">
              {dashboard.trendStats.map((item) => (
                <div className="admin-ops-status-metric" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="admin-ops-mini-bars">
              {dashboard.operationalSeries.map((item) => (
                <div className="admin-ops-mini-bars__item" key={item.date}>
                  <span className="admin-ops-mini-bars__value">{item.total}</span>
                  <div className="admin-ops-mini-bars__track">
                    <div className="admin-ops-mini-bars__stack" style={{ height: `${item.trackHeight}%` }}>
                      <span className="admin-ops-mini-bars__segment admin-ops-mini-bars__segment-pending" style={{ height: `${item.pendingHeight}%` }} />
                      <span className="admin-ops-mini-bars__segment admin-ops-mini-bars__segment-visited" style={{ height: `${item.visitedHeight}%` }} />
                      <span className="admin-ops-mini-bars__segment admin-ops-mini-bars__segment-dispensed" style={{ height: `${item.dispensedHeight}%` }} />
                    </div>
                  </div>
                  <small>{item.label}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="section-card admin-section-card admin-dashboard-panel admin-ops-panel">
            <div className="admin-panel-header">
              <div>
                <h3>挂号趋势</h3>
                <p className="section-copy">按业务日期汇总挂号变化，用于观察门诊负载走势。</p>
              </div>
              <span className="admin-tag admin-tag-info">近 7 日</span>
            </div>
            <div className="admin-ops-area-card">
              <SparklineAreaChart color="#57118d" items={dashboard.trendSeries} valueKey="count" />
            </div>
          </article>
        </div>

        <div className="admin-span-5 admin-ops-highlights">
          {highlightCards.map((card) => (
            <article className={`admin-ops-highlight-card ${card.accentClass}`} key={card.title}>
              <span className="admin-ops-highlight-card__icon">{card.icon}</span>
              <div className="admin-ops-highlight-card__body">
                <small>{card.title}</small>
                <strong>{card.value}</strong>
                <p>{card.supporting}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-dashboard-canvas-grid">
        <article className="section-card admin-section-card admin-dashboard-panel admin-span-6 admin-ops-bottom-panel">
          <div className="admin-panel-header">
            <div>
              <h3>科室服务占比</h3>
              <p className="section-copy">按当前统计口径汇总主要科室业务占比。</p>
            </div>
            <span className="admin-tag admin-tag-soft">{dashboard.departmentTotalLabel}</span>
          </div>
          <div className="admin-donut-card">
            <DonutChart items={departmentDonutItems} size={212} />
            <div className="admin-donut-legend">
              {departmentDonutItems.length === 0 ? (
                <p className="muted-copy">当前没有可用于展示的科室业务数据。</p>
              ) : (
                departmentDonutItems.map((item) => (
                  <div className="admin-donut-legend__item" key={item.label}>
                    <span className="admin-donut-legend__dot" style={{ background: item.color }} />
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.value} 人次 / {item.supporting}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </article>

        <article className="section-card admin-section-card admin-dashboard-panel admin-span-6 admin-ops-bottom-panel">
          <div className="admin-panel-header">
            <div>
              <h3>收入走势</h3>
              <p className="section-copy">展示近 7 个业务日门诊挂号与发药收入变化。</p>
            </div>
            <span className="admin-tag admin-tag-info">{formatCurrency(stats.totalIncome)}</span>
          </div>
          <div className="admin-ops-income-head">
            <strong>{formatCurrency(stats.totalIncome)}</strong>
            <span>累计业务收入</span>
          </div>
          <div className="admin-ops-income-chart">
            {dashboard.incomeSeries.map((item) => (
              <div className="admin-ops-income-chart__item" key={item.date}>
                <span>{item.income > 0 ? formatShortAmount(item.income) : "0"}</span>
                <div className="admin-ops-income-chart__bar-wrap">
                  <div className="admin-ops-income-chart__bar" style={{ height: `${item.height}%` }} />
                </div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-4">
          <div className="admin-panel-header">
            <div>
              <h3>待处理事项</h3>
              <p className="section-copy">统一查看接诊、发药、留言与库存相关事项。</p>
            </div>
            <span className="admin-tag admin-tag-warn">{dashboard.pendingItems.length} 项</span>
          </div>
          <div className="admin-task-list">
            {dashboard.pendingItems.map((item) => (
              <button className="admin-task-item" key={item.title} type="button" onClick={() => handleQuickAction(item.actionKey, item.view)}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
                <div className="admin-task-item__side">
                  <span className={`admin-tag ${item.emphasis ? "admin-tag-warn" : "admin-tag-soft"}`}>{item.value}</span>
                  <small>{item.actionLabel}</small>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-4">
          <div className="admin-panel-header">
            <div>
              <h3>系统通知</h3>
              <p className="section-copy">根据现有业务数据生成的系统提示。</p>
            </div>
          </div>
          <div className="admin-notice-list">
            {dashboard.notifications.map((item) => (
              <div className="admin-notice-item" key={item.title}>
                <span className={`admin-tag ${item.level === "alert" ? "admin-tag-alert" : item.level === "warn" ? "admin-tag-warn" : "admin-tag-info"}`}>
                  {item.label}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-4">
          <div className="admin-panel-header">
            <div>
              <h3>快捷入口</h3>
              <p className="section-copy">直接进入管理员常用业务模块。</p>
            </div>
          </div>
          <div className="admin-quick-grid admin-quick-grid-dense">
            {dashboard.quickActions.map((item) => (
              <button className="admin-quick-card" key={item.title} type="button" onClick={() => handleQuickAction(item.actionKey, item.view)}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-8">
          <div className="admin-panel-header">
            <div>
              <h3>最新挂号记录</h3>
              <p className="section-copy">按业务日期倒序展示近期门诊挂号记录。</p>
            </div>
          </div>
          <DataTable
            columns={[
              { key: "patientName", label: "患者" },
              { key: "deptName", label: "科室" },
              { key: "doctorName", label: "医生" },
              { key: "registDate", label: "日期" },
              { key: "visitState", label: "状态" }
            ]}
            rows={dashboard.latestRegistrations}
            emptyText="暂无挂号记录。"
          />
        </article>

        <article className="section-card admin-dashboard-panel admin-section-card admin-span-4">
          <div className="admin-panel-header">
            <div>
              <h3>库存预警</h3>
              <p className="section-copy">低于安全库存的药品将显示在此处。</p>
            </div>
            <span className={`admin-tag ${dashboard.lowStockItems.length > 0 ? "admin-tag-alert" : "admin-tag-info"}`}>
              {dashboard.lowStockItems.length > 0 ? "需处理" : "正常"}
            </span>
          </div>
          <div className="admin-stock-list">
            {dashboard.lowStockItems.length === 0 ? (
              <p className="muted-copy">当前没有低于安全库存的药品。</p>
            ) : (
              dashboard.lowStockItems.map((item) => (
                <div className="admin-stock-item" key={item.id}>
                  <div>
                    <strong>{item.medicationName}</strong>
                    <p>
                      当前库存 {item.stockQuantity}
                      {item.unit ? ` ${item.unit}` : ""} / 安全库存 {item.safeStock}
                    </p>
                  </div>
                  <span className="admin-stock-item__gap">缺口 {item.shortage}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function SparklineAreaChart({ items, valueKey, color }) {
  const width = 520;
  const height = 210;
  const paddingX = 18;
  const paddingTop = 20;
  const paddingBottom = 28;
  const values = items.map((item) => toSafeNumber(item[valueKey]));
  const max = Math.max(...values, 1);
  const step = items.length > 1 ? (width - paddingX * 2) / (items.length - 1) : 0;
  const points = items.map((item, index) => {
    const x = paddingX + step * index;
    const y = height - paddingBottom - ((height - paddingTop - paddingBottom) * toSafeNumber(item[valueKey])) / max;
    return { x, y, label: item.label, value: item[valueKey] };
  });
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? paddingX} ${height - paddingBottom} L ${points[0]?.x ?? paddingX} ${height - paddingBottom} Z`;

  return (
    <div className="admin-area-chart">
      <svg preserveAspectRatio="none" role="img" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="admin-area-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.34" />
            <stop offset="100%" stopColor={color} stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#admin-area-gradient)" />
        <path d={linePath} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
        {points.map((point) => (
          <circle cx={point.x} cy={point.y} fill={color} key={point.label} r="4.5" />
        ))}
      </svg>
      <div className="admin-area-chart__labels">
        {points.map((point) => (
          <div className="admin-area-chart__label" key={point.label}>
            <strong>{point.value}</strong>
            <small>{point.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ items, size = 176 }) {
  const total = Math.max(items.reduce((sum, item) => sum + toSafeNumber(item.value), 0), 1);
  let current = 0;
  const gradient = items
    .map((item) => {
      const start = (current / total) * 360;
      current += toSafeNumber(item.value);
      const end = (current / total) * 360;
      return `${item.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div className="admin-donut" style={{ width: size, height: size }}>
      <div className="admin-donut__ring" style={{ background: items.length ? `conic-gradient(${gradient})` : "#eef2f7" }} />
      <div className="admin-donut__center">
        <strong>{total}</strong>
        <span>人次</span>
      </div>
    </div>
  );
}

function formatShortAmount(value) {
  const amount = toSafeNumber(value);
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(amount >= 100000 ? 0 : 1)}万`;
  }
  return `${Math.round(amount)}`;
}

function DataTable({ columns, rows, emptyText }) {
  return <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={columns.length} className="empty-cell">{emptyText}</td></tr> : rows.map((row, index) => <tr key={row.id ?? `${row.doctorName ?? "row"}-${index}`}>{columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}</tr>)}</tbody></table></div>;
}

function MetricCard({ title, value }) {
  return <div className="metric-card"><span>{title}</span><strong>{value}</strong></div>;
}

function InfoPair({ label, value }) {
  return <div className="info-pair"><span>{label}</span><strong>{value}</strong></div>;
}

function buildAdminDashboardData(store, stats) {
  const registrations = store.registrations ?? [];
  const users = store.users ?? [];
  const doctors = store.doctors ?? [];
  const consultMessages = store.consultMessages ?? [];
  const medicationInventories = store.medicationInventories ?? [];

  const today = getTodayDateString();
  const registrationDates = [...new Set(registrations.map((item) => normalizeDateKey(item.registDate)).filter(Boolean))].sort();
  const reportDate = registrationDates.includes(today)
    ? today
    : registrationDates[registrationDates.length - 1] || today;
  const usingFallbackDate = reportDate !== today;

  const currentDayRegistrations = registrations.filter((item) => normalizeDateKey(item.registDate) === reportDate);
  const todayVisited = currentDayRegistrations.filter((item) => Number(item.visitState) >= 2).length;
  const todayDispensed = currentDayRegistrations.filter(
    (item) => Number(item.visitState) === 3 && Number(item.purchaseType) === 0
  ).length;
  const todayIncome = currentDayRegistrations.reduce((sum, item) => {
    const registrationFee = toSafeNumber(item.registfee);
    const drugIncome =
      Number(item.visitState) >= 2 && Number(item.purchaseType) === 0 ? toSafeNumber(item.drugPrice) : 0;
    return sum + registrationFee + drugIncome;
  }, 0);

  const pendingDiagnosis = registrations.filter((item) => Number(item.visitState) === 1).length;
  const pendingDispense = registrations.filter(
    (item) => Number(item.visitState) === 2 && Number(item.purchaseType) === 0
  ).length;
  const pendingConsult = consultMessages.filter((item) => item.status === "PENDING").length;
  const lowStockItems = medicationInventories
    .filter((item) => toSafeNumber(item.stockQuantity) <= toSafeNumber(item.safeStock))
    .sort((left, right) => {
      const leftGap = toSafeNumber(left.safeStock) - toSafeNumber(left.stockQuantity);
      const rightGap = toSafeNumber(right.safeStock) - toSafeNumber(right.stockQuantity);
      return rightGap - leftGap;
    })
    .slice(0, 6)
    .map((item) => ({
      ...item,
      shortage: Math.max(toSafeNumber(item.safeStock) - toSafeNumber(item.stockQuantity), 0)
    }));

  const trendWindow = buildRecentDateWindow(reportDate, 7);
  const trendSeries = trendWindow.map((date) => {
    const count = registrations.filter((item) => normalizeDateKey(item.registDate) === date).length;
    return {
      date,
      count,
      label: formatShortDateLabel(date)
    };
  });
  const trendMax = Math.max(...trendSeries.map((item) => item.count), 1);
  const operationalSeries = trendWindow.map((date) => {
    const dayRows = registrations.filter((item) => normalizeDateKey(item.registDate) === date);
    return {
      date,
      label: formatShortDateLabel(date),
      pending: dayRows.filter((item) => Number(item.visitState) === 1).length,
      visited: dayRows.filter((item) => Number(item.visitState) >= 2).length,
      dispensed: dayRows.filter((item) => Number(item.visitState) === 3 && Number(item.purchaseType) === 0).length
    };
  });
  const operationalMax = Math.max(
    ...operationalSeries.map((item) => item.pending + item.visited + item.dispensed),
    1
  );
  const incomeSeries = trendWindow.map((date) => {
    const dayIncome = registrations
      .filter((item) => normalizeDateKey(item.registDate) === date)
      .reduce((sum, item) => {
        const registrationFee = toSafeNumber(item.registfee);
        const drugIncome =
          Number(item.visitState) >= 2 && Number(item.purchaseType) === 0 ? toSafeNumber(item.drugPrice) : 0;
        return sum + registrationFee + drugIncome;
      }, 0);

    return {
      date,
      label: formatShortDateLabel(date),
      income: dayIncome
    };
  });
  const incomeMax = Math.max(...incomeSeries.map((item) => item.income), 1);

  const distributionSource = currentDayRegistrations.length > 0 ? currentDayRegistrations : registrations;
  const departmentCountMap = distributionSource.reduce((accumulator, item) => {
    const key = item.deptName || "未分配科室";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const departmentTotal = distributionSource.length;
  const departmentDistribution = Object.entries(departmentCountMap)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([name, count]) => {
      const percent = departmentTotal ? Math.round((count / departmentTotal) * 100) : 0;
      return {
        name,
        count,
        percent,
        percentLabel: `${percent}%`
      };
    });

  const latestRegistrations = registrations
    .slice()
    .sort((left, right) => {
      const dateCompare = String(right.registDate || "").localeCompare(String(left.registDate || ""));
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return toSafeNumber(right.id) - toSafeNumber(left.id);
    })
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      patientName: item.realname || "未登记患者",
      deptName: item.deptName || "-",
      doctorName: item.doctorName || "-",
      registDate: item.registDate || "-",
      visitState: <span className={`admin-inline-status admin-inline-status-${resolveVisitStateTone(item.visitState)}`}>{formatVisitStateText(item.visitState)}</span>
    }));

  const activeUserCount = users.filter((item) => item.enabled !== false).length;
  const pendingCount = pendingDiagnosis + pendingDispense + pendingConsult + lowStockItems.length;

  return {
    todayLabel: formatDashboardDate(today),
    calendarLabel: formatDashboardDate(new Date()),
    reportDateNote: usingFallbackDate
      ? `当前按最近业务日 ${reportDate} 展示`
      : "当前展示今日实时业务统计",
    summaryCards: [
      {
        title: "今日挂号量",
        value: currentDayRegistrations.length,
        supporting: `累计挂号 ${stats.totalRegistrations} 人次`,
        tone: "blue"
      },
      {
        title: "已就诊人数",
        value: todayVisited,
        supporting: `待接诊 ${pendingDiagnosis} 人`,
        tone: "teal"
      },
      {
        title: "已发药人数",
        value: todayDispensed,
        supporting: `待发药 ${pendingDispense} 单`,
        tone: "cyan"
      },
      {
        title: "今日收入",
        value: formatCurrency(todayIncome),
        supporting: `累计收入 ${formatCurrency(stats.totalIncome)}`,
        tone: "green"
      }
    ],
    snapshot: {
      doctorCount: doctors.filter((item) => item.enabled !== false).length,
      activeUserCount,
      pendingCount
    },
    trendSeries: trendSeries.map((item) => ({
      ...item,
      height: Math.max(Math.round((item.count / trendMax) * 100), item.count > 0 ? 18 : 8)
    })),
    operationalSeries: operationalSeries.map((item) => {
      const total = item.pending + item.visited + item.dispensed;
      const base = total > 0 ? total : 1;
      return {
        ...item,
        total,
        trackHeight: Math.max(Math.round((total / operationalMax) * 100), total > 0 ? 32 : 18),
        pendingHeight: Math.round((item.pending / base) * 100),
        visitedHeight: Math.round((item.visited / base) * 100),
        dispensedHeight: Math.round((item.dispensed / base) * 100)
      };
    }),
    incomeSeries: incomeSeries.map((item) => ({
      ...item,
      height: Math.max(Math.round((item.income / incomeMax) * 100), item.income > 0 ? 20 : 8)
    })),
    trendStats: [
      { label: "累计就诊", value: `${stats.visitedCount} 人` },
      { label: "累计发药", value: `${stats.dispensedCount} 人` },
      { label: "低库存药品", value: `${lowStockItems.length} 项` }
    ],
    departmentDistribution,
    departmentTotalLabel: currentDayRegistrations.length > 0 ? "当前统计日" : "全部样本",
    pendingItems: [
      {
        title: "待接诊挂号",
        description: "当前仍有挂号记录处于待就诊状态，请关注分诊与接诊进度。",
        value: `${pendingDiagnosis} 人`,
        actionLabel: "进入统计分析",
        view: "stats",
        emphasis: pendingDiagnosis > 0
      },
      {
        title: "待发药处方",
        description: "已完成接诊但尚未完成发药的记录，请督导药房及时处理。",
        value: `${pendingDispense} 单`,
        actionLabel: "进入药房工作台",
        view: "pharmacy",
        emphasis: pendingDispense > 0
      },
      {
        title: "待回复咨询",
        description: "患者咨询尚未完成回复，请关注相关科室的处理进度。",
        value: `${pendingConsult} 条`,
        actionLabel: "进入统计分析",
        view: "stats",
        emphasis: pendingConsult > 0
      },
      {
        title: "库存预警",
        description: "部分药品已低于安全库存阈值，请安排补货或调整库存。",
        value: `${lowStockItems.length} 项`,
        actionLabel: "刷新当前数据",
        actionKey: "refresh",
        emphasis: lowStockItems.length > 0
      }
    ],
    notifications: [
      usingFallbackDate
        ? {
            title: "当前首页使用最近业务日数据",
            description: `由于今天暂无挂号记录，首页统计按最近业务日 ${reportDate} 的数据展示。`,
            label: "提示",
            level: "info"
          }
        : {
            title: "首页已切换到今日业务视图",
            description: "当前挂号、就诊和收入指标均按今日数据实时汇总。",
            label: "实时",
            level: "info"
          },
      {
        title: "用户与角色管理入口已就绪",
        description: `当前共有 ${activeUserCount} 个启用账户，可直接进入账户管理页面维护角色权限。`,
        label: "管理",
        level: "info"
      },
      {
        title: lowStockItems.length > 0 ? "存在药房库存预警" : "药房库存处于安全范围",
        description:
          lowStockItems.length > 0
            ? `当前共有 ${lowStockItems.length} 项药品低于安全库存，请及时核查补货。`
            : "当前未发现低于安全库存的药品，可按常规节奏继续巡检。",
        label: lowStockItems.length > 0 ? "告警" : "正常",
        level: lowStockItems.length > 0 ? "alert" : "info"
      },
      {
        title: pendingConsult > 0 ? "仍有患者咨询待闭环" : "患者咨询已基本闭环",
        description:
          pendingConsult > 0
            ? `当前仍有 ${pendingConsult} 条咨询未回复，请督导相关科室及时处理。`
            : "当前无待回复咨询消息，患者沟通记录已完成闭环。",
        label: pendingConsult > 0 ? "待办" : "完成",
        level: pendingConsult > 0 ? "warn" : "info"
      }
    ],
    latestRegistrations,
    lowStockItems,
    quickActions: [
      {
        title: "用户管理",
        description: "维护账户角色、启停状态与岗位配置",
        view: "users"
      },
      {
        title: "统计分析",
        description: "查看全院挂号及运营统计汇总",
        view: "stats"
      },
      {
        title: "病历检索",
        description: "进入业务记录查询页面",
        view: "records"
      },
      {
        title: "刷新数据",
        description: "重新获取当前工作台数据",
        actionKey: "refresh"
      }
    ]
  };
}

function normalizeDateKey(value) {
  if (!value) {
    return "";
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("sv-SE");
}

function buildRecentDateWindow(anchorDate, days) {
  const base = normalizeDateKey(anchorDate);
  const end = base ? new Date(`${base}T00:00:00`) : new Date();
  return Array.from({ length: days }, (_, index) => {
    const next = new Date(end);
    next.setDate(end.getDate() - (days - index - 1));
    return next.toLocaleDateString("sv-SE");
  });
}

function formatDashboardDate(value) {
  const date = value instanceof Date ? value : new Date(`${normalizeDateKey(value)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return String(value || "-");
  }
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
}

function formatShortDateLabel(value) {
  const date = new Date(`${normalizeDateKey(value)}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return String(value || "-");
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatVisitStateText(value) {
  return {
    1: "待就诊",
    2: "已就诊",
    3: "已发药"
  }[Number(value)] || "未知";
}

function resolveVisitStateTone(value) {
  return {
    1: "pending",
    2: "progress",
    3: "success"
  }[Number(value)] || "neutral";
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

function composePatientAiReply(result) {
  const raw = String(result?.rawContent ?? "").trim();
  if (raw && !raw.startsWith("{")) {
    return raw;
  }
  return [result?.primary, result?.secondary, result?.tertiary, result?.risk].filter(Boolean).join("\n") || "建议尽快到线下门诊进一步判断。";
}

function buildOverview(registrations) {
  const totalRegistrations = registrations.length;
  const visitedCount = registrations.filter((item) => item.visitState >= 2).length;
  const dispensedCount = registrations.filter((item) => item.visitState === 3 && Number(item.purchaseType) === 0).length;
  const totalIncome = registrations.reduce((sum, item) => sum + Number(item.registfee || 0) + (item.visitState >= 2 && Number(item.purchaseType) === 0 ? Number(item.drugPrice || 0) : 0), 0);
  return { totalRegistrations, visitedCount, dispensedCount, totalIncome };
}

function buildDashboardCards(roleCode, stats, actions, sessionUser) {
  if (roleCode === "DOCTOR") {
    return [
      { title: "待接诊患者", value: actions.store.registrations.filter((item) => item.doctorId === sessionUser.doctorId && item.visitState === 1).length },
      { title: "待回复留言", value: actions.store.consultMessages.filter((item) => item.doctorUserId === sessionUser.id && item.status === "PENDING").length },
      { title: "已看诊", value: actions.store.registrations.filter((item) => item.doctorId === sessionUser.doctorId && item.visitState >= 2).length }
    ];
  }
  if (roleCode === "PHARMACIST") {
    return [
      { title: "待发药记录", value: actions.store.registrations.filter((item) => item.visitState === 2 && Number(item.purchaseType) === 0).length },
      { title: "已发药", value: stats.dispensedCount },
      { title: "低库存药品", value: (actions.store.medicationInventories ?? []).filter((item) => item.stockQuantity <= item.safeStock).length }
    ];
  }
  if (roleCode === "PATIENT") {
    return [
      { title: "我的挂号记录", value: actions.store.registrations.filter((item) => item.patientUserId === sessionUser.id).length },
      { title: "进行中用药", value: (actions.store.medicationPlans ?? []).filter((item) => item.patientUserId === sessionUser.id && item.status !== "COMPLETED").length },
      { title: "待回复留言", value: actions.store.consultMessages.filter((item) => item.patientUserId === sessionUser.id && item.status === "PENDING").length },
      { title: "已回复留言", value: actions.store.consultMessages.filter((item) => item.patientUserId === sessionUser.id && item.status === "REPLIED").length }
    ];
  }
  return [
    { title: "总挂号量", value: stats.totalRegistrations },
    { title: "已看诊", value: stats.visitedCount },
    { title: "已发药", value: stats.dispensedCount },
    { title: "总收入", value: formatCurrency(stats.totalIncome) }
  ];
}
