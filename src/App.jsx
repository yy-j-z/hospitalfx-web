import React, { useEffect, useMemo, useRef, useState } from "react";
import { api, clearSession, getSessionUserId, setSession } from "./api";
import AnimatedCharacters from "./components/AnimatedCharacters";
import BrandLogo from "./components/BrandLogo";
import CircularGallery from "./components/CircularGallery";
import LiquidEther from "./components/LiquidEther";
import homeGallery1 from "./assets/home-gallery-1.png";
import homeGallery2 from "./assets/home-gallery-2.jpg";
import homeGallery3 from "./assets/home-gallery-3.jpg";
import homeGallery4 from "./assets/home-gallery-4.jpg";
import publicFeatureTop from "./assets/public-feature-top.png";
import publicFeatureBottom from "./assets/public-feature-bottom.png";
import staffMedicalNews1 from "./assets/staff-medical-news-1.jpg";
import staffMedicalNews2 from "./assets/staff-medical-news-2.jpg";
import { ROLE_LABELS } from "./mockData";
import { ActiveViewRouter } from "./panels";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HealthKnowledge from "./components/HealthKnowledge";
import TeachingNews from "./components/TeachingNews";
import AcademicNews from "./components/AcademicNews";

const INITIAL_STORE = {
  users: [],
  doctors: [],
  patientProfiles: [],
  registrations: [],
  consultMessages: [],
  medicationInventories: [],
  medicationConflicts: [],
  medicationPlans: [],
  medicationCheckIns: []
};

const WORKSPACE_META = {
  brandEyebrow: "智慧门诊服务",
  brandTitle: "蓉城医枢",
  brandSubtitle: "智慧医疗协同平台",
  viewCopy: {
    dashboard: "围绕挂号、接诊、发药、药事提醒与患者服务的完整协同工作流。",
    registration: "患者可在这里完成预约挂号、查看可选医生与就诊安排。",
    cancel: "集中查看未就诊记录，快速完成退号与预约调整。",
    diagnosis: "医生在这里完成问诊、诊断录入、处方开立与用药计划安排。",
    messages: "患者咨询与医生回复在同一界面闭环流转。",
    pharmacy: "药房按处方流转完成发药确认与库存联动。",
    consult: "患者可针对既有就诊记录继续向医生发起咨询。",
    users: "管理员统一维护账号、角色与平台使用权限。",
    stats: "查看整个平台的挂号、接诊和运营统计信息。",
    medication: "聚合服药提醒、药物冲突预警、打卡记录与依从性信息。",
    about: "展示蓉城医枢的品牌视觉、项目结构与整体设计理念。"
  }
};

const ADMIN_WORKSPACE_META = {
  title: "医院运营管理后台",
  badges: ["门诊业务管理", "内部工作台"],
  viewCopy: {
    dashboard: "集中展示门诊挂号、接诊、发药、库存与待办事项，供管理员统一调度。",
    users: "统一维护平台账号、角色权限、启停状态与岗位配置。",
    stats: "按科室、就诊状态和业务记录汇总运营统计信息。"
  }
};

const NAV_ITEMS = {
  DOCTOR: [
    { key: "dashboard", label: "接诊概览" },
    { key: "diagnosis", label: "门诊接诊" },
    { key: "messages", label: "患者留言" }
  ],
  PHARMACIST: [
    { key: "dashboard", label: "发药概览" },
    { key: "pharmacy", label: "药房发药" }
  ],
  PATIENT: [
    { key: "dashboard", label: "我的首页" },
    { key: "medication", label: "用药管家" },
    { key: "registration", label: "挂号管理" },
    { key: "cancel", label: "退号管理" },
    { key: "consult", label: "医生留言" }
  ],
  ADMIN: [
    { key: "dashboard", label: "运行总览" },
    { key: "users", label: "账户管理" },
    { key: "stats", label: "统计分析" }
  ]
};

const GLOBAL_AI_CONTEXTS = {
  PATIENT: {
    dashboard: {
      title: "智能就诊助手",
      subtitle: "结合当前首页信息，协助整理挂号、用药与咨询事项。",
      suggestions: [
        { label: "帮我推荐科室", prompt: "请结合我当前就诊记录与常见症状场景，帮助推荐合适的就诊科室。" },
        { label: "查看今日用药提醒", prompt: "请根据我当前的用药计划，整理今天需要关注的服药提醒与执行时间。" },
        { label: "帮我整理咨询内容", prompt: "请帮助我整理向医生咨询时需要表达的重点内容，生成简洁提问。" }
      ]
    },
    registration: {
      title: "挂号辅助助手",
      subtitle: "结合门诊挂号场景，辅助判断科室、号别与预约时间。",
      suggestions: [
        { label: "根据症状推荐科室", prompt: "请根据常见门诊分诊思路，帮助判断当前症状更适合预约哪个科室。" },
        { label: "判断普通号还是专家号", prompt: "请说明当前情况更适合挂普通号还是专家号，并给出简要判断依据。" },
        { label: "查看可预约时间", prompt: "请结合当前门诊排班信息，整理可优先选择的预约时间建议。" }
      ]
    },
    medication: {
      title: "用药辅助助手",
      subtitle: "围绕当前服药计划，解释药物用法、提醒与冲突信息。",
      suggestions: [
        { label: "解释当前药物用法", prompt: "请用正式、易懂的方式解释我当前药物计划中的服用方法与注意事项。" },
        { label: "查看药物冲突提醒", prompt: "请结合当前药物计划，整理需要重点关注的药物冲突与风险提醒。" },
        { label: "帮我整理服药计划", prompt: "请把我当前的服药安排整理成便于执行的日程计划。" }
      ]
    },
    consult: {
      title: "咨询整理助手",
      subtitle: "基于当前咨询记录，辅助整理病情描述与补充问题。",
      suggestions: [
        { label: "整理就诊经过", prompt: "请根据我当前的就诊与咨询记录，整理一份清晰的就诊经过摘要。" },
        { label: "生成补充提问", prompt: "请补充我下一步向医生咨询时适合提出的问题。" },
        { label: "提取重点信息", prompt: "请提炼当前咨询记录里的重点症状、时间线与用药信息。" }
      ]
    }
  },
  DOCTOR: {
    dashboard: {
      title: "接诊辅助助手",
      subtitle: "结合当前接诊概览，辅助整理候诊、留言与处置重点。",
      suggestions: [
        { label: "总结当前接诊压力", prompt: "请根据当前接诊概览，概括今日门诊接诊压力与待处理重点。" },
        { label: "整理患者留言重点", prompt: "请提炼当前患者留言中需要优先处理的事项。" },
        { label: "生成门诊工作摘要", prompt: "请生成一段简洁正式的门诊工作摘要。" }
      ]
    },
    diagnosis: {
      title: "问诊辅助助手",
      subtitle: "围绕当前接诊工作台，辅助生成摘要、重点信息与处方提醒。",
      suggestions: [
        { label: "生成问诊摘要", prompt: "请根据当前门诊接诊场景，生成结构化问诊摘要。" },
        { label: "提取患者重点信息", prompt: "请提炼接诊时需要优先确认的患者重点信息。" },
        { label: "给出处方注意事项", prompt: "请根据当前诊疗流程，给出处方开立时需要关注的风险与注意事项。" }
      ]
    },
    messages: {
      title: "医患沟通助手",
      subtitle: "结合患者留言与回复场景，辅助梳理沟通重点。",
      suggestions: [
        { label: "整理回复要点", prompt: "请整理当前患者留言回复时需要覆盖的重点内容。" },
        { label: "提炼风险信息", prompt: "请识别留言中可能涉及的风险症状与建议处理方式。" },
        { label: "生成回复草稿", prompt: "请生成一份语气正式、简明的回复草稿。" }
      ]
    }
  },
  PHARMACIST: {
    dashboard: {
      title: "药事辅助助手",
      subtitle: "结合发药概览与库存状态，辅助识别待处理药事事项。",
      suggestions: [
        { label: "总结发药情况", prompt: "请根据当前发药概览，总结今日药房处理情况与待办重点。" },
        { label: "梳理库存风险", prompt: "请梳理当前库存中的风险点和优先处理项。" },
        { label: "生成交班摘要", prompt: "请生成一段药房交班摘要，便于内部沟通。" }
      ]
    },
    pharmacy: {
      title: "发药辅助助手",
      subtitle: "围绕发药流程、库存状态与药物风险进行辅助说明。",
      suggestions: [
        { label: "检查药物冲突", prompt: "请结合当前发药流程，整理药物冲突检查时需要关注的重点。" },
        { label: "生成发药提醒", prompt: "请生成面向患者的发药提醒与用药交代要点。" },
        { label: "查看库存风险", prompt: "请汇总当前库存风险，并说明优先处理顺序。" }
      ]
    }
  },
  ADMIN: {
    dashboard: {
      title: "运营智能助手",
      subtitle: "基于医院运营总览，辅助分析挂号、接诊、发药与收入情况。",
      suggestions: [
        { label: "总结今日运营情况", prompt: "请根据当前运营总览，概括今日挂号、接诊、发药与收入情况。" },
        { label: "解释待处理事项", prompt: "请说明当前后台中需要优先关注的待处理事项及其影响。" },
        { label: "汇总近 7 日挂号趋势", prompt: "请对近 7 日挂号趋势作出简洁正式的汇总分析。" }
      ]
    },
    stats: {
      title: "统计分析助手",
      subtitle: "基于统计分析页数据，辅助提炼报表结论与业务趋势。",
      suggestions: [
        { label: "概括报表结论", prompt: "请根据当前统计分析页的数据，概括主要报表结论。" },
        { label: "说明科室差异", prompt: "请分析当前科室业务量差异，并给出简要说明。" },
        { label: "提示异常趋势", prompt: "请识别当前统计趋势中值得关注的异常变化。" }
      ]
    },
    users: {
      title: "账户管理助手",
      subtitle: "结合当前账户管理页，辅助说明权限、状态与配置事项。",
      suggestions: [
        { label: "梳理账户结构", prompt: "请根据当前账户管理数据，梳理系统内账户结构与角色分布。" },
        { label: "解释权限设置", prompt: "请说明当前账户权限设置需要重点关注的管理事项。" },
        { label: "检查停用风险", prompt: "请结合当前账户状态，说明停用账户时需要核查的风险点。" }
      ]
    }
  }
};

const PORTAL_AI_CONTEXTS = {
  home: {
    title: "蓉城智能护理小助手",
    shortLabel: "护理小助手",
    subtitle: "结合首页展示内容，协助了解医院服务入口与就诊准备事项。",
    pageLabel: "首页",
    roleLabel: "访客",
    suggestions: [
      { label: "介绍平台功能", prompt: "请简要介绍当前医院平台首页涵盖的主要服务功能。" },
      { label: "如何开始预约", prompt: "请说明从首页进入后，患者如何开始挂号预约。" },
      { label: "首次就诊需要准备什么", prompt: "请整理首次就诊前需要准备的基础信息与材料。" }
    ]
  },
  public: {
    title: "蓉城智能护理小助手",
    shortLabel: "护理小助手",
    subtitle: "结合公众服务入口，辅助说明挂号、导诊与就诊流程。",
    pageLabel: "公众门户",
    roleLabel: "访客",
    suggestions: [
      { label: "帮我推荐科室", prompt: "请按公众门诊导诊思路，说明常见症状如何判断预约科室。" },
      { label: "说明挂号流程", prompt: "请按当前公众服务入口，说明线上挂号的基本流程。" },
      { label: "查看就诊准备事项", prompt: "请整理患者来院前需要准备的证件、信息和注意事项。" }
    ]
  },
  staff: {
    title: "蓉城智能护理小助手",
    shortLabel: "护理小助手",
    subtitle: "结合员工服务入口，辅助说明系统使用方式与工作台能力。",
    pageLabel: "员工门户",
    roleLabel: "员工访客",
    suggestions: [
      { label: "介绍工作台结构", prompt: "请根据当前员工门户，说明医生、药房和管理员工作台的主要功能结构。" },
      { label: "查看登录后功能", prompt: "请说明员工登录后可以进入哪些业务工作台，以及分别处理什么任务。" },
      { label: "总结系统协同流程", prompt: "请概括该医院系统从挂号到接诊、发药、随访的协同流程。" }
    ]
  }
};

const DEFAULT_REGISTER_FORM = {
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  realName: "",
  gender: "女",
  birthdate: "1995-01-01",
  cardNumber: "",
  homeAddress: ""
};

const DEMO_ACCOUNTS = {
  patient: {
    loginId: "13800000013",
    password: "123456"
  },
  doctor: {
    loginId: "K001",
    password: "123456"
  }
};

const AI_DRAWER_DEFAULT_WIDTH = 420;
const AI_DRAWER_MIN_WIDTH = 360;
const AI_DRAWER_MAX_WIDTH = 860;

const LOGIN_MODE_META = {
  patient: {
    label: "患者登录",
    labelEn: "Patient Login",
    helper: "适合挂号、查看就诊记录、接收药物提醒并完成服药打卡。",
    helperEn: "For appointments, visit records, medication reminders and check-ins.",
    placeholder: "请输入手机号",
    placeholderEn: "Phone number"
  },
  staff: {
    label: "员工登录",
    labelEn: "Staff Login",
    helper: "医生、药师和管理员可通过工号或登录编号进入对应工作台。",
    helperEn: "For doctors, pharmacists and administrators to enter the workspace.",
    placeholder: "请输入工号或登录编号",
    placeholderEn: "Staff ID or login ID"
  },
  demo: {
    label: "快速体验",
    labelEn: "Demo",
    helper: "自动填入演示患者账号，适合比赛展示时快速进入完整患者端流程。",
    helperEn: "Fill in a demo patient account for quick presentation.",
    placeholder: "已自动填入演示账号",
    placeholderEn: "Demo account filled"
  }
};

const HOME_ENTRY_ITEMS = [
  {
    key: "overview",
    title: "详情简介",
    titleEn: "Overview",
    subtitle: "PROJECT PROFILE",
    description: "面向智慧医疗协同场景，展示患者服务、药事管理、服药打卡和医护协同的整体方案。",
    descriptionEn: "A concise profile of patient services, medication management and clinical collaboration.",
    tone: "intro"
  },
  {
    key: "public",
    title: "公众版",
    titleEn: "Public",
    subtitle: "FOR THE PUBLIC",
    description: "患者和公众入口，可查看挂号、提醒、打卡与就诊服务。",
    descriptionEn: "Entry for patients and the public.",
    tone: "public"
  },
  {
    key: "staff",
    title: "员工版",
    titleEn: "Staff",
    subtitle: "FOR STAFF",
    description: "医护、药师和管理人员入口，面向内部工作台服务。",
    descriptionEn: "Entry for staff workbench services.",
    tone: "staff"
  },
  {
    key: "english",
    title: "ENGLISH",
    titleEn: "中文",
    subtitle: "LANGUAGE",
    description: "切换为英文展示，用于双语演示。",
    descriptionEn: "Switch back to Chinese presentation.",
    tone: "english"
  }
];

const PUBLIC_NAV = ["智慧门诊", "用药提醒", "服药打卡", "智慧药房", "医护协同", "关于项目"];
const STAFF_NAV = ["院内通知", "员工入口", "教学科研", "药事协同", "运营管理", "关于项目"];
const PUBLIC_NAV_EN = ["Smart Clinic", "Medication", "Check-in", "Pharmacy", "Care Team", "About"];
const STAFF_NAV_EN = ["Notices", "Staff Links", "Education", "Medication", "Operations", "About"];

const GALLERY_ITEMS = [
  { image: homeGallery1, text: "" },
  { image: homeGallery2, text: "" },
  { image: homeGallery3, text: "" },
  { image: homeGallery4, text: "" }
];

function PublicServiceIcon({ iconKey }) {
  const commonProps = {
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true"
  };

  if (iconKey === "calendar") {
    return (
      <svg {...commonProps}>
        <rect x="8" y="11" width="32" height="29" rx="6" className="public-service-item__icon-outline" />
        <path d="M8 18H40" className="public-service-item__icon-outline" />
        <path d="M16 8V14" className="public-service-item__icon-outline" />
        <path d="M32 8V14" className="public-service-item__icon-outline" />
        <rect x="17" y="22" width="14" height="12" rx="2.5" className="public-service-item__icon-outline" />
        <path d="M24 25V31" className="public-service-item__icon-outline" />
        <path d="M21 28H27" className="public-service-item__icon-outline" />
      </svg>
    );
  }

  if (iconKey === "medicine") {
    return (
      <svg {...commonProps}>
        <path
          d="M18 9H30C31.657 9 33 10.343 33 12V16H15V12C15 10.343 16.343 9 18 9Z"
          className="public-service-item__icon-outline"
        />
        <path
          d="M15 16H33C35.761 16 38 18.239 38 21V34C38 37.314 35.314 40 32 40H16C12.686 40 10 37.314 10 34V21C10 18.239 12.239 16 15 16Z"
          className="public-service-item__icon-outline"
        />
        <path d="M15 16L18 12H30L33 16" className="public-service-item__icon-outline" />
        <rect x="18" y="22" width="12" height="11" rx="2.5" className="public-service-item__icon-outline" />
        <path d="M24 24.5V30.5" className="public-service-item__icon-outline" />
        <path d="M21 27.5H27" className="public-service-item__icon-outline" />
      </svg>
    );
  }

  if (iconKey === "map") {
    return (
      <svg {...commonProps}>
        <path d="M8 10L18 6L30 11L40 7V38L30 42L18 37L8 41V10Z" className="public-service-item__icon-outline" />
        <path d="M18 6V37" className="public-service-item__icon-outline" />
        <path d="M30 11V42" className="public-service-item__icon-outline" />
        <path
          d="M24 17.5C20.686 17.5 18 20.186 18 23.5C18 28.5 24 34.5 24 34.5C24 34.5 30 28.5 30 23.5C30 20.186 27.314 17.5 24 17.5Z"
          className="public-service-item__icon-outline"
        />
        <circle cx="24" cy="23.5" r="2.5" className="public-service-item__icon-outline" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path
        d="M15 8H30L37 15V37C37 38.657 35.657 40 34 40H15C13.343 40 12 38.657 12 37V11C12 9.343 13.343 8 15 8Z"
        className="public-service-item__icon-outline"
      />
      <path d="M30 8V15H37" className="public-service-item__icon-outline" />
      <path d="M18 20H26" className="public-service-item__icon-outline" />
      <path d="M18 26H26" className="public-service-item__icon-outline" />
      <path d="M18 32H23" className="public-service-item__icon-outline" />
      <path
        d="M31 20V34L27.5 31.6L24 34V20"
        className="public-service-item__icon-outline"
      />
    </svg>
  );
}

function App() {
  const [store, setStore] = useState(INITIAL_STORE);
  const [sessionUserId, setSessionUserId] = useState(getSessionUserId);
  const [activeView, setActiveView] = useState("dashboard");
  const [notice, setNotice] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [showWorkspace, setShowWorkspace] = useState(false); // 控制是否显示工作台

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const sessionUser = useMemo(
    () => store.users.find((user) => user.id === sessionUserId) ?? null,
    [store.users, sessionUserId]
  );

  function showNotice(message) {
    setNotice(message);
  }

  async function refreshState() {
    const nextState = await api.fetchState();
    setStore((current) => ({ ...current, ...nextState }));
    return nextState;
  }

  useEffect(() => {
    if (!sessionUserId) {
      setIsBootstrapping(false);
      return;
    }

    refreshState()
      .catch((error) => {
        clearSession();
        setSessionUserId(null);
        showNotice(`登录已失效：${error.message}`);
      })
      .finally(() => setIsBootstrapping(false));
  }, []);

  async function handleLogin(loginId, password, isStaffLogin = false) {
    try {
      const response = await api.login({ loginId, password });
      
      // 如果是员工登录模式，但用户是患者角色，拒绝登录
      if (isStaffLogin && response.user.roleCode === "PATIENT") {
        showNotice("您输入的是患者账号，请使用员工账号登录。");
        return false;
      }
      
      setSession(response.token, response.user.id);
      setSessionUserId(response.user.id);
      setActiveView("dashboard");
      await refreshState();
      showNotice(`欢迎回来，${ROLE_LABELS[response.user.roleCode] ?? "用户"} ${response.user.realName}`);
      return true;
    } catch (error) {
      showNotice(error.message || "登录失败，请稍后重试。");
      return false;
    }
  }

  function handleLogout() {
    clearSession();
    setSessionUserId(null);
    setActiveView("dashboard");
    setShowWorkspace(false);
    showNotice("已退出登录。");
  }

  // 返回公众版首页（不退出登录）
  function handleBackToPublic() {
    setShowWorkspace(false);
    showNotice(sessionUser?.roleCode === "PATIENT" ? "已返回公众版首页。" : "已返回员工版首页。");
  }

  // 点击我的首页跳转到工作台
  function handleGotoHome() {
    setShowWorkspace(true);
  }

  // 跳转到工作台的指定页面
  function handleNavigateTo(view) {
    if (sessionUser) {
      setActiveView(view);
      setShowWorkspace(true);
    }
  }

  async function handleRegisterPatient(payload) {
    try {
      const nextState = await api.registerPatient(payload);
      setStore((current) => ({ ...current, ...nextState }));
      showNotice("患者账号已创建，现在可以直接登录。");
      return true;
    } catch (error) {
      showNotice(error.message || "注册失败。");
      return false;
    }
  }

  async function resetDemoData() {
    try {
      await refreshState();
      showNotice("已刷新后端数据。");
    } catch (error) {
      showNotice(error.message || "刷新数据失败。");
    }
  }

  const actions = {
    store,
    doctors: store.doctors,
    sessionUser,
    activeView,
    setActiveView,
    showNotice,
    resetDemoData,
    refreshState,
    createRegistration: async (payload) => {
      const nextState = await api.createRegistration(payload);
      setStore((current) => ({ ...current, ...nextState }));
      return nextState;
    },
    cancelRegistration: async (id) => {
      const nextState = await api.cancelRegistration(id);
      setStore((current) => ({ ...current, ...nextState }));
      return nextState;
    },
    saveDiagnosis: async (id, payload) => {
      const nextState = await api.saveDiagnosis(id, payload);
      setStore((current) => ({ ...current, ...nextState }));
      return nextState;
    },
    markDispensed: async (id) => {
      const nextState = await api.markDispensed(id);
      setStore((current) => ({ ...current, ...nextState }));
      return nextState;
    },
    checkInMedication: async (planId) => {
      const nextState = await api.checkInMedication(planId);
      setStore((current) => ({ ...current, ...nextState }));
      return nextState;
    },
    sendConsultMessage: async (payload) => {
      const nextState = await api.sendConsultMessage(payload);
      setStore((current) => ({ ...current, ...nextState }));
      return nextState;
    },
    replyConsultMessage: async (id, payload) => {
      const nextState = await api.replyConsultMessage(id, payload);
      setStore((current) => ({ ...current, ...nextState }));
      return nextState;
    },
    updateUser: async (id, payload) => {
      const nextState = await api.updateUser(id, payload);
      setStore((current) => ({ ...current, ...nextState }));
      return nextState;
    },
    requestAgentChat: (payload) => api.requestAgentChat(payload),
    requestRegistrationAi: (payload) => api.requestRegistrationAi(payload),
    requestPatientAi: (payload) => api.requestPatientAi(payload),
    requestDoctorMedicationAi: (payload) => api.requestDoctorMedicationAi(payload)
  };

  if (isBootstrapping) {
    return <div className="app-loading">正在连接后端服务...</div>;
  }

  // 如果登录且显示工作台，则渲染工作台
  if (sessionUser && showWorkspace) {
    return (
      <WorkspaceShell
        notice={notice}
        sessionUser={sessionUser}
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={handleBackToPublic}
        actions={actions}
      />
    );
  }

  // 否则显示公众版首页
  return (
    <AuthScreen
      notice={notice}
      sessionUser={sessionUser}
      onLogin={handleLogin}
      onNotice={showNotice}
      onRegister={handleRegisterPatient}
      onLogout={handleLogout}
      onGotoHome={handleGotoHome}
      onNavigateTo={handleNavigateTo}
      actions={actions}
    />
  );
}

function AuthScreen({ notice, sessionUser, onLogin, onNotice, onRegister, onLogout, onGotoHome, onNavigateTo, actions }) {
  const [loginForm, setLoginForm] = useState({ loginId: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ ...DEFAULT_REGISTER_FORM });
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState("patient");
  const [portalMode, setPortalMode] = useState("public");
  const [expandedEntry, setExpandedEntry] = useState("overview");
  const [isEnglish, setIsEnglish] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [isStaffOnly, setIsStaffOnly] = useState(false);
  const [loginError, setLoginError] = useState("");

  const activeLoginMeta = LOGIN_MODE_META[loginMode];
  const text = getPortalText(isEnglish);

  function chooseLoginMode(mode) {
    setLoginMode(mode);
    setShowPassword(false);
    if (mode === "demo") {
      setLoginForm(DEMO_ACCOUNTS.patient);
      return;
    }
    setLoginForm((current) =>
      current.loginId === DEMO_ACCOUNTS.patient.loginId || current.loginId === DEMO_ACCOUNTS.doctor.loginId
        ? { loginId: "", password: "" }
        : current
    );
  }

  function fillDemoAccount() {
    const targetAccount = loginMode === "staff" || isStaffOnly ? DEMO_ACCOUNTS.doctor : DEMO_ACCOUNTS.patient;
    setLoginForm(targetAccount);
  }

  function openLogin(mode = "patient") {
    chooseLoginMode(mode);
    setIsLoginOpen(true);
    setIsStaffOnly(mode === "staff");
  }

  function closeLogin() {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
    setShowPassword(false);
    setFocusedField("");
    setLoginError("");
  }

  function guardLogin() {
    onNotice(isEnglish ? "Please log in before opening this service." : "请先登录后再打开该服务。");
  }

  function handleHomeEntry(entryKey) {
    setExpandedEntry(entryKey);
    if (entryKey === "public") setPortalMode("public");
    if (entryKey === "staff") {
      // 如果未登录，先打开员工登录
      if (!sessionUser) {
        openLogin("staff");
        return;
      }
      setPortalMode("staff");
    }
    if (entryKey === "english") setIsEnglish((current) => !current);
  }

  // 切换门户
  function handleSwitchPortal() {
    const targetMode = portalMode === "staff" ? "public" : "staff";
    
    // 如果要切换到员工版
    if (targetMode === "staff") {
      // 如果未登录，先打开员工登录
      if (!sessionUser) {
        openLogin("staff");
        return;
      }
      
      // 如果已登录但不是员工角色，显示提示
      if (sessionUser.roleCode !== "DOCTOR" && sessionUser.roleCode !== "PHARMACIST" && sessionUser.roleCode !== "ADMIN") {
        onNotice("您当前登录的是患者账号，无法进入员工版。请使用员工账号登录。");
        return;
      }
    }
    
    setPortalMode(targetMode);
  }

  async function submitLogin(event) {
    event.preventDefault();
    // 清除之前的错误
    setLoginError("");
    
    if (!loginForm.loginId.trim() || !loginForm.password.trim()) {
      setLoginError(isEnglish ? "Please enter your login ID and password." : "请输入登录编号或手机号，以及对应密码。");
      return;
    }
    // 传递isStaffOnly状态，用于判断是否是员工登录模式
    const success = await onLogin(loginForm.loginId.trim(), loginForm.password, isStaffOnly);
    if (!success) {
      // 如果登录失败，检查是否是员工登录模式下的患者账号
      if (isStaffOnly) {
        setLoginError("您输入的是患者账号，请使用员工账号登录。");
      }
    }
    if (success) {
      closeLogin();
      // 如果是员工登录模式，登录成功后切换到员工版
      if (isStaffOnly) {
        setPortalMode("staff");
      }
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    if (!registerForm.phoneNumber || !registerForm.password || !registerForm.realName) {
      onNotice("请完整填写手机号、密码和真实姓名。");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      onNotice("两次输入的密码不一致，请重新确认。");
      return;
    }
    if (!/^1\d{10}$/.test(registerForm.phoneNumber)) {
      onNotice("请输入正确的 11 位手机号。");
      return;
    }
    if (!/^\d{17}[\dXx]$/.test(registerForm.cardNumber)) {
      onNotice("请输入正确的身份证号。");
      return;
    }
    if (!registerForm.homeAddress.trim()) {
      onNotice("请输入家庭住址。");
      return;
    }

    const submittedPhone = registerForm.phoneNumber.trim();
    const success = await onRegister({
      phoneNumber: submittedPhone,
      password: registerForm.password.trim(),
      realName: registerForm.realName.trim(),
      gender: registerForm.gender,
      birthdate: registerForm.birthdate,
      age: calculateAge(registerForm.birthdate),
      cardNumber: registerForm.cardNumber.trim().toUpperCase(),
      homeAddress: registerForm.homeAddress.trim()
    });

    if (success) {
      setRegisterForm({ ...DEFAULT_REGISTER_FORM });
      setIsRegisterOpen(false);
      setIsLoginOpen(true);
      chooseLoginMode("patient");
      setLoginForm({ loginId: submittedPhone, password: "" });
    }
  }

  return (
    <div className={`portal-page portal-mode-${portalMode}`}>
      <div className="portal-fluid-background" aria-hidden="true">
        <LiquidEther
          colors={["#d7e6fa", "#b9cbe4", "#7ea9df"]}
          mouseForce={16}
          cursorSize={88}
          resolution={0.42}
          autoDemo={true}
          autoSpeed={0.32}
          autoIntensity={1.5}
        />
      </div>

      <PortalHeader
        isEnglish={isEnglish}
        portalMode={portalMode}
        setPortalMode={setPortalMode}
        onLogin={() => openLogin(portalMode === "staff" ? "staff" : "patient")}
        onApply={() => setPortalMode("public")}
        onDonate={guardLogin}
        onSwitchPortal={handleSwitchPortal}
        onToggleLanguage={() => setIsEnglish((current) => !current)}
        sessionUser={sessionUser}
        onGotoHome={onGotoHome}
        onLogout={onLogout}
      />

      {notice ? <div className="portal-notice">{notice}</div> : null}

      {portalMode === "home" ? (
        <HomePortal
          expandedEntry={expandedEntry}
          isEnglish={isEnglish}
          onEntry={handleHomeEntry}
          text={text}
        />
      ) : null}

      {portalMode === "public" ? (
        <PublicPortal isEnglish={isEnglish} onLogin={() => openLogin("patient")} onBlocked={guardLogin} text={text} sessionUser={sessionUser} onGotoHome={onGotoHome} onNavigateTo={onNavigateTo} />
      ) : null}

      {portalMode === "staff" ? (
        <StaffPortal
          isEnglish={isEnglish}
          onLogin={() => openLogin("staff")}
          onBlocked={guardLogin}
          onGotoHome={onGotoHome}
          sessionUser={sessionUser}
          text={text}
        />
      ) : null}

      {isLoginOpen ? (
        <LoginModal
          activeLoginMeta={activeLoginMeta}
          closeLogin={closeLogin}
          focusedField={focusedField}
          isEnglish={isEnglish}
          isRegisterOpen={isRegisterOpen}
          loginForm={loginForm}
          loginMode={loginMode}
          registerForm={registerForm}
          setFocusedField={setFocusedField}
          setIsRegisterOpen={setIsRegisterOpen}
          setLoginForm={setLoginForm}
          setRegisterForm={setRegisterForm}
          setShowPassword={setShowPassword}
          showPassword={showPassword}
          submitLogin={submitLogin}
          submitRegister={submitRegister}
          chooseLoginMode={chooseLoginMode}
          fillDemoAccount={fillDemoAccount}
          isStaffOnly={isStaffOnly}
          loginError={loginError}
        />
      ) : null}

      <PortalAiAssistant
        portalMode={portalMode}
        noticeHandler={onNotice}
        sessionUser={sessionUser}
        onNavigateTo={onNavigateTo}
        onOpenPatientLogin={() => openLogin("patient")}
      />
    </div>
  );
}

function PortalHeader({
  isEnglish,
  portalMode,
  setPortalMode,
  onLogin,
  onApply,
  onDonate,
  onSwitchPortal,
  onToggleLanguage,
  sessionUser,
  onGotoHome,
  onLogout
}) {
  const isStaffMode = portalMode === "staff";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // 头像内容
  const avatarText = sessionUser ? (sessionUser.realName?.[0] || sessionUser.username?.[0] || "U") : "";

  return (
    <header className="portal-header portal-header-minimal" style={{ position: "relative", zIndex: 9999, overflow: "visible" }}>
      <button className="portal-brand-button" type="button" onClick={() => setPortalMode("public")}> 
        <BrandLogo
          size="sm"
          title={isEnglish ? "Rongcheng MedHub" : "蓉城医枢"}
          subtitle={isEnglish ? "Smart Healthcare Platform" : "智慧医疗协同平台"}
        />
      </button>

      <div className="portal-header__actions">
        {sessionUser ? (
          <div className="portal-header__avatar-menu" style={{ position: "relative", display: "inline-block", zIndex: 10000 }}>
            <button
              className="portal-header__avatar"
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "#1976d2", color: "#fff", fontWeight: 600, fontSize: 18, border: "none", cursor: "pointer" }}
              aria-label="用户菜单"
            >
              {avatarText}
            </button>
            {menuOpen && (
              <div ref={menuRef} style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", borderRadius: 8, minWidth: 140, zIndex: 10001, padding: 4, border: "1px solid #e0e0e0" }}>
                <button style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", borderRadius: 4, transition: "background 0.2s", color: "#333", fontSize: 14 }} onClick={() => { setMenuOpen(false); onGotoHome && onGotoHome(); }} onMouseEnter={(e) => e.target.style.background = "#f5f5f5"} onMouseLeave={(e) => e.target.style.background = "none"}>
                  {isEnglish ? "My Home" : "我的首页"}
                </button>
                <button style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", borderRadius: 4, transition: "background 0.2s", color: "#333", fontSize: 14 }} onClick={() => { setMenuOpen(false); onLogout && onLogout(); }} onMouseEnter={(e) => e.target.style.background = "#f5f5f5"} onMouseLeave={(e) => e.target.style.background = "none"}>
                  {isEnglish ? "Logout" : "退出登录"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="portal-header__link portal-header__link-strong" type="button" onClick={onLogin}>
            {isEnglish ? "Login" : "登录"}
          </button>
        )}
        <button className="portal-header__link" type="button" onClick={onSwitchPortal}>
          {isEnglish ? (isStaffMode ? "Public Portal" : "Staff Portal") : isStaffMode ? "切换公众版" : "切换员工版"}
        </button>
        <button className="portal-header__link portal-header__link-strong" type="button" onClick={onApply}>
          {isEnglish ? "Appointment" : "申请约诊"}
        </button>
        <button className="portal-header__link" type="button" onClick={onDonate}>
          {isEnglish ? "Donation" : "慷慨捐款"}
        </button>
        <button className="portal-header__link" type="button" onClick={onToggleLanguage}>
          {isEnglish ? "Language" : "切换语言"}
        </button>
      </div>
    </header>
  );
}

function HomePortal({ expandedEntry, isEnglish, onEntry, text }) {
  return (
    <main className="portal-main">
      <section className="portal-hero-card portal-hero-gallery" aria-label={text.galleryAria}>
        <CircularGallery
          items={GALLERY_ITEMS}
          bend={2.4}
          textColor="rgba(255,255,255,0)"
          borderRadius={0.06}
          scrollEase={0.03}
          centerOffsetY={0.28}
          initialIndex={1}
          autoPlay
          autoPlaySpeed={0.018}
        />
      </section>

      <section className="portal-entry-stage" aria-label={text.entryAria}>
        <div className="portal-entry-stage__glow" aria-hidden="true" />
        <div className="portal-entry-board">
          {HOME_ENTRY_ITEMS.map((item) => (
            <button
              className={`portal-entry-card portal-entry-card-${item.tone} ${
                expandedEntry === item.key ? "portal-entry-card-active" : ""
              }`}
              key={item.key}
              type="button"
              onClick={() => onEntry(item.key)}
            >
              <span className="portal-entry-card__subtitle">{item.subtitle}</span>
              <strong>{isEnglish ? item.titleEn : item.title}</strong>
              <p>{isEnglish ? item.descriptionEn : item.description}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function PublicPortal({ isEnglish, onLogin, onBlocked, text, sessionUser, onGotoHome, onNavigateTo }) {
  const [activeInfoPanel, setActiveInfoPanel] = useState(null);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll(".public-scroll-reveal"));
    if (!targets.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("public-scroll-reveal-visible");
            return;
          }

          entry.target.classList.remove("public-scroll-reveal-visible");
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="portal-subpage public-portal-v3">
      <section className="public-hero-window public-home-module public-home-module-hero">
        <div className="public-hero-window__visual public-hero-window__visual-staff" aria-hidden="true">
          <div className="public-hero-window__gallery">
            <CircularGallery
              items={GALLERY_ITEMS}
              bend={2.4}
              textColor="rgba(255,255,255,0)"
              borderRadius={0.06}
              scrollEase={0.03}
              centerOffsetY={0.3}
              initialIndex={1}
              autoPlay
              autoPlaySpeed={0.016}
            />
          </div>
        </div>
        <div className="public-hero-window__overlay public-hero-window__overlay-staff">
          <div>
            <p className="portal-kicker">{text.publicKicker}</p>
            <h1>{text.publicTitle}</h1>
            <p>{text.publicCopy}</p>
          </div>
          <div className="portal-hero__actions">
            {sessionUser ? (
              // 如果是患者账号，显示进入主页按钮
              (sessionUser.roleCode === "PATIENT") && (
                <button className="primary-button" type="button" onClick={() => onGotoHome && onGotoHome()}>{isEnglish ? "Enter Dashboard" : "进入主页"}</button>
              )
            ) : (
              <button className="primary-button" type="button" onClick={onLogin}>{text.login}</button>
            )}
            <button className="ghost-button portal-secondary-hero-button" type="button" onClick={onBlocked}>{text.guide}</button>
          </div>
        </div>
      </section>

      <section className="public-service-strip public-home-module public-home-module-services">
        {text.publicQuick.map((item) => {
          const handleClick = () => {
            if (item.panelKey) {
              setActiveInfoPanel((current) => (current === item.panelKey ? null : item.panelKey));
              return;
            }

            if (item.login) {
              if (sessionUser) {
                // 如果是员工账号，显示提示
                if (sessionUser.roleCode !== "PATIENT") {
                  alert("员工账号无法使用预约挂号功能，请切换到员工版或使用患者账号登录。");
                  return;
                }
                // 如果已登录且是患者账号，直接跳转到挂号管理页面
                onNavigateTo && onNavigateTo('registration');
              } else {
                onLogin();
              }
            } else {
              onBlocked();
            }
          };
          return (
            <button className="public-service-item" key={item.title} type="button" onClick={handleClick}>
              <span className="public-service-item__icon">
                <PublicServiceIcon iconKey={item.iconKey} />
              </span>
              <strong>{item.title}</strong>
              <span>{item.copy}</span>
            </button>
          );
        })}
      </section>

      {activeInfoPanel ? (
        <section className="public-info-panel public-home-module" aria-live="polite">
          <div className="section-heading-inline">
            <div>
              <p className="eyebrow">{text.publicInfoPanels[activeInfoPanel].eyebrow}</p>
              <h3>{text.publicInfoPanels[activeInfoPanel].title}</h3>
            </div>
            <button className="tiny-button" type="button" onClick={() => setActiveInfoPanel(null)}>
              {isEnglish ? "Close" : "收起"}
            </button>
          </div>
          <p className="public-info-panel__copy">{text.publicInfoPanels[activeInfoPanel].copy}</p>
          <div className="public-info-flow-list">
            {text.publicInfoPanels[activeInfoPanel].items.map((item) => (
              <article className="public-info-flow-card" key={item.title}>
                <span>{item.step}</span>
                <strong>{item.title}</strong>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="public-info-grid">
        <div className="public-info-row">
          <article className="public-feature-panel public-home-module public-scroll-reveal public-scroll-reveal-left">
            <div className="section-heading-inline">
              <h3>{text.techTitle}</h3>
              <button className="tiny-button" type="button" onClick={onBlocked}>{text.more}</button>
            </div>
            <div className="public-feature-content">
              <ul className="portal-news-list compact">
                {text.techItems.map((item) => (
                  <li key={item.title}>
                    <a href={item.url}>{item.title}</a>
                  </li>
                ))}
              </ul>
              <img
                className="public-feature-image public-feature-image-top"
                src={publicFeatureTop}
                alt={isEnglish ? "Medical technology illustration" : "医疗科技插画"}
              />
            </div>
          </article>

          <section className="public-news-board public-news-board-stacked public-home-module public-scroll-reveal public-scroll-reveal-right">
            <article className="public-panel">
              <div className="section-heading-inline">
                <h3>{text.noticeTitle}</h3>
                <button className="tiny-button" type="button" onClick={onBlocked}>{text.more}</button>
              </div>
              <div className="public-tabs">
                {text.publicTabs.map((tab) => <button key={tab} type="button" onClick={onBlocked}>{tab}</button>)}
              </div>
              <ul className="portal-news-list">
                {text.publicNews.map((item) => (
                  <li key={item.title}>
                    <a href={item.url}>{item.title}</a>
                  </li>
                ))}
              </ul>
            </article>

            <article className="public-panel">
              <div className="section-heading-inline">
                <h3>{text.medicalNewsTitle}</h3>
                <button className="tiny-button" type="button" onClick={onBlocked}>{text.more}</button>
              </div>
              <ul className="portal-news-list compact">
                {text.medicalNews.map((item) => (
                  <li key={item.title}>
                    <a href={item.url}>{item.title}</a>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </div>

        <div className="public-info-row">
          <section className="public-health-section public-health-section-stacked public-home-module public-scroll-reveal public-scroll-reveal-left">
            <img
              className="public-health-visual public-health-visual-bottom"
              src={publicFeatureBottom}
              alt={isEnglish ? "Digital health care illustration" : "数字医疗插画"}
            />
            <article className="public-health-card">
              <div className="section-heading-inline">
                <h3>{text.healthTitle}</h3>
                <button className="tiny-button" type="button" onClick={onBlocked}>{text.more}</button>
              </div>
              <ul className="portal-news-list compact">
                {text.healthNews.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </section>

          <section className="public-news-board public-news-board-stacked public-home-module public-scroll-reveal public-scroll-reveal-right">
            <article className="public-panel">
              <div className="section-heading-inline">
                <h3>{text.educationTitle}</h3>
                <button className="tiny-button" type="button" onClick={onBlocked}>{text.more}</button>
              </div>
              <ul className="portal-news-list compact">
                {text.educationNews.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>

            <article className="public-panel">
              <div className="section-heading-inline">
                <h3>{text.academicTitle}</h3>
                <button className="tiny-button" type="button" onClick={onBlocked}>{text.more}</button>
              </div>
              <ul className="portal-news-list compact">
                {text.academicNews.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </section>
        </div>

        <section className="public-topic-section public-topic-section-wide public-home-module public-scroll-reveal public-scroll-reveal-right">
          <div className="section-heading-inline">
            <h3>{text.topicTitle}</h3>
            <button className="tiny-button" type="button" onClick={onBlocked}>{text.more}</button>
          </div>
          <div className="public-topic-grid">
            {text.topics.map((item) => <button key={item} type="button" onClick={onBlocked}>{item}</button>)}
          </div>
        </section>
      </section>
    </main>
  );
}

function StaffPortal({ isEnglish, onLogin, onBlocked, onGotoHome, sessionUser, text }) {
  const nav = isEnglish ? STAFF_NAV_EN : STAFF_NAV;
  const featuredNotice = text.staffNoticeGroups?.[0]?.items?.[0];
  const secondaryNotices = text.staffNoticeGroups?.[0]?.items?.slice(1, 6) ?? [];
  const isStaffUser = ["DOCTOR", "PHARMACIST", "ADMIN"].includes(sessionUser?.roleCode);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll(".staff-scroll-reveal"));
    if (!targets.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("staff-scroll-reveal-visible");
            return;
          }

          entry.target.classList.remove("staff-scroll-reveal-visible");
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="portal-subpage staff-subpage staff-portal-v2">
      <nav className="portal-subnav">
        {nav.map((item, index) => (
          <button key={item} type="button" onClick={index === 0 ? undefined : onBlocked}>
            {item}
          </button>
        ))}
      </nav>

      <section className="staff-hero-banner staff-scroll-reveal staff-scroll-reveal-up">
        <div>
          <p className="eyebrow">{text.staffHeroKicker}</p>
          <h1>{text.staffHeroTitle}</h1>
          <p>{text.staffHeroCopy}</p>
        </div>
        <div className="portal-hero__actions staff-hero-actions">
          {isStaffUser ? (
            <button className="primary-button staff-hero-home-button" type="button" onClick={onGotoHome}>
              {isEnglish ? "Enter Doctor Dashboard" : "进入医生后台主页"}
            </button>
          ) : (
            <button className="primary-button staff-hero-home-button" type="button" onClick={onLogin}>
              {text.staffLogin}
            </button>
          )}
          <button className="ghost-button portal-secondary-hero-button" type="button" onClick={onBlocked}>
            {isEnglish ? "System Guide" : "系统指南"}
          </button>
        </div>
      </section>

      <section className="staff-notice-stage staff-scroll-reveal staff-scroll-reveal-left">
        <div className="staff-section-title">
          <span>{text.staffNotice}</span>
          <button type="button" onClick={onBlocked}>{text.more}</button>
        </div>

        <div className="staff-notice-shell">
          <div className="staff-notice-tabs">
            {text.staffNoticeGroups.map((group, index) => (
              <button
                className={index === 0 ? "staff-notice-tab staff-notice-tab-active" : "staff-notice-tab"}
                key={group.title}
                type="button"
                onClick={onBlocked}
              >
                {group.title}
              </button>
            ))}
          </div>

          <div className="staff-notice-content">
            {featuredNotice ? (
              <article className="staff-notice-feature" onClick={onBlocked}>
                <span>{featuredNotice.date}</span>
                <h3>{featuredNotice.title}</h3>
                <p>{featuredNotice.copy}</p>
              </article>
            ) : null}

            <ul className="staff-notice-list">
              {secondaryNotices.map((item) => (
                <li key={item.title}>
                  <button type="button" onClick={onBlocked}>
                    <span>{item.title}</span>
                    <time>{item.date}</time>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="staff-news-layout">
        <article className="staff-news-unit staff-news-unit-large staff-scroll-reveal staff-scroll-reveal-left">
          <div className="staff-section-title">
            <span>{text.staffComprehensiveTitle}</span>
            <button type="button" onClick={onBlocked}>{text.more}</button>
          </div>
          <button className="staff-news-lead" type="button" onClick={onBlocked}>
            <time>{text.staffComprehensiveLead.date}</time>
            <strong>{text.staffComprehensiveLead.title}</strong>
            <span>{text.staffComprehensiveLead.copy}</span>
          </button>
          <div className="staff-news-lines">
            {text.staffComprehensiveList.map((item) => (
              <button key={item.title} type="button" onClick={onBlocked}>
                <span>{item.title}</span>
                <time>{item.date}</time>
              </button>
            ))}
          </div>
        </article>

        <article className="staff-news-unit staff-scroll-reveal staff-scroll-reveal-right">
          <div className="staff-section-title">
            <span>{text.staffMedicalTitle}</span>
            <button type="button" onClick={onBlocked}>{text.more}</button>
          </div>
          <div className="staff-mini-card-list">
            {text.staffMedicalNews.map((item) => (
              <button className="staff-mini-card" key={item.title} type="button" onClick={onBlocked}>
                <img className="staff-mini-card__image" src={item.image} alt={item.title} />
                <strong>{item.title}</strong>
                <time>{item.date}</time>
              </button>
            ))}
          </div>
        </article>

        <article className="staff-news-unit staff-scroll-reveal staff-scroll-reveal-left">
          <div className="staff-section-title">
            <span>{text.staffTeachingTitle}</span>
            <button type="button" onClick={onBlocked}>{text.more}</button>
          </div>
          <div className="staff-date-list">
            {text.staffTeachingNews.map((item) => (
              <button key={item.title} type="button" onClick={onBlocked}>
                <span className="staff-date-pill">{item.date}</span>
                <strong>{item.title}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="staff-news-unit staff-news-unit-stack staff-scroll-reveal staff-scroll-reveal-right">
          <div>
            <div className="staff-section-title">
              <span>{text.staffAcademicTitle}</span>
              <button type="button" onClick={onBlocked}>{text.more}</button>
            </div>
            <div className="staff-news-lines staff-news-lines-tight">
              {text.staffAcademicNews.map((item) => (
                <button key={item.title} type="button" onClick={onBlocked}>
                  <span>{item.title}</span>
                  <time>{item.date}</time>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="staff-section-title">
              <span>{text.staffTopicTitle}</span>
              <button type="button" onClick={onBlocked}>{text.more}</button>
            </div>
            <div className="staff-topic-cards">
              {text.staffTopics.map((item) => (
                <button key={item} type="button" onClick={onBlocked}>{item}</button>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="staff-tools-canvas staff-scroll-reveal staff-scroll-reveal-left">
        <div className="staff-section-title staff-section-title-light">
          <span>{text.staffLinks}</span>
          <button type="button" onClick={onLogin}>{text.staffLogin}</button>
        </div>
        <div className="staff-tool-mosaic">
          {text.staffSystems.map((item, index) => (
            <button key={item} type="button" onClick={index === 0 ? onLogin : onBlocked}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </button>
          ))}
        </div>
      </section>

      <section
        className="staff-bottom-banner staff-scroll-reveal staff-scroll-reveal-up"
        aria-label={text.staffBottomAria}
      >
        <span>{text.staffBottomText}</span>
      </section>
    </main>
  );
}

function LoginModal({
  activeLoginMeta,
  chooseLoginMode,
  closeLogin,
  fillDemoAccount,
  focusedField,
  isEnglish,
  isRegisterOpen,
  loginForm,
  loginMode,
  registerForm,
  setFocusedField,
  setIsRegisterOpen,
  setLoginForm,
  setRegisterForm,
  setShowPassword,
  showPassword,
  submitLogin,
  submitRegister,
  isStaffOnly, // 是否只显示员工登录
  loginError // 登录错误信息
}) {
  const label = isEnglish ? activeLoginMeta.labelEn : activeLoginMeta.label;
  const helper = isEnglish ? activeLoginMeta.helperEn : activeLoginMeta.helper;
  const placeholder = isEnglish ? activeLoginMeta.placeholderEn : activeLoginMeta.placeholder;

  return (
    <div className="portal-login-backdrop" onClick={closeLogin} role="presentation">
      <section className="portal-login-modal portal-login-modal-wide" onClick={(event) => event.stopPropagation()}>
        <div className="portal-login-modal__header">
          <div>
            <p className="eyebrow">{isEnglish ? "LOGIN" : "登录入口"}</p>
            <h2>{label}</h2>
            <p className="portal-login-modal__copy">
              {isEnglish
                ? "The interactive characters respond to mouse movement, typing and password visibility."
                : "右侧小人会根据鼠标移动、输入状态和密码显示状态做出互动反馈。"}
            </p>
          </div>
          <button className="portal-login-modal__close" type="button" onClick={closeLogin}>
            {isEnglish ? "Close" : "关闭"}
          </button>
        </div>

        <div className="portal-login-shell">
          <div className="portal-login-shell__form">
            <div className="login-mode-switch">
              {Object.entries(LOGIN_MODE_META)
                .filter(([key]) => !isStaffOnly || (key !== "patient" && key !== "demo"))
                .map(([key, meta]) => (
                  <button
                    key={key}
                    className={key === loginMode ? "login-mode-button login-mode-button-active" : "login-mode-button"}
                    type="button"
                    onClick={() => chooseLoginMode(key)}
                  >
                    {isEnglish ? meta.labelEn : meta.label}
                  </button>
                ))}
            </div>

            <div className="auth-mode-hint">
              <strong>{label}</strong>
              <span>{helper}</span>
            </div>

            <form className="stacked-form" onSubmit={submitLogin}>
              <div className="field-grid">
                <label>
                  {isEnglish ? "Login ID / Phone" : "登录编号 / 手机号"}
                  <input
                    autoComplete="username"
                    placeholder={placeholder}
                    value={loginForm.loginId}
                    onFocus={() => setFocusedField("loginId")}
                    onBlur={() => setFocusedField("")}
                    onChange={(event) => setLoginForm((current) => ({ ...current, loginId: event.target.value }))}
                  />
                </label>
                <label>
                  {isEnglish ? "Password" : "密码"}
                  <div className="password-field">
                    <input
                      autoComplete="current-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isEnglish ? "Password" : "请输入密码"}
                      value={loginForm.password}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField("")}
                      onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    />
                    <button className="password-field__toggle" type="button" onClick={() => setShowPassword((current) => !current)}>
                      {showPassword ? (isEnglish ? "Hide" : "隐藏") : (isEnglish ? "Show" : "显示")}
                    </button>
                  </div>
                </label>
              </div>
              
              {/* 红色错误提示 */}
              {loginError && (
                <div style={{ color: "#dc2626", fontSize: 14, marginTop: 8, marginBottom: 12, textAlign: "left" }}>
                  {loginError}
                </div>
              )}

              <div className="inline-actions">
                <button className="primary-button" type="submit">{isEnglish ? "Login" : "登录系统"}</button>
                <button className="ghost-button" type="button" onClick={fillDemoAccount}>
                  {isEnglish
                    ? loginMode === "staff" || isStaffOnly
                      ? "Use Doctor Demo"
                      : "Use Patient Demo"
                    : loginMode === "staff" || isStaffOnly
                      ? "填入医生演示账号"
                      : "填入患者演示账号"}
                </button>
              </div>
            </form>

            <div className="auth-register-entry">
              <div>
                <strong>{isEnglish ? "No account?" : "还没有账号？"}</strong>
                <p className="muted-copy">{isEnglish ? "Patients can register here." : "患者可在这里完成自助注册，注册成功后直接登录。"}</p>
              </div>
              <button className={isRegisterOpen ? "ghost-button" : "secondary-button"} type="button" onClick={() => setIsRegisterOpen((current) => !current)}>
                {isRegisterOpen ? (isEnglish ? "Collapse" : "收起注册") : (isEnglish ? "Register" : "立即注册")}
              </button>
            </div>

            {isRegisterOpen ? (
              <RegisterForm
                isEnglish={isEnglish}
                registerForm={registerForm}
                setRegisterForm={setRegisterForm}
                setIsRegisterOpen={setIsRegisterOpen}
                submitRegister={submitRegister}
              />
            ) : null}
          </div>

          <aside className="portal-login-shell__visual">
            <div className="portal-login-visual-card">
              <AnimatedCharacters
                isTyping={focusedField === "loginId"}
                isUsernameFocused={focusedField === "loginId"}
                isPasswordFocused={focusedField === "password"}
                showPassword={showPassword}
                passwordLength={loginForm.password.length}
              />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function RegisterForm({ isEnglish, registerForm, setRegisterForm, setIsRegisterOpen, submitRegister }) {
  return (
    <form className="stacked-form auth-register-form" onSubmit={submitRegister}>
      <div className="auth-register-heading">
        <div>
          <h3>{isEnglish ? "Patient Register" : "患者注册"}</h3>
          <span>{isEnglish ? "Create an account for patient services." : "创建后即可进入患者首页、挂号记录与用药提醒功能。"}</span>
        </div>
      </div>

      <div className="field-grid">
        <label>
          {isEnglish ? "Phone" : "手机号"}
          <input
            autoComplete="tel"
            inputMode="numeric"
            maxLength={11}
            placeholder={isEnglish ? "11-digit phone number" : "请输入 11 位手机号"}
            value={registerForm.phoneNumber}
            onChange={(event) => setRegisterForm((current) => ({ ...current, phoneNumber: event.target.value }))}
          />
        </label>
        <label>
          {isEnglish ? "Real Name" : "真实姓名"}
          <input
            autoComplete="name"
            placeholder={isEnglish ? "Patient name" : "请输入患者姓名"}
            value={registerForm.realName}
            onChange={(event) => setRegisterForm((current) => ({ ...current, realName: event.target.value }))}
          />
        </label>
      </div>

      <div className="field-grid">
        <label>
          {isEnglish ? "Password" : "登录密码"}
          <input
            autoComplete="new-password"
            type="password"
            placeholder={isEnglish ? "Set password" : "请设置登录密码"}
            value={registerForm.password}
            onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>
        <label>
          {isEnglish ? "Confirm" : "确认密码"}
          <input
            autoComplete="new-password"
            type="password"
            placeholder={isEnglish ? "Confirm password" : "请再次输入密码"}
            value={registerForm.confirmPassword}
            onChange={(event) => setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))}
          />
        </label>
      </div>

      <div className="field-grid field-grid-3">
        <label>
          {isEnglish ? "Gender" : "性别"}
          <select value={registerForm.gender} onChange={(event) => setRegisterForm((current) => ({ ...current, gender: event.target.value }))}>
            <option value="女">{isEnglish ? "Female" : "女"}</option>
            <option value="男">{isEnglish ? "Male" : "男"}</option>
          </select>
        </label>
        <label>
          {isEnglish ? "Birthdate" : "出生日期"}
          <input type="date" value={registerForm.birthdate} onChange={(event) => setRegisterForm((current) => ({ ...current, birthdate: event.target.value }))} />
        </label>
        <label>
          {isEnglish ? "ID Card" : "身份证号"}
          <input
            placeholder={isEnglish ? "ID card number" : "请输入身份证号"}
            value={registerForm.cardNumber}
            onChange={(event) => setRegisterForm((current) => ({ ...current, cardNumber: event.target.value }))}
          />
        </label>
      </div>

      <label>
        {isEnglish ? "Address" : "家庭住址"}
        <textarea
          rows="3"
          placeholder={isEnglish ? "Home address" : "请输入常住地址"}
          value={registerForm.homeAddress}
          onChange={(event) => setRegisterForm((current) => ({ ...current, homeAddress: event.target.value }))}
        />
      </label>

      <div className="inline-actions">
        <button className="secondary-button" type="submit">{isEnglish ? "Create Account" : "创建患者账号"}</button>
        <button
          className="ghost-button"
          type="button"
          onClick={() => {
            setIsRegisterOpen(false);
            setRegisterForm({ ...DEFAULT_REGISTER_FORM });
          }}
        >
          {isEnglish ? "Cancel" : "暂不注册"}
        </button>
      </div>
    </form>
  );
}

function getPortalText(isEnglish) {
  if (isEnglish) {
    return {
      galleryAria: "Rongcheng MedHub gallery",
      entryAria: "Portal entries",
      publicKicker: "PUBLIC SERVICES",
      publicTitle: "Rongcheng MedHub Public Portal",
      publicCopy: "A public-facing service page for appointments, medication reminders, check-ins and healthcare guidance.",
      login: "Login",
      guide: "Service Guide",
      publicQuick: [
        { title: "Appointment", copy: "Book and review visit services.", iconKey: "calendar", login: true },
        { title: "Visit Guide", copy: "View service process and reminders.", iconKey: "medicine", panelKey: "guide" },
        { title: "Service Map", copy: "Find departments and service areas.", iconKey: "map", panelKey: "navigation" },
        { title: "Announcements", copy: "View public notices and updates.", iconKey: "document" }
      ],
      publicInfoPanels: {
        guide: {
          eyebrow: "Patient Guide",
          title: "Visit Guide",
          copy: "Key reminders for online appointment, arrival, consultation and follow-up.",
          items: [
            { step: "01", title: "Online appointment process", copy: "Log in, choose department and doctor, submit symptoms, then review the appointment on your patient home page." },
            { step: "02", title: "Before you arrive", copy: "Prepare ID, previous reports, medication list, allergy history and a brief symptom timeline." },
            { step: "03", title: "During the visit", copy: "Follow reception guidance, describe symptoms clearly, and confirm prescription or medication reminders before leaving." },
            { step: "04", title: "After the visit", copy: "Check medication plans, complete daily check-ins, and leave messages for doctors when follow-up questions appear." }
          ]
        },
        navigation: {
          eyebrow: "Service Map",
          title: "Service Navigation",
          copy: "Common public service entrances for patients and family members.",
          items: [
            { step: "A", title: "Appointment entrance", copy: "Use this entrance when you need to book a department, doctor or visit time." },
            { step: "B", title: "Medication reminder entrance", copy: "View medication plans, conflict reminders and check-in records after the doctor saves a prescription." },
            { step: "C", title: "Smart pharmacy entrance", copy: "Review dispensing status, inventory linkage and medication pickup reminders." },
            { step: "D", title: "Doctor message entrance", copy: "Send follow-up questions to doctors based on existing visit records." }
          ]
        }
      },
      noticeTitle: "Announcements",
      centerTitle: "Featured Centers",
      more: "More",
      publicTabs: ["Notice", "Recruitment", "Disclosure", "FAQ"],
      publicNews: [
        { title: "Medication conflict reminder module enters public beta.", url: "/article.html?id=notice-drug-conflict" },
        { title: "Patient check-in service supports daily adherence records.", url: "/article.html?id=notice-medication-checkin" },
        { title: "Smart pharmacy workflow connects prescriptions and inventory.", url: "/article.html?id=notice-smart-pharmacy" }
      ],
      centers: [
        { title: "Medication Center", icon: "药" },
        { title: "Check-in Center", icon: "卡" },
        { title: "Conflict Alert", icon: "警" },
        { title: "Smart Pharmacy", icon: "房" },
        { title: "Follow-up Center", icon: "访" },
        { title: "AI Guide", icon: "AI" },
        { title: "Care Team", icon: "护" },
        { title: "Patient Service", icon: "患" }
      ],
      techTitle: "Featured Services",
      techItems: [
        { title: "Drug interaction screening and warning workflow", url: "/article.html?id=drug-interaction" },
        { title: "Medication plan check-in and adherence tracking", url: "/article.html?id=medication-checkin" },
        { title: "Doctor-pharmacist collaborative prescription review", url: "/article.html?id=prescription-review" },
        { title: "Smart pharmacy inventory and dispensing linkage", url: "/article.html?id=smart-pharmacy" },
        { title: "AI-assisted patient guidance and follow-up", url: "/article.html?id=ai-guidance" }
      ],
      teamTitle: "Expert Team",
      teamCopy: "Clinical, pharmacy and nursing roles collaborate in one service flow.",
      medicalNewsTitle: "Medical News",
      medicalNews: [
        { title: "Medication reminder rules support multi-dose schedules.", url: "/article.html?id=medical-news-medication-rule" },
        { title: "Smart pharmacy console links prescriptions and inventory.", url: "/article.html?id=medical-news-smart-pharmacy" },
        { title: "Patient follow-up services are connected with visit records.", url: "/article.html?id=medical-news-followup" }
      ],
      educationTitle: "Education News",
      educationNews: [
        "Medication safety education module added to patient services.",
        "Clinical workflow simulation materials prepared for project demo.",
        "Care collaboration training supports multi-role operation."
      ],
      academicTitle: "Academic News",
      academicNews: [
        "Medication conflict review rules support scenario-based validation.",
        "Smart pharmacy process model completed the first demonstration round.",
        "Clinical collaboration storyboards were updated for the public portal."
      ],
      healthTitle: "Health Education",
      healthNews: [
        "How to understand medication interaction reminders?",
        "What should patients do after missing a dose?",
        "Daily check-in improves medication adherence records."
      ],
      topicTitle: "Special Topics",
      topics: ["Smart Medication", "Safe Check-in", "Care Collaboration"],
      staffHeroKicker: "STAFF WORKSPACE",
      staffHeroTitle: "Rongcheng MedHub Staff Portal",
      staffHeroCopy: "A staff-facing portal for internal notices, clinical operations, medication collaboration and project systems.",
      staffNotice: "Internal Notices",
      staffLogin: "Staff Login",
      staffNoticeGroups: [
        {
          title: "Outpatient",
          items: [
            {
              title: "Outpatient prescription review and patient reception rehearsal",
              date: "2026.04.18",
              copy: "Doctors, pharmacists and nurses can jointly verify the outpatient reception, order review and discharge guidance flow before the hospital showcase."
            },
            { title: "Medication conflict rule library maintenance arrangement", date: "2026.04.16" },
            { title: "Pharmacy inventory and dispensing linkage update", date: "2026.04.12" },
            { title: "Nursing follow-up and medication education drill notice", date: "2026.04.08" },
            { title: "Chronic disease patient return-visit script updated", date: "2026.04.01" },
            { title: "Doctor-pharmacist collaborative service briefing", date: "2026.03.28" }
          ]
        },
        { title: "Pharmacy", items: [] },
        { title: "Nursing", items: [] },
        { title: "Research", items: [] },
        { title: "Hospital", items: [] }
      ],
      staffLinks: "Common Staff Entries",
      staffComprehensiveTitle: "Comprehensive News",
      staffComprehensiveLead: {
        title: "Rongcheng MedHub completes the first full-flow collaborative demo",
        date: "18.04.2026",
        copy: "The platform connects patient appointment, diagnosis, prescription review, medication reminders and pharmacy dispensing into one competition-ready route."
      },
      staffComprehensiveList: [
        { title: "Medication check-in data joins the staff dashboard", date: "2026.04.17" },
        { title: "Public and staff portal switching structure updated", date: "2026.04.15" }
      ],
      staffMedicalTitle: "Medical News",
      staffMedicalNews: [
        { title: "Drug interaction alerts support multi-rule screening", date: "2026.04.14", image: staffMedicalNews1 },
        { title: "Smart pharmacy console connects prescriptions and stock", date: "2026.04.10", image: staffMedicalNews2 }
      ],
      staffTeachingTitle: "Education News",
      staffTeachingNews: [
        { title: "Multi-role operation script prepared for project defense", date: "04 / 18" },
        { title: "Medication safety education content added", date: "04 / 16" },
        { title: "Clinical workflow training supports public demo", date: "04 / 12" },
        { title: "Pharmacy check-in case materials updated", date: "04 / 08" }
      ],
      staffAcademicTitle: "Research News",
      staffAcademicNews: [
        { title: "Medication adherence data model scenario completed", date: "2026.04.17" },
        { title: "AI-assisted review prototype enters demo verification", date: "2026.04.13" },
        { title: "Clinical-pharmacy collaboration process refined", date: "2026.04.08" }
      ],
      staffTopicTitle: "Special Columns",
      staffTopics: ["Smart Medication", "Pharmacy Collaboration", "Patient Follow-up", "AI Review"],
      staffSystems: [
        "Doctor Workbench",
        "Prescription Review",
        "Medication Rule Library",
        "Pharmacy Inventory",
        "Dispensing Console",
        "Check-in Statistics",
        "Patient Follow-up",
        "AI Assistant",
        "Operations Dashboard",
        "Admin Console",
        "Project Materials",
        "Staff Mailbox"
      ],
      staffBottomAria: "Staff portal decorative banner",
      staffBottomText: "Rongcheng MedHub · Smart care collaboration"
    };
  }

  return {
    galleryAria: "蓉城医枢视觉展示",
    entryAria: "版本入口",
    publicKicker: "公众服务",
    publicTitle: "蓉城医枢公众版",
    publicCopy: "面向患者与家属集中展示预约挂号、门诊指引、健康宣教、药事提醒与就医服务入口，适配医院对外展示与日常使用场景。",
    login: "登录",
    guide: "就诊指南",
    publicQuick: [
      { title: "预约挂号", copy: "进入患者预约与就诊服务。", iconKey: "calendar", login: true },
      { title: "就诊指南", copy: "查看流程、提醒与服务说明。", iconKey: "medicine", panelKey: "guide" },
      { title: "服务导航", copy: "查看科室、药房与服务入口。", iconKey: "map", panelKey: "navigation" },
      { title: "公示公告", copy: "查看平台公告与服务通知。", iconKey: "document" }
    ],
    publicInfoPanels: {
      guide: {
        eyebrow: "就诊说明",
        title: "就诊指南",
        copy: "围绕线上预约、到院准备、门诊接诊和诊后随访，整理患者最常用的流程说明。",
        items: [
          { step: "01", title: "线上预约挂号流程", copy: "登录患者账号后，选择科室、医生和号别，填写症状摘要并提交预约，随后可在患者主页查看记录。" },
          { step: "02", title: "到院前准备事项", copy: "请准备身份证或就诊卡、既往检查报告、正在使用的药物清单、过敏史和主要症状时间线。" },
          { step: "03", title: "门诊接诊注意事项", copy: "接诊时尽量说明症状持续时间、加重或缓解因素、既往病史和用药情况，方便医生判断。" },
          { step: "04", title: "诊后用药与随访", copy: "医生保存处方后，患者主页会同步服药计划、用药提醒、冲突提示和每日打卡记录。" }
        ]
      },
      navigation: {
        eyebrow: "服务入口",
        title: "服务导航",
        copy: "把公众版常用服务入口集中整理，方便患者和家属快速找到对应功能。",
        items: [
          { step: "A", title: "预约挂号入口", copy: "需要预约科室、医生或就诊时间时，优先进入预约挂号功能。" },
          { step: "B", title: "用药提醒入口", copy: "医生保存处方后，可查看服药计划、药物冲突提示和每日打卡记录。" },
          { step: "C", title: "智慧药房入口", copy: "用于查看处方发药状态、库存联动说明和取药相关提醒。" },
          { step: "D", title: "医生留言入口", copy: "已有就诊记录后，可围绕病情变化、用药疑问或复诊问题向医生留言。" }
        ]
      }
    },
    noticeTitle: "公示公告",
    centerTitle: "特色中心导航",
    more: "查看更多",
    publicTabs: ["公告", "招聘", "信息公开", "常见问题"],
    publicNews: [
      { title: "药物冲突提醒模块进入公众体验阶段。", url: "/article.html?id=notice-drug-conflict" },
      { title: "患者服药打卡服务支持每日依从性记录。", url: "/article.html?id=notice-medication-checkin" },
      { title: "智慧药房流程已联动处方、库存与发药状态。", url: "/article.html?id=notice-smart-pharmacy" }
    ],
    centers: [
      { title: "用药提醒中心", icon: "药" },
      { title: "服药打卡中心", icon: "卡" },
      { title: "冲突预警中心", icon: "警" },
      { title: "智慧药房中心", icon: "房" },
      { title: "随访服务中心", icon: "访" },
      { title: "AI 导诊中心", icon: "AI" },
      { title: "医护协同中心", icon: "护" },
      { title: "患者服务中心", icon: "患" }
    ],
    techTitle: "特色服务",
    techItems: [
      { title: "药物相互作用筛查与冲突预警流程", url: "/article.html?id=drug-interaction" },
      { title: "服药计划打卡与患者依从性记录", url: "/article.html?id=medication-checkin" },
      { title: "医生、药师协同处方审核", url: "/article.html?id=prescription-review" },
      { title: "智慧药房库存与发药联动", url: "/article.html?id=smart-pharmacy" },
      { title: "AI 辅助导诊与随访建议", url: "/article.html?id=ai-guidance" }
    ],
    teamTitle: "专家团队",
    teamCopy: "围绕患者、医生、药师与护理角色，构建同一条服务协同链路。",
    medicalNewsTitle: "医疗新闻",
    medicalNews: [
      { title: "用药提醒规则支持多时段服药计划。", url: "/article.html?id=medical-news-medication-rule" },
      { title: "智慧药房工作台已联动处方、库存与发药状态。", url: "/article.html?id=medical-news-smart-pharmacy" },
      { title: "患者随访服务与就诊记录形成闭环。", url: "/article.html?id=medical-news-followup" }
    ],
    educationTitle: "教学新闻",
    educationNews: [
      "药物安全科普模块已加入公众服务页面。",
      "智慧门诊流程演示材料完成更新。",
      "多角色协同训练支持比赛展示。"
    ],
    academicTitle: "学术新闻",
    academicNews: [
      "药物冲突审查规则已支持场景化演示验证。",
      "智慧药房流程模型完成首轮展示联调。",
      "医护协同展示脚本已完成公众版适配。"
    ],
    healthTitle: "健康科普",
    healthNews: [
      "如何理解药物冲突提醒？",
      "漏服药物后应该如何处理？",
      "每日服药打卡为什么能提升用药依从性？"
    ],
    topicTitle: "专题专栏",
  topics: ["智慧用药专题", "安全打卡专题", "医护协同专题"],
    staffHeroKicker: "员工工作台",
    staffHeroTitle: "蓉城医枢员工版",
    staffHeroCopy: "面向医生、药师与管理人员，集中展示院内通知、医疗协同、药事管理、教学科研与常用系统入口。",
  staffNotice: "院内通知",
  staffLogin: "员工登录",
    staffNoticeGroups: [
      {
        title: "门诊通知",
        items: [
          {
            title: "门诊接诊与处方审核联调安排",
            date: "2026.04.18",
            copy: "围绕门诊接诊、处方开立、药房发药和患者随访，统一梳理医院对内演示与日常协同流程。"
          },
          { title: "药物冲突规则库维护安排", date: "2026.04.16" },
          { title: "药房库存与发药联动更新说明", date: "2026.04.12" },
          { title: "护理随访与用药宣教演练通知", date: "2026.04.08" },
          { title: "慢病患者复诊服务脚本已更新", date: "2026.04.01" },
          { title: "医药协同服务流程培训安排", date: "2026.03.28" }
        ]
      },
      { title: "药事管理", items: [] },
      { title: "护理协同", items: [] },
      { title: "学术会议", items: [] },
      { title: "院务公告", items: [] }
    ],
    staffLinks: "员工常用入口",
    staffComprehensiveTitle: "综合新闻",
    staffComprehensiveLead: {
      title: "蓉城医枢完成首轮全流程协同演示",
      date: "18.04.2026",
      copy: "平台将患者预约、医生接诊、处方审核、药物提醒、服药打卡与药房发药整合到同一条比赛展示路径中。"
    },
    staffComprehensiveList: [
      { title: "服药打卡数据接入员工端统计看板", date: "2026.04.17" },
      { title: "公众版与员工版门户切换结构完成更新", date: "2026.04.15" }
    ],
    staffMedicalTitle: "医疗新闻",
    staffMedicalNews: [
      { title: "药物冲突提醒支持多规则联合筛查", date: "2026.04.14", image: staffMedicalNews1 },
      { title: "智慧药房工作台联动处方与库存", date: "2026.04.10", image: staffMedicalNews2 }
    ],
    staffTeachingTitle: "教学新闻",
    staffTeachingNews: [
      { title: "多角色操作脚本已整理用于项目答辩", date: "04 / 18" },
      { title: "药物安全科普内容加入演示材料", date: "04 / 16" },
      { title: "临床协同流程训练支持公众版展示", date: "04 / 12" },
      { title: "药房打卡案例素材完成更新", date: "04 / 08" }
    ],
    staffAcademicTitle: "学术新闻",
    staffAcademicNews: [
      { title: "服药依从性数据模型场景完成设计", date: "2026.04.17" },
      { title: "AI 辅助审方原型进入演示验证", date: "2026.04.13" },
      { title: "临床-药房协同流程完成二次打磨", date: "2026.04.08" }
    ],
    staffTopicTitle: "专题专栏",
    staffTopics: ["智慧用药", "药房协同", "患者随访", "AI 审方"],
    staffSystems: [
      "医生工作台",
      "处方审核台",
      "药物规则库",
      "药房库存台",
      "发药控制台",
      "打卡统计",
      "患者随访台",
      "AI 辅助审方",
      "运营统计",
      "管理后台",
      "项目资料",
      "员工邮箱"
    ],
    staffBottomAria: "员工版装饰横幅",
    staffBottomText: "蓉城医枢 · 智慧医疗协同平台"
  };
}

function formatAssistantStructuredReply(result) {
  const raw = String(result?.rawContent ?? "").trim();
  if (raw && !raw.startsWith("{")) {
    return raw;
  }

  return [result?.primary, result?.secondary, result?.tertiary, result?.risk].filter(Boolean).join("\n") || "当前未返回可展示的智能分析结果。";
}

function formatAssistantRegistrationReply(result) {
  return [
    result?.primary ? `推荐科室：${result.primary}` : "",
    result?.secondary ? `推荐医生：${result.secondary}` : "",
    result?.tertiary ? `就诊建议：${result.tertiary}` : "",
    result?.risk ? `风险提示：${result.risk}` : ""
  ]
    .filter(Boolean)
    .join("\n") || "当前未返回挂号建议。";
}

function normalizeAssistantPrompt(value) {
  return String(value ?? "").trim().toLowerCase();
}

function promptIncludesAny(prompt, keywords) {
  const normalized = normalizeAssistantPrompt(prompt);
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function isPortalTriagePrompt(prompt) {
  return promptIncludesAny(prompt, [
    "推荐科室",
    "挂什么科",
    "看什么科",
    "科室",
    "医生推荐",
    "发烧",
    "发热",
    "咳嗽",
    "头疼",
    "头痛",
    "腹痛",
    "胃痛",
    "胸痛",
    "皮疹",
    "过敏",
    "失眠",
    "焦虑",
    "症状",
    "不舒服",
    "难受"
  ]);
}

function buildPortalSymptomReply(prompt) {
  const normalized = normalizeAssistantPrompt(prompt);

  if (promptIncludesAny(normalized, ["胸痛", "胸闷", "呼吸困难", "喘不上气", "晕厥", "抽搐", "意识不清"])) {
    return "这些症状可能存在急症风险。建议不要只在线上等待，尽快到急诊或拨打当地急救电话；如果身边有人，请让家人或朋友陪同前往。";
  }

  if (promptIncludesAny(normalized, ["发烧", "发热", "低烧", "高烧", "体温"])) {
    return "有点发烧时，建议先测量体温并记录时间，多喝水、注意休息，暂时避免剧烈活动。若体温超过 38.5℃、持续发热超过 24-48 小时，或伴随明显咳嗽、胸闷、呼吸困难、皮疹、意识不清等情况，请尽快线下就医。一般可先考虑内科或发热门诊；儿童建议优先儿科。";
  }

  if (promptIncludesAny(normalized, ["咳嗽", "喉咙痛", "鼻塞", "流涕", "感冒"])) {
    return "咳嗽、喉咙痛或鼻塞多见于呼吸道不适。可以先休息、补水、观察体温，避免熬夜和刺激性饮食。若出现高热不退、气促、胸痛、咳血，或症状持续加重，建议尽快到内科或呼吸相关门诊就诊。";
  }

  if (promptIncludesAny(normalized, ["头疼", "头痛", "头晕"])) {
    return "头痛或头晕可以先观察是否与熬夜、压力、发热、血压波动有关，建议休息、补水，并记录发作时间和程度。若头痛突然非常剧烈，或伴随呕吐、肢体麻木、说话不清、意识异常，请尽快急诊；一般情况可先考虑全科或内科。";
  }

  if (promptIncludesAny(normalized, ["腹痛", "胃痛", "肚子痛", "恶心", "呕吐", "腹泻"])) {
    return "腹痛、胃痛或恶心时，先清淡饮食、少量多次饮水，观察是否有发热、持续呕吐、便血或剧烈疼痛。若疼痛明显、持续加重或伴随黑便/便血，请尽快线下就医；一般可先考虑内科或消化相关门诊。";
  }

  if (promptIncludesAny(normalized, ["皮疹", "过敏", "瘙痒", "红疹"])) {
    return "皮疹或过敏时，先停止接触可疑食物、药物或护肤品，避免抓挠，并观察是否扩散。若出现面唇肿胀、呼吸困难、全身大片风团或发热，请尽快就医；一般情况可先考虑皮肤科。";
  }

  if (promptIncludesAny(normalized, ["失眠", "睡不着", "焦虑", "压力大", "心情低落"])) {
    return "如果主要是失眠、焦虑或压力大，可以先调整作息，减少熬夜和咖啡因摄入，尝试规律睡眠与放松训练。若持续两周以上，或已经明显影响学习、工作和生活，建议到全科门诊进一步评估，必要时转精神心理门诊。";
  }

  if (isPortalTriagePrompt(normalized)) {
    return "我可以先做简单导诊参考。请补充主要症状、持续多久、是否发热或疼痛、有没有既往病史或正在用药；如果症状明显加重，请优先线下就医。";
  }

  return "";
}

function buildCommonDepartmentGuideReply() {
  return [
    "可以先按主要症状选择科室：",
    "1. 发热、咳嗽、咽痛、乏力：优先考虑内科或发热门诊；儿童优先儿科。",
    "2. 腹痛、胃痛、恶心、腹泻：可先考虑内科或消化相关门诊。",
    "3. 皮疹、瘙痒、过敏：可先考虑皮肤科；若伴随呼吸困难或面唇肿胀，请尽快急诊。",
    "4. 胸痛、胸闷、呼吸困难、意识异常：不要只在线上咨询，建议尽快急诊。",
    "如果只是想预约，可以先进入“预约挂号”；如果不确定科室，请补充症状、持续时间、体温和既往病史。"
  ].join("\n");
}

function buildHomePortalReply(prompt) {
  const normalized = normalizeAssistantPrompt(prompt);

  if (promptIncludesAny(normalized, ["介绍", "功能", "平台", "首页", "能做什么", "有什么用"])) {
    return "系统首页主要用于进入两个服务入口：公众版面向患者和家属，可进行预约挂号、查看就诊指南、服务导航和公告；员工版面向医生、药师和管理员，登录后进入接诊、发药、账户管理和运营统计等后台工作台。";
  }

  if (promptIncludesAny(normalized, ["预约", "挂号", "开始", "怎么用", "如何进入"])) {
    return "如果你是患者，建议从首页进入“公众版”，再点击“预约挂号”。登录患者账号后，选择科室、医生和号别，填写症状摘要并提交预约。提交后可以在患者“我的首页”或挂号记录中查看进度。";
  }

  if (promptIncludesAny(normalized, ["员工", "医生", "药师", "管理员", "后台", "工作台"])) {
    return "如果你是医院员工，请从首页进入“员工版”，再使用员工账号登录。医生进入医生后台处理门诊接诊和患者留言；药师进入药房页面处理发药和库存；管理员进入运营后台查看统计、公告和账户权限。";
  }

  if (promptIncludesAny(normalized, ["准备", "首次就诊", "带什么", "材料", "证件"])) {
    return "首次就诊建议准备身份证或就诊卡、联系方式、既往检查报告、正在使用的药物清单、过敏史和主要症状记录。线上预约时尽量写清症状持续时间、是否发热、疼痛部位和既往病史，便于医生判断。";
  }

  return "";
}

function buildPortalRuleReply({ portalMode, prompt, context }) {
  const normalized = normalizeAssistantPrompt(prompt);

  if (!normalized) {
    return "请告诉我你想了解的内容，比如挂号流程、就诊准备、员工工作台入口，或根据症状推荐科室。";
  }

  if (promptIncludesAny(normalized, ["你好", "您好", "hello", "hi", "在吗"])) {
    return `你好，我是蓉城智能护理小助手。当前在“${context.pageLabel}”场景，可以帮你说明页面入口、挂号流程、就诊准备和系统使用方式。`;
  }

  if (promptIncludesAny(normalized, ["天气", "股票", "彩票", "电影", "游戏攻略", "写代码", "做作业", "外卖"])) {
    return "这个问题超出了医院门户助手的服务范围。我可以继续帮你了解挂号、导诊、就诊准备、用药提醒、员工工作台和系统入口相关内容。";
  }

  if (portalMode === "home") {
    const symptomReply = buildPortalSymptomReply(normalized);
    if (symptomReply) {
      return symptomReply;
    }

    if (isPortalTriagePrompt(normalized)) {
      return buildCommonDepartmentGuideReply();
    }

    const homeReply = buildHomePortalReply(normalized);
    if (homeReply) {
      return homeReply;
    }

    return "系统首页用于选择公众版或员工版入口。公众版面向患者和家属，员工版面向医生、药师和管理员。你可以直接问我“怎么挂号”“发烧看什么科”“员工怎么进后台”或“首次就诊准备什么”。";
  }

  if (portalMode === "staff") {
    if (promptIncludesAny(normalized, ["医生后台", "医生工作台", "进入后台", "后台主页", "工作台", "员工入口", "登录"])) {
      return "员工登录后可以进入对应工作台。医生账号进入医生后台主页，可查看接诊概览、处理门诊接诊、回复患者留言；药师账号进入发药与药事协同页面；管理员账号进入运营管理后台。";
    }
    if (promptIncludesAny(normalized, ["药房", "药师", "发药", "处方", "药事"])) {
      return "药事协同主要用于查看待发药处方、核对药品库存、确认发药状态，并配合医生处方完成药物风险提示和库存联动。";
    }
    if (promptIncludesAny(normalized, ["通知", "公告", "新闻", "教学", "科研", "运营"])) {
      return "员工版首页集中展示院内通知、教学科研、药事协同和运营管理入口。你可以通过顶部导航或页面模块查看对应信息，登录后再进入具体业务后台处理任务。";
    }
    return "当前是员工门户。我可以回答员工登录、医生后台、药师发药、运营管理、院内通知和系统协同流程相关问题。若要进入业务后台，请先使用员工账号登录。";
  }

  if (promptIncludesAny(normalized, ["挂号流程", "预约流程", "怎么挂号", "如何挂号", "线上挂号", "预约挂号"])) {
    return "线上挂号可以按这个流程操作：先进入公众版的“预约挂号”，登录患者账号后选择科室、医生和号别，填写症状摘要并提交预约。提交后可以在患者主页查看挂号记录，必要时也可以在退号管理中调整。";
  }

  if (promptIncludesAny(normalized, ["就诊准备", "准备事项", "带什么", "材料", "证件"])) {
    return "就诊前建议准备身份证或就诊卡、既往检查报告、正在使用的药物清单、过敏史和主要症状记录。若是复诊，请一并带上上次诊断或处方信息，方便医生快速了解情况。";
  }

  if (promptIncludesAny(normalized, ["导诊", "服务导航", "入口", "怎么看", "页面"])) {
    return "公众版主要提供预约挂号、就诊指南、服务导航和公示公告入口。需要办理业务时优先点击“预约挂号”；只是了解流程时可以查看“就诊指南”和“服务导航”。";
  }

  if (promptIncludesAny(normalized, ["用药", "服药", "提醒", "打卡", "药物"])) {
    return "用药相关功能需要患者登录后查看。医生保存处方后，患者主页会同步显示服药计划、用药提醒、药物冲突提示和每日打卡记录。";
  }

  const symptomReply = buildPortalSymptomReply(normalized);
  if (symptomReply) {
    return symptomReply;
  }

  if (isPortalTriagePrompt(normalized)) {
    return buildCommonDepartmentGuideReply();
  }

  return "当前是公众门户。我可以帮你说明挂号流程、就诊准备、导诊入口、用药提醒和患者主页相关内容；如果你想根据症状推荐科室，请补充主要症状、持续时间和是否有发热或疼痛。";
}

function buildWorkspaceRuleReply({ sessionUser, activeView, prompt, context }) {
  const normalized = normalizeAssistantPrompt(prompt);

  if (sessionUser.roleCode === "PATIENT") {
    if (activeView === "dashboard") {
      if (promptIncludesAny(normalized, ["推荐科室", "挂什么科", "看什么科", "科室", "症状"])) {
        const symptomReply = buildPortalSymptomReply(normalized);
        return symptomReply || buildCommonDepartmentGuideReply();
      }

      if (promptIncludesAny(normalized, ["用药", "服药", "提醒", "打卡", "药物"])) {
        return "你可以在“用药管家”查看医生保存处方后生成的服药计划。建议重点关注药名、剂量、频次、服药时间、是否已打卡，以及是否存在药物冲突提示；如果药名或剂量看不懂，不要自行调整，先向医生或药师确认。";
      }

      if (promptIncludesAny(normalized, ["咨询", "留言", "问医生", "整理", "提问"])) {
        return "向医生咨询时可以按这个格式整理：1. 主要不适是什么；2. 从什么时候开始，是否加重或缓解；3. 是否发热、疼痛、咳嗽、腹泻等伴随症状；4. 近期用药和过敏史；5. 想让医生帮助判断的问题。这样医生更容易快速回复。";
      }

      if (promptIncludesAny(normalized, ["首页", "我的首页", "怎么看", "记录", "功能"])) {
        return "患者“我的首页”主要用于汇总个人就诊信息，包括挂号记录、待处理事项、用药计划和医生留言。需要办理预约时进入“挂号管理”；需要看服药安排时进入“用药管家”；需要和医生沟通时进入“医生留言”。";
      }

      return "当前是患者“我的首页”。我可以帮你整理挂号记录、说明用药提醒、准备医生留言，或根据症状给出科室选择参考。若你有具体不适，请说明症状、持续时间和体温。";
    }

    if (activeView === "medication" && promptIncludesAny(normalized, ["用药", "服药", "提醒", "打卡", "漏服", "冲突"])) {
      return "用药管家页面用于查看处方对应的服药计划和每日打卡。请按医嘱关注每种药的剂量、频次和说明；如果出现漏服、过敏、明显不适或药物冲突提示，不建议自行加量补服，应先咨询医生或药师。";
    }

    if (activeView === "consult" && promptIncludesAny(normalized, ["咨询", "留言", "怎么写", "问医生", "回复"])) {
      return "医生留言建议写清楚：主要症状、持续时间、体温或疼痛程度、近期用药、过敏史、是否已线下就诊，以及你最想确认的问题。避免只写“我不舒服”，这样医生更难判断。";
    }
  }

  if (sessionUser.roleCode === "DOCTOR") {
    if (activeView === "diagnosis") {
      if (promptIncludesAny(normalized, ["重点信息", "优先确认", "接诊", "问诊", "患者重点"])) {
        return [
          "接诊时建议优先确认以下信息：",
          "1. 主诉与持续时间：从什么时候开始、是否加重或缓解。",
          "2. 生命体征与危险信号：体温、呼吸、意识状态，以及胸痛、呼吸困难、持续高热、抽搐等急症表现。",
          "3. 伴随症状：咳嗽、咽痛、腹痛、皮疹、呕吐、腹泻、头痛等是否同时出现。",
          "4. 既往史与过敏史：慢病、手术史、药物或食物过敏。",
          "5. 当前用药与近期检查：是否自行服药、是否已有检查报告或处方。",
          "6. 特殊人群情况：儿童、孕产妇、老人或免疫力低下患者需要更谨慎评估。"
        ].join("\n");
      }
      if (promptIncludesAny(normalized, ["摘要", "问诊摘要", "病历摘要"])) {
        return "问诊摘要可按“主诉、现病史、伴随症状、既往史/过敏史、初步判断、处置计划”整理。当前页面选中患者后，可先记录主要症状和持续时间，再补充体征、用药史和风险提示。";
      }
      if (promptIncludesAny(normalized, ["处方", "用药", "风险", "注意事项"])) {
        return "开立处方前建议核对诊断依据、药物过敏史、既往慢病、肝肾功能、儿童/孕产妇/老人等特殊情况，并避免重复用药。若存在持续高热、呼吸困难、胸痛或意识异常，应优先线下进一步评估或急诊处理。";
      }
    }

    if (activeView === "messages") {
      if (promptIncludesAny(normalized, ["回复", "草稿", "留言", "风险", "重点"])) {
        return "回复患者留言时建议覆盖四点：先回应患者主要问题，再说明当前建议处理方式，随后列出需要尽快就医的危险信号，最后提醒患者补充体温、症状持续时间、既往病史和已用药物。语气保持清楚、审慎，避免直接替代面诊诊断。";
      }
    }

    if (activeView === "dashboard") {
      if (promptIncludesAny(normalized, ["接诊压力", "待处理", "摘要", "总结"])) {
        return `当前接诊概览显示：${context.summary} 建议优先处理待接诊患者，其次查看患者留言中是否存在发热、呼吸困难、胸痛、意识异常等风险信号，并把已完成接诊及时补全诊断和处方信息。`;
      }
    }
  }

  if (sessionUser.roleCode === "PHARMACIST") {
    if (promptIncludesAny(normalized, ["库存", "发药", "冲突", "交班", "风险"])) {
      return `当前药事场景摘要：${context.summary} 建议优先核对待发药处方、低库存药品和药物冲突提示；发药时向患者说明用法用量、服药时间、漏服处理和需要停药就医的异常反应。`;
    }
  }

  if (sessionUser.roleCode === "ADMIN") {
    if (promptIncludesAny(normalized, ["运营", "统计", "待处理", "趋势", "账户"])) {
      return `当前管理场景摘要：${context.summary} 建议先关注待处理事项、异常业务量、低库存和待回复咨询，再结合统计分析页查看科室分布与近期趋势。`;
    }
  }

  return "";
}

function toAssistantNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function formatAssistantCurrency(value) {
  return `¥${toAssistantNumber(value).toFixed(2)}`;
}

function formatAssistantDate(dateString) {
  if (!dateString) {
    return "当前";
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return String(dateString);
  }
  return date.toLocaleDateString("zh-CN");
}

function clampAiDrawerWidth(value) {
  if (typeof window === "undefined") {
    return value;
  }
  const rightOffset = window.innerWidth <= 720 ? 10 : 16;
  const maxWidth = Math.min(AI_DRAWER_MAX_WIDTH, window.innerWidth - rightOffset * 2);
  const minWidth = Math.min(AI_DRAWER_MIN_WIDTH, maxWidth);
  return Math.max(minWidth, Math.min(maxWidth, value));
}

function useResizableAiDrawer() {
  const [drawerWidth, setDrawerWidth] = useState(AI_DRAWER_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) {
      return undefined;
    }

    function handlePointerMove(event) {
      const rightOffset = window.innerWidth <= 720 ? 10 : 16;
      setDrawerWidth(clampAiDrawerWidth(window.innerWidth - event.clientX - rightOffset));
    }

    function stopResize() {
      setIsResizing(false);
    }

    document.body.classList.add("global-ai-resizing");
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);

    return () => {
      document.body.classList.remove("global-ai-resizing");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };
  }, [isResizing]);

  useEffect(() => {
    function handleResize() {
      setDrawerWidth((current) => clampAiDrawerWidth(current));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function startResize(event) {
    event.preventDefault();
    setIsResizing(true);
  }

  function resetWidth() {
    setDrawerWidth(clampAiDrawerWidth(AI_DRAWER_DEFAULT_WIDTH));
  }

  return {
    drawerWidth: clampAiDrawerWidth(drawerWidth),
    isResizing,
    resetWidth,
    startResize
  };
}

function findLatestBusinessDate(registrations) {
  return (registrations ?? []).reduce((latest, item) => {
    const current = String(item?.registDate ?? "");
    if (!current) {
      return latest;
    }
    return !latest || current > latest ? current : latest;
  }, "");
}

function buildAssistantContextSummary(sessionUser, activeView, store) {
  const registrations = store.registrations ?? [];
  const consultMessages = store.consultMessages ?? [];
  const medicationPlans = store.medicationPlans ?? [];
  const medicationConflicts = store.medicationConflicts ?? [];
  const inventories = store.medicationInventories ?? [];
  const users = store.users ?? [];
  const doctors = store.doctors ?? [];
  const latestBusinessDate = findLatestBusinessDate(registrations);
  const currentBusinessRows = latestBusinessDate ? registrations.filter((item) => item.registDate === latestBusinessDate) : registrations;
  const totalIncome = currentBusinessRows.reduce((sum, item) => {
    const drugIncome = Number(item.visitState) >= 2 && Number(item.purchaseType) === 0 ? toAssistantNumber(item.drugPrice) : 0;
    return sum + toAssistantNumber(item.registfee) + drugIncome;
  }, 0);
  const byDepartment = currentBusinessRows.reduce((map, item) => {
    const key = item.deptName || "未分配";
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map());
  const topDepartment = [...byDepartment.entries()].sort((a, b) => b[1] - a[1])[0];

  if (sessionUser.roleCode === "PATIENT") {
    const patientProfile = (store.patientProfiles ?? []).find((item) => item.userId === sessionUser.id);
    const patientRegistrations = registrations.filter((item) => item.patientUserId === sessionUser.id);
    const patientPlans = medicationPlans.filter((item) => item.patientUserId === sessionUser.id && item.status !== "COMPLETED");
    const patientMessages = consultMessages.filter((item) => item.patientUserId === sessionUser.id);
    const pendingMessages = patientMessages.filter((item) => item.status === "PENDING").length;

    if (activeView === "registration") {
      return `当前患者：${sessionUser.realName}；年龄：${patientProfile?.age ?? "-"}；可选科室：${doctors.length ? new Set(doctors.map((item) => item.deptName)).size : 0} 个；历史挂号：${patientRegistrations.length} 条。`;
    }

    if (activeView === "medication") {
      return `当前患者：${sessionUser.realName}；执行中服药计划：${patientPlans.length} 项；已配置药物冲突规则：${medicationConflicts.length} 条；待回复咨询：${pendingMessages} 条。`;
    }

    if (activeView === "consult") {
      return `当前患者：${sessionUser.realName}；累计咨询记录：${patientMessages.length} 条；待回复：${pendingMessages} 条；最近挂号日期：${patientRegistrations[0]?.registDate ? formatAssistantDate(patientRegistrations[0].registDate) : "暂无" }。`;
    }

    return `当前患者：${sessionUser.realName}；累计挂号：${patientRegistrations.length} 次；执行中服药计划：${patientPlans.length} 项；累计咨询：${patientMessages.length} 条。`;
  }

  if (sessionUser.roleCode === "DOCTOR") {
    const doctorRows = registrations.filter((item) => item.doctorId === sessionUser.doctorId);
    const waitingRows = doctorRows.filter((item) => Number(item.visitState) === 1);
    const visitedRows = doctorRows.filter((item) => Number(item.visitState) >= 2);
    const messageRows = consultMessages.filter((item) => item.doctorUserId === sessionUser.id);
    const pendingMessages = messageRows.filter((item) => item.status === "PENDING").length;

    if (activeView === "diagnosis") {
      return `当前医生：${sessionUser.realName}；待接诊患者：${waitingRows.length} 人；已完成接诊：${visitedRows.length} 人；待回复留言：${pendingMessages} 条。`;
    }

    if (activeView === "messages") {
      return `当前医生：${sessionUser.realName}；患者留言：${messageRows.length} 条；待回复：${pendingMessages} 条；已完成接诊：${visitedRows.length} 人。`;
    }

    return `当前医生：${sessionUser.realName}；本账号相关挂号：${doctorRows.length} 条；待接诊：${waitingRows.length} 人；待回复留言：${pendingMessages} 条。`;
  }

  if (sessionUser.roleCode === "PHARMACIST") {
    const waitingDispense = registrations.filter((item) => Number(item.visitState) === 2 && Number(item.purchaseType) === 0);
    const dispensed = registrations.filter((item) => Number(item.visitState) === 3 && Number(item.purchaseType) === 0);
    const lowStock = inventories.filter((item) => toAssistantNumber(item.stockQuantity) <= toAssistantNumber(item.safeStock));

    if (activeView === "pharmacy") {
      return `当前药房业务：待发药 ${waitingDispense.length} 单；已发药 ${dispensed.length} 单；低库存药品 ${lowStock.length} 项；库存药品总数 ${inventories.length} 项。`;
    }

    return `当前药房概览：待发药 ${waitingDispense.length} 单；已发药 ${dispensed.length} 单；低库存药品 ${lowStock.length} 项。`;
  }

  if (sessionUser.roleCode === "ADMIN") {
    const lowStock = inventories.filter((item) => toAssistantNumber(item.stockQuantity) <= toAssistantNumber(item.safeStock));
    const visitedRows = currentBusinessRows.filter((item) => Number(item.visitState) >= 2);
    const dispensedRows = currentBusinessRows.filter((item) => Number(item.visitState) === 3 && Number(item.purchaseType) === 0);
    const pendingMessages = consultMessages.filter((item) => item.status === "PENDING");
    const disabledUsers = users.filter((item) => item.userState === 0 || item.userState === "0");

    if (activeView === "users") {
      return `账户总数 ${users.length} 个；医生账户 ${users.filter((item) => item.roleCode === "DOCTOR").length} 个；药房账户 ${users.filter((item) => item.roleCode === "PHARMACIST").length} 个；停用账户 ${disabledUsers.length} 个。`;
    }

    if (activeView === "stats") {
      return `统计口径日期：${formatAssistantDate(latestBusinessDate)}；当日挂号 ${currentBusinessRows.length} 次；已就诊 ${visitedRows.length} 人；已发药 ${dispensedRows.length} 人；收入 ${formatAssistantCurrency(totalIncome)}；挂号量最高科室 ${topDepartment?.[0] ?? "暂无"}。`;
    }

    return `统计口径日期：${formatAssistantDate(latestBusinessDate)}；今日挂号 ${currentBusinessRows.length} 次；已就诊 ${visitedRows.length} 人；已发药 ${dispensedRows.length} 人；今日收入 ${formatAssistantCurrency(totalIncome)}；待处理留言 ${pendingMessages.length} 条；低库存药品 ${lowStock.length} 项。`;
  }

  return "当前页面已加载业务数据，可结合页面内容继续提问。";
}

function resolveAssistantContext(sessionUser, activeView, store) {
  const roleContexts = GLOBAL_AI_CONTEXTS[sessionUser.roleCode] ?? {};
  const preset = roleContexts[activeView] ?? roleContexts.dashboard ?? {
    title: "蓉城智能护理小助手",
    shortLabel: "护理小助手",
    subtitle: "结合当前页面信息提供辅助说明。",
    suggestions: []
  };
  const pageLabel = (NAV_ITEMS[sessionUser.roleCode] ?? []).find((item) => item.key === activeView)?.label ?? "当前页面";

  return {
    ...preset,
    key: `${sessionUser.roleCode}:${activeView}`,
    pageKey: activeView,
    pageLabel,
    roleLabel: ROLE_LABELS[sessionUser.roleCode] ?? "当前角色",
    summary: buildAssistantContextSummary(sessionUser, activeView, store)
  };
}

function resolvePortalAssistantContext(portalMode) {
  const preset = PORTAL_AI_CONTEXTS[portalMode] ?? PORTAL_AI_CONTEXTS.public;
  return {
    ...preset,
    key: `portal:${portalMode}`,
    pageKey: portalMode,
    summary:
      portalMode === "staff"
        ? "当前为员工门户场景，可说明工作台结构、登录后功能与系统协同流程。"
        : portalMode === "home"
          ? "当前为系统首页场景，可说明平台功能、就诊准备与服务入口。"
          : "当前为公众门户场景，可说明导诊、挂号与就诊流程。"
  };
}

function buildAssistantWelcome(context) {
  return {
    id: `welcome-${context.key}`,
    role: "assistant",
    text: `已切换到“${context.pageLabel}”场景。我会结合当前页面数据提供简洁、正式的辅助说明。`
  };
}

function buildAgentHistory(messages) {
  return (messages ?? [])
    .filter((item) => item?.role === "user" || item?.role === "assistant")
    .slice(-6)
    .map((item) => ({
      role: item.role,
      content: String(item.text ?? "").trim()
    }))
    .filter((item) => item.content);
}

function resolvePatientPortalJumpTarget(prompt) {
  const normalized = normalizeAssistantPrompt(prompt);
  if (!normalized) {
    return null;
  }

  if (promptIncludesAny(normalized, ["用药管理", "用药管家", "服药提醒", "药物提醒", "吃药提醒", "打卡"])) {
    return { view: "medication", label: "用药管家" };
  }

  if (promptIncludesAny(normalized, ["退号", "取消挂号", "撤销预约"])) {
    return { view: "cancel", label: "退号管理" };
  }

  if (promptIncludesAny(normalized, ["挂号", "预约", "预约挂号", "挂号管理"])) {
    return { view: "registration", label: "挂号管理" };
  }

  return null;
}

function buildPortalNavigationMessage({ prompt, portalMode, sessionUser }) {
  if (portalMode !== "public") {
    return null;
  }

  const target = resolvePatientPortalJumpTarget(prompt);
  if (!target) {
    return null;
  }

  if (!sessionUser) {
    return {
      role: "assistant",
      text: `可以为你打开“${target.label}”，但该入口需要先使用患者账号登录。`,
      actions: [{ type: "login", label: "患者登录" }]
    };
  }

  if (sessionUser.roleCode !== "PATIENT") {
    return {
      role: "assistant",
      text: `当前这类快捷跳转先只支持患者入口。“${target.label}”需要患者账号进入。`,
      actions: [{ type: "login", label: "切换患者登录" }]
    };
  }

  return {
    role: "assistant",
    text: `可以，直接从这里跳转到“${target.label}”。`,
    actions: [{ type: "navigate", label: `前往${target.label}`, view: target.view }]
  };
}

function buildWorkspaceAgentDefinition(sessionUser, activeView) {
  if (sessionUser.roleCode === "PATIENT") {
    if (activeView === "registration") {
      return {
        agentName: "患者挂号导诊智能体",
        scope: "只负责患者挂号、导诊、科室选择、就诊准备和预约流程说明；如果用户询问治疗方案、处方、药房管理、后台统计、娱乐闲聊或其他无关内容，必须明确拒答。"
      };
    }
    if (activeView === "medication") {
      return {
        agentName: "患者用药管家智能体",
        scope: "只负责当前患者的用药提醒、服药打卡、漏服处理、药物冲突提示和用药信息解释；如果用户询问挂号、医生后台、运营统计、无关闲聊或超出用药场景的问题，必须明确拒答。"
      };
    }
    if (activeView === "consult") {
      return {
        agentName: "患者咨询留言智能体",
        scope: "只负责帮助患者整理留言、补充提问、梳理就诊经过和医患沟通表达；如果用户询问处方决策、后台管理、药房发药、娱乐闲聊或其他无关问题，必须明确拒答。"
      };
    }
    return {
      agentName: "患者工作台智能体",
      scope: "只负责患者首页、挂号记录、用药提醒、咨询留言和当前患者服务流程说明；如果问题超出患者工作台职责范围，必须明确拒答。"
    };
  }

  if (sessionUser.roleCode === "DOCTOR") {
    if (activeView === "diagnosis") {
      return {
        agentName: "医生接诊智能体",
        scope: "只负责医生接诊场景中的问诊摘要、重点信息整理、处方参考、风险提醒和门诊沟通建议；不能替代医生作最终诊断，若用户询问无关领域内容必须拒答。"
      };
    }
    if (activeView === "messages") {
      return {
        agentName: "医生留言回复智能体",
        scope: "只负责患者留言回复、风险信息提炼、回复草稿整理和沟通建议；如果超出医患留言场景，必须明确拒答。"
      };
    }
    return {
      agentName: "医生工作台智能体",
      scope: "只负责医生工作台中的接诊概览、待办事项、患者留言和门诊流程说明；如果问题超出医生工作台职责范围，必须明确拒答。"
    };
  }

  if (sessionUser.roleCode === "PHARMACIST") {
    return {
      agentName: "药房发药智能体",
      scope: "只负责药房待发药处方、库存风险、发药交代、药物冲突和交班摘要；如果用户询问患者挂号、管理员运营、娱乐闲聊或其他无关问题，必须明确拒答。"
    };
  }

  return {
    agentName: "医院运营管理智能体",
    scope: "只负责管理员视角下的运营总览、统计分析、账户权限、待处理事项和系统管理说明；如果问题超出后台运营管理职责范围，必须明确拒答。"
  };
}

function buildPortalAgentDefinition(portalMode) {
  if (portalMode === "home") {
    return {
      agentName: "系统首页导览智能体",
      scope: "只负责系统首页导览、入口说明、项目功能介绍、患者入口与员工入口区别、就诊准备和基础导诊；如果问题超出门户导览职责范围，必须明确拒答。"
    };
  }
  if (portalMode === "staff") {
    return {
      agentName: "员工门户智能体",
      scope: "只负责员工登录入口、医生工作台、药房工作台、管理员后台和院内协同流程说明；如果问题超出员工门户职责范围，必须明确拒答。"
    };
  }
  return {
    agentName: "公众门户导诊智能体",
    scope: "只负责公众门户中的预约挂号、就诊准备、导诊说明、服务导航和公众端功能介绍；如果问题超出公众门户职责范围，必须明确拒答。"
  };
}

async function requestAssistantReply({ sessionUser, activeView, actions, prompt, context, history }) {
  const definition = buildWorkspaceAgentDefinition(sessionUser, activeView);

  try {
    const result = await api.requestAgentChat({
      agentName: definition.agentName,
      roleLabel: context.roleLabel,
      pageLabel: context.pageLabel,
      pageSummary: context.summary,
      scope: definition.scope,
      prompt,
      history
    });
    return String(result?.reply ?? "").trim() || "当前智能体暂未返回可展示内容。";
  } catch {
    if (sessionUser.roleCode === "PATIENT") {
      return "当前页面的智能体暂时不可用。你仍可继续使用挂号、用药和咨询功能；如果需要，我稍后也可以继续帮你把模型接入状态再检查一遍。";
    }
    return "当前页面智能体暂时不可用，但页面业务数据仍可正常使用。请先继续处理当前工作台任务，稍后再重试智能体对话。";
  }
}

async function requestPortalAssistantReply({ portalMode, prompt, context, history }) {
  const definition = buildPortalAgentDefinition(portalMode);

  try {
    const result = await api.requestAgentChat({
      agentName: definition.agentName,
      roleLabel: context.roleLabel,
      pageLabel: context.pageLabel,
      pageSummary: context.summary,
      scope: definition.scope,
      prompt,
      history
    });
    return String(result?.reply ?? "").trim() || "当前智能体暂未返回可展示内容。";
  } catch {
    if (portalMode === "staff") {
      return "员工门户智能体暂时不可用。你仍可正常查看员工入口和登录后工作台，稍后可再试一次智能体问答。";
    }
    if (portalMode === "home") {
      return "首页导览智能体暂时不可用。你仍可从首页进入公众版或员工版继续浏览系统。";
    }
    return "公众门户智能体暂时不可用。你仍可继续办理预约挂号、查看就诊指南和服务导航。";
  }
}

function GlobalAiAssistant({ sessionUser, activeView, actions }) {
  const context = useMemo(
    () => resolveAssistantContext(sessionUser, activeView, actions.store ?? {}),
    [actions.store, activeView, sessionUser]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([buildAssistantWelcome(context)]);
  const messagesRef = useRef(null);
  const { drawerWidth, isResizing, resetWidth, startResize } = useResizableAiDrawer();

  useEffect(() => {
    setMessages((current) => {
      const nextWelcome = buildAssistantWelcome(context);
      if (current.length === 0) {
        return [nextWelcome];
      }
      if (current.length === 1 && current[0].role === "assistant") {
        return [nextWelcome];
      }
      return current;
    });
  }, [context]);

  useEffect(() => {
    if (!messagesRef.current) {
      return;
    }
    messagesRef.current.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [isOpen, loading, messages]);

  async function submitPrompt(rawPrompt) {
    const prompt = String(rawPrompt ?? draft).trim();
    if (!prompt || loading) {
      return;
    }

    const nextHistory = buildAgentHistory([...messages, { role: "user", text: prompt }]);
    setIsOpen(true);
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text: prompt }]);
    setDraft("");

    try {
      setLoading(true);
      const reply = await requestAssistantReply({
        sessionUser,
        activeView,
        actions,
        prompt,
        context,
        history: nextHistory
      });
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", text: reply }]);
    } catch (error) {
      actions.showNotice(error.message || "智能助手当前暂时无法提供服务。");
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: "当前未能完成本次分析，请稍后重试，或调整问题后再次发起。"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitPrompt();
    }
  }

  return (
    <>
      <button
        className={isOpen ? "global-ai-launcher global-ai-launcher-open" : "global-ai-launcher"}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="global-ai-launcher__halo" />
        <span className="global-ai-launcher__core">蓉</span>
        <span className="global-ai-launcher__label">
          {context.shortLabel || "护理小助手"}
          <small>{context.pageLabel}</small>
        </span>
        {context.suggestions.length ? <span className="global-ai-launcher__badge" /> : null}
      </button>

      {isOpen ? <button className="global-ai-overlay" type="button" aria-label="关闭蓉城智能护理小助手" onClick={() => setIsOpen(false)} /> : null}

      <aside
        className={`${isOpen ? "global-ai-drawer global-ai-drawer-open" : "global-ai-drawer"} ${isResizing ? "global-ai-drawer-resizing" : ""}`}
        style={{ "--global-ai-drawer-width": `${drawerWidth}px` }}
        aria-hidden={!isOpen}
      >
        <button className="global-ai-resize-handle" type="button" aria-label="拖动调整智能助手宽度" onPointerDown={startResize} />
        <div className="global-ai-drawer__header">
          <div>
            <p className="eyebrow">系统级智能护理辅助</p>
            <h3>{context.title}</h3>
            <p className="global-ai-drawer__subtitle">{context.subtitle}</p>
          </div>
          <div className="global-ai-drawer__tools">
            <button className="ghost-button" type="button" onClick={resetWidth}>
              还原宽度
            </button>
            <button className="ghost-button" type="button" onClick={() => setIsOpen(false)}>
              收起
            </button>
          </div>
        </div>

        <section className="global-ai-context-card">
          <div className="global-ai-context-card__row">
            <span className="global-ai-context-card__chip">{context.roleLabel}</span>
            <span className="global-ai-context-card__chip">{context.pageLabel}</span>
          </div>
          <p>{context.summary}</p>
        </section>

        <section className="global-ai-suggestion-block">
          <div className="global-ai-suggestion-block__header">
            <strong>快捷建议</strong>
            <span>结合当前页面上下文</span>
          </div>
          <div className="global-ai-suggestion-grid">
            {context.suggestions.map((item) => (
              <button
                className="global-ai-suggestion"
                key={`${context.key}-${item.label}`}
                type="button"
                onClick={() => submitPrompt(item.prompt)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="global-ai-chat-card">
          <div className="global-ai-chat-card__header">
            <strong>对话记录</strong>
            <span>{loading ? "正在整理内容" : "可继续结合当前页面追问"}</span>
          </div>

          <div className="global-ai-messages" ref={messagesRef}>
            {messages.map((item) => (
              <article
                className={item.role === "assistant" ? "global-ai-message global-ai-message-assistant" : "global-ai-message global-ai-message-user"}
                key={item.id}
              >
                <span className="global-ai-message__role">{item.role === "assistant" ? "蓉城智能护理小助手" : "我"}</span>
                <p>{item.text}</p>
              </article>
            ))}

            {loading ? (
              <div className="global-ai-typing">
                <span />
                <span />
                <span />
              </div>
            ) : null}
          </div>

          <div className="global-ai-input">
            <textarea
              rows="4"
              placeholder="请输入希望蓉城智能护理小助手协助处理的问题"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="global-ai-input__actions">
              <span>按 Enter 发送，Shift + Enter 换行</span>
              <button className="secondary-button" disabled={loading || !draft.trim()} type="button" onClick={() => submitPrompt()}>
                {loading ? "分析中..." : "发送"}
              </button>
            </div>
          </div>
        </section>
      </aside>
    </>
  );
}

function PortalAiAssistant({ portalMode, noticeHandler, sessionUser, onNavigateTo, onOpenPatientLogin }) {
  const context = useMemo(() => resolvePortalAssistantContext(portalMode), [portalMode]);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([buildAssistantWelcome(context)]);
  const messagesRef = useRef(null);
  const { drawerWidth, isResizing, resetWidth, startResize } = useResizableAiDrawer();

  useEffect(() => {
    setMessages([buildAssistantWelcome(context)]);
  }, [context]);

  useEffect(() => {
    if (!messagesRef.current) {
      return;
    }
    messagesRef.current.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [isOpen, loading, messages]);

  async function submitPrompt(rawPrompt) {
    const prompt = String(rawPrompt ?? draft).trim();
    if (!prompt || loading) {
      return;
    }

    const nextHistory = buildAgentHistory([...messages, { role: "user", text: prompt }]);
    setIsOpen(true);
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text: prompt }]);
    setDraft("");

    const navigationMessage = buildPortalNavigationMessage({ prompt, portalMode, sessionUser });
    if (navigationMessage) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-nav-${Date.now()}`,
          ...navigationMessage
        }
      ]);
      return;
    }

    try {
      setLoading(true);
      const reply = await requestPortalAssistantReply({ portalMode, prompt, context, history: nextHistory });
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", text: reply }]);
    } catch (error) {
      noticeHandler?.(error.message || "蓉城智能护理小助手当前暂时无法提供服务。");
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: "当前未能完成本次解答，请稍后重试。"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleMessageAction(action) {
    if (!action) {
      return;
    }

    if (action.type === "navigate" && action.view) {
      onNavigateTo?.(action.view);
      setIsOpen(false);
      noticeHandler?.(`已跳转到${NAV_ITEMS.PATIENT.find((item) => item.key === action.view)?.label ?? "对应页面"}。`);
      return;
    }

    if (action.type === "login") {
      setIsOpen(false);
      onOpenPatientLogin?.();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitPrompt();
    }
  }

  return (
    <>
      <button
        className={isOpen ? "global-ai-launcher global-ai-launcher-open" : "global-ai-launcher"}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="global-ai-launcher__halo" />
        <span className="global-ai-launcher__core">蓉</span>
        <span className="global-ai-launcher__label">
          {context.shortLabel}
          <small>{context.pageLabel}</small>
        </span>
        {context.suggestions.length ? <span className="global-ai-launcher__badge" /> : null}
      </button>

      {isOpen ? <button className="global-ai-overlay" type="button" aria-label="关闭蓉城智能护理小助手" onClick={() => setIsOpen(false)} /> : null}

      <aside
        className={`${isOpen ? "global-ai-drawer global-ai-drawer-open" : "global-ai-drawer"} ${isResizing ? "global-ai-drawer-resizing" : ""}`}
        style={{ "--global-ai-drawer-width": `${drawerWidth}px` }}
        aria-hidden={!isOpen}
      >
        <button className="global-ai-resize-handle" type="button" aria-label="拖动调整智能助手宽度" onPointerDown={startResize} />
        <div className="global-ai-drawer__header">
          <div>
            <p className="eyebrow">系统级智能护理辅助</p>
            <h3>{context.title}</h3>
            <p className="global-ai-drawer__subtitle">{context.subtitle}</p>
          </div>
          <div className="global-ai-drawer__tools">
            <button className="ghost-button" type="button" onClick={resetWidth}>
              还原宽度
            </button>
            <button className="ghost-button" type="button" onClick={() => setIsOpen(false)}>
              收起
            </button>
          </div>
        </div>

        <section className="global-ai-context-card">
          <div className="global-ai-context-card__row">
            <span className="global-ai-context-card__chip">{context.roleLabel}</span>
            <span className="global-ai-context-card__chip">{context.pageLabel}</span>
          </div>
          <p>{context.summary}</p>
        </section>

        <section className="global-ai-suggestion-block">
          <div className="global-ai-suggestion-block__header">
            <strong>快捷建议</strong>
            <span>结合当前页面场景</span>
          </div>
          <div className="global-ai-suggestion-grid">
            {context.suggestions.map((item) => (
              <button
                className="global-ai-suggestion"
                key={`${context.key}-${item.label}`}
                type="button"
                onClick={() => submitPrompt(item.prompt)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="global-ai-chat-card">
          <div className="global-ai-chat-card__header">
            <strong>对话记录</strong>
            <span>{loading ? "正在整理内容" : "可继续围绕当前页面追问"}</span>
          </div>

          <div className="global-ai-messages" ref={messagesRef}>
            {messages.map((item) => (
              <article
                className={item.role === "assistant" ? "global-ai-message global-ai-message-assistant" : "global-ai-message global-ai-message-user"}
                key={item.id}
              >
                <span className="global-ai-message__role">{item.role === "assistant" ? "蓉城智能护理小助手" : "我"}</span>
                <p>{item.text}</p>
                {item.actions?.length ? (
                  <div className="global-ai-message__actions">
                    {item.actions.map((action) => (
                      <button
                        className="ghost-button global-ai-message__action"
                        key={`${item.id}-${action.type}-${action.label}`}
                        type="button"
                        onClick={() => handleMessageAction(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}

            {loading ? (
              <div className="global-ai-typing">
                <span />
                <span />
                <span />
              </div>
            ) : null}
          </div>

          <div className="global-ai-input">
            <textarea
              rows="4"
              placeholder="请输入希望蓉城智能护理小助手协助处理的问题"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="global-ai-input__actions">
              <span>按 Enter 发送，Shift + Enter 换行</span>
              <button className="secondary-button" disabled={loading || !draft.trim()} type="button" onClick={() => submitPrompt()}>
                {loading ? "分析中..." : "发送"}
              </button>
            </div>
          </div>
        </section>
      </aside>
    </>
  );
}

function WorkspaceShell({ notice, sessionUser, activeView, onNavigate, onLogout, actions }) {
  const navItems = NAV_ITEMS[sessionUser.roleCode] ?? NAV_ITEMS.PATIENT;
  const isAdmin = sessionUser.roleCode === "ADMIN";
  const shellClassName = isAdmin
    ? "app-shell admin-workspace-shell admin-workspace-shell-ops"
    : "app-shell admin-workspace-shell";
  const sidebarClassName = isAdmin ? "sidebar admin-sidebar admin-sidebar-ops" : "sidebar admin-sidebar";
  const contentClassName = isAdmin ? "content-pane admin-content-pane admin-content-pane-ops" : "content-pane admin-content-pane";
  const topbarClassName = isAdmin ? "topbar admin-topbar admin-topbar-ops" : "topbar admin-topbar";
  const viewWrapRef = useRef(null);

  useEffect(() => {
    if (!navItems.some((item) => item.key === activeView)) {
      onNavigate(navItems[0].key);
    }
  }, [activeView, navItems, onNavigate]);

  useEffect(() => {
    if (viewWrapRef.current) {
      viewWrapRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [activeView]);

  useEffect(() => {
    document.body.classList.add("admin-workspace-body");
    return () => {
      document.body.classList.remove("admin-workspace-body");
    };
  }, []);

  const activeLabel = navItems.find((item) => item.key === activeView)?.label;
  const backPortalLabel = sessionUser.roleCode === "PATIENT" ? "返回公众版" : "返回员工版";
  const topbarCopy = isAdmin
    ? ADMIN_WORKSPACE_META.viewCopy[activeView] ?? ADMIN_WORKSPACE_META.viewCopy.dashboard
    : WORKSPACE_META.viewCopy[activeView] ?? WORKSPACE_META.viewCopy.dashboard;

  return (
    <div className={shellClassName}>
      <aside className={sidebarClassName}>
        <div className="brand-block">
          <BrandLogo compact={true} size="sm" subtitle={WORKSPACE_META.brandEyebrow} />
          <div className="brand-block__copy">
            <h1>{WORKSPACE_META.brandTitle}</h1>
            <p>{isAdmin ? ADMIN_WORKSPACE_META.title : WORKSPACE_META.brandSubtitle}</p>
          </div>
        </div>

        <div className="user-chip admin-user-chip">
          <strong>{sessionUser.realName}</strong>
          <span>{ROLE_LABELS[sessionUser.roleCode] ?? "当前角色"}</span>
          {isAdmin ? <small>管理员登录编号：{sessionUser.loginCode || sessionUser.username}</small> : null}
        </div>

        <nav className="nav-stack admin-nav-stack">
          {navItems.map((item) => (
            <button
              className={item.key === activeView ? "nav-button nav-button-active" : "nav-button"}
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer admin-sidebar-footer">
          <button className="ghost-button admin-sidebar-button" type="button" onClick={actions.resetDemoData}>
            刷新数据
          </button>
          <button className="ghost-button admin-sidebar-button admin-sidebar-button-logout" type="button" onClick={onLogout}>
            {backPortalLabel}
          </button>
        </div>
      </aside>

      <main className={contentClassName}>
        <header className={topbarClassName}>
          <div>
            <p className="eyebrow">{isAdmin ? ADMIN_WORKSPACE_META.title : WORKSPACE_META.brandTitle}</p>
            <h2>{activeLabel}</h2>
            <p className="topbar-copy">{topbarCopy}</p>
          </div>

          <div className="topbar-badges admin-topbar-badges">
            <span className="status-chip admin-status-chip">
              {isAdmin ? ADMIN_WORKSPACE_META.badges[0] : "门诊一体化服务"}
            </span>
            <span className="status-chip admin-status-chip admin-status-chip-muted">
              {ROLE_LABELS[sessionUser.roleCode] ?? "当前角色"}
            </span>
            <span className="status-chip admin-status-chip admin-status-chip-light">{new Date().toLocaleDateString("zh-CN")}</span>
          </div>
        </header>

        {notice ? <div className="notice notice-inline">{notice}</div> : null}

        <div className="view-wrap admin-view-wrap" ref={viewWrapRef}>
          <ActiveViewRouter activeView={activeView} sessionUser={sessionUser} actions={actions} />
        </div>
      </main>
      <GlobalAiAssistant sessionUser={sessionUser} activeView={activeView} actions={actions} />
    </div>
  );
}

function calculateAge(dateString) {
  if (!dateString) return 0;
  const birth = new Date(dateString);
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(age, 0);
}

export default App;
