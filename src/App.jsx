import { useEffect, useMemo, useState } from "react";
import { ROLE_LABELS } from "./mockData";
import { api, clearSession, getSessionUserId, setSession } from "./api";
import { ActiveViewRouter, InfoBadge } from "./panels";

const NAV_ITEMS = {
  CLERK: [
    { key: "dashboard", label: "工作台" },
    { key: "registration", label: "现场挂号" },
    { key: "cancel", label: "退号管理" },
    { key: "triage", label: "AI 分诊" },
    { key: "records", label: "病历查询" },
    { key: "stats", label: "系统统计" }
  ],
  DOCTOR: [
    { key: "dashboard", label: "工作台" },
    { key: "diagnosis", label: "门诊接诊" },
    { key: "messages", label: "患者留言" }
  ],
  PHARMACIST: [
    { key: "dashboard", label: "工作台" },
    { key: "pharmacy", label: "药房发药" }
  ],
  PATIENT: [
    { key: "dashboard", label: "我的主页" },
    { key: "patientAi", label: "AI 自测" },
    { key: "consult", label: "医生留言" }
  ],
  ADMIN: [
    { key: "dashboard", label: "总览" },
    { key: "users", label: "用户管理" },
    { key: "stats", label: "统计分析" }
  ]
};

const DEMO_ACCOUNTS = {
  ADMIN: ["A001"],
  CLERK: ["G001", "G002"],
  PHARMACIST: ["Y001", "Y002"],
  DOCTOR: ["K001", "K002", "K003", "K004", "K005", "K006"],
  PATIENT: ["13800000012", "13800000013", "13800000014", "13800000015"]
};

function App() {
  const [store, setStore] = useState({
    users: [],
    doctors: [],
    patientProfiles: [],
    registrations: [],
    consultMessages: []
  });
  const [sessionUserId, setSessionUserId] = useState(getSessionUserId);
  const [activeView, setActiveView] = useState("dashboard");
  const [notice, setNotice] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const sessionUser = useMemo(
    () => store.users.find((user) => user.id === sessionUserId) ?? null,
    [store.users, sessionUserId]
  );

  const doctors = store.doctors;

  function showNotice(message) {
    setNotice(message);
  }

  async function refreshState() {
    const nextState = await api.fetchState();
    setStore(nextState);
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

  async function handleLogin(loginId, password) {
    try {
      const response = await api.login({ loginId, password });
      setSession(response.token, response.user.id);
      setSessionUserId(response.user.id);
      setActiveView("dashboard");
      await refreshState();
      showNotice(`欢迎回来，${ROLE_LABELS[response.user.roleCode]} ${response.user.realName}。`);
    } catch (error) {
      showNotice(error.message || "登录失败，请稍后重试。");
    }
  }

  function handleLogout() {
    clearSession();
    setSessionUserId(null);
    setActiveView("dashboard");
    showNotice("已退出登录。");
  }

  async function handleRegisterPatient(payload) {
    try {
      const nextState = await api.registerPatient(payload);
      setStore(nextState);
      showNotice("患者账号已创建，可以直接登录。");
      return true;
    } catch (error) {
      showNotice(error.message || "注册失败。");
      return false;
    }
  }

  async function resetDemoData() {
    try {
      await refreshState();
      showNotice("已重新拉取后端数据。");
    } catch (error) {
      showNotice(error.message || "刷新数据失败。");
    }
  }

  const actions = {
    store,
    doctors,
    sessionUser,
    activeView,
    setActiveView,
    showNotice,
    resetDemoData,
    refreshState,
    createRegistration: async (payload) => {
      const nextState = await api.createRegistration(payload);
      setStore(nextState);
      return nextState;
    },
    cancelRegistration: async (id) => {
      const nextState = await api.cancelRegistration(id);
      setStore(nextState);
      return nextState;
    },
    saveDiagnosis: async (id, payload) => {
      const nextState = await api.saveDiagnosis(id, payload);
      setStore(nextState);
      return nextState;
    },
    markDispensed: async (id) => {
      const nextState = await api.markDispensed(id);
      setStore(nextState);
      return nextState;
    },
    sendConsultMessage: async (payload) => {
      const nextState = await api.sendConsultMessage(payload);
      setStore(nextState);
      return nextState;
    },
    replyConsultMessage: async (id, payload) => {
      const nextState = await api.replyConsultMessage(id, payload);
      setStore(nextState);
      return nextState;
    },
    updateUser: async (id, payload) => {
      const nextState = await api.updateUser(id, payload);
      setStore(nextState);
      return nextState;
    },
    requestRegistrationAi: (payload) => api.requestRegistrationAi(payload),
    requestPatientAi: (payload) => api.requestPatientAi(payload),
    requestDoctorMedicationAi: (payload) => api.requestDoctorMedicationAi(payload)
  };

  if (isBootstrapping) {
    return <div className="app-loading">正在连接后端服务...</div>;
  }

  if (!sessionUser) {
      return (
        <AuthScreen
          notice={notice}
          onLogin={handleLogin}
          onNotice={showNotice}
          onRegister={handleRegisterPatient}
        />
      );
  }

  return (
    <WorkspaceShell
      notice={notice}
      sessionUser={sessionUser}
      activeView={activeView}
      onNavigate={setActiveView}
      onLogout={handleLogout}
      actions={actions}
    />
  );
}

function AuthScreen({ notice, onLogin, onNotice, onRegister }) {
  const [loginForm, setLoginForm] = useState({ loginId: "K001", password: "123456" });
  const [registerForm, setRegisterForm] = useState({
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    realName: "",
    gender: "女",
    birthdate: "1995-01-01",
    cardNumber: "",
    homeAddress: ""
  });

  const groupedUsers = useMemo(
    () =>
      Object.entries(ROLE_LABELS).map(([code, label]) => ({
        code,
        label,
        items: DEMO_ACCOUNTS[code] ?? []
      })),
    []
  );

  function submitLogin(event) {
    event.preventDefault();
    if (!loginForm.loginId.trim() || !loginForm.password.trim()) {
      onNotice("请输入登录编号或手机号，以及密码。");
      return;
    }
    onLogin(loginForm.loginId.trim(), loginForm.password);
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
    const success = await onRegister({
      phoneNumber: registerForm.phoneNumber.trim(),
      password: registerForm.password.trim(),
      realName: registerForm.realName.trim(),
      gender: registerForm.gender,
      birthdate: registerForm.birthdate,
      age: calculateAge(registerForm.birthdate),
      cardNumber: registerForm.cardNumber.trim().toUpperCase(),
      homeAddress: registerForm.homeAddress.trim()
    });
    if (success) {
      setRegisterForm({
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        realName: "",
        gender: "女",
        birthdate: "1995-01-01",
        cardNumber: "",
        homeAddress: ""
      });
    }
  }

  return (
    <div className="auth-page auth-page-simple">
      <div className="auth-backdrop auth-backdrop-left" />
      <div className="auth-backdrop auth-backdrop-right" />
      <section className="auth-card auth-card-login">
        {notice ? <div className="notice">{notice}</div> : null}
        <p className="eyebrow">HospitaFX 登录</p>
        <h1 className="login-title">登录系统</h1>
        <p className="login-copy">员工使用编号登录，患者使用手机号登录。演示密码统一为 `123456`。</p>
        <form className="stacked-form" onSubmit={submitLogin}>
          <div className="field-grid">
            <label>
              登录编号 / 手机号
              <input
                autoComplete="username"
                placeholder="例如 K001 / 13800000012"
                value={loginForm.loginId}
                onChange={(event) => setLoginForm((current) => ({ ...current, loginId: event.target.value }))}
              />
            </label>
            <label>
              密码
              <input
                autoComplete="current-password"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
          </div>
          <div className="auth-note">
            <span>比赛现场可直接使用下方账号速填，减少输入失误。</span>
            <span>如果登录失败，通常是后端服务或数据库尚未正常启动。</span>
          </div>
          <button className="primary-button" type="submit">
            进入工作台
          </button>
        </form>
        <div className="account-board account-board-compact">
          <h2>演示账号速填</h2>
          <p className="board-copy">点击任意账号即可自动填入登录框。</p>
          {groupedUsers.map((group) => (
            <div className="account-row" key={group.code}>
              <span>{group.label}</span>
              <div className="account-tags">
                {group.items.map((item) => (
                  <button
                    className="tag-button"
                    key={item}
                    type="button"
                    onClick={() => setLoginForm({ loginId: item, password: "123456" })}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function WorkspaceShell({ notice, sessionUser, activeView, onNavigate, onLogout, actions }) {
  const navItems = NAV_ITEMS[sessionUser.roleCode];

  useEffect(() => {
    if (!navItems.some((item) => item.key === activeView)) {
      onNavigate(navItems[0].key);
    }
  }, [activeView, navItems, onNavigate]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">角色工作台</p>
          <h1>HospitaFX</h1>
          <p>{ROLE_LABELS[sessionUser.roleCode]} Web 前端</p>
        </div>
        <div className="user-chip">
          <strong>{sessionUser.realName}</strong>
          <span>{ROLE_LABELS[sessionUser.roleCode]}</span>
        </div>
        <nav className="nav-stack">
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
        <div className="sidebar-footer">
          <button className="ghost-button" type="button" onClick={actions.resetDemoData}>
            刷新后端数据
          </button>
          <button className="ghost-button" type="button" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </aside>
      <main className="content-pane">
        <header className="topbar">
          <div>
            <p className="eyebrow">当前模块</p>
            <h2>{navItems.find((item) => item.key === activeView)?.label}</h2>
            <p className="topbar-copy">当前页面已与 Spring Boot 后端联动，适合现场演示完整业务流程。</p>
          </div>
          <div className="topbar-badges">
            <span className="status-chip">实时后端数据</span>
            <span className="status-chip status-chip-muted">{ROLE_LABELS[sessionUser.roleCode]}</span>
          </div>
        </header>
        {notice ? <div className="notice notice-inline">{notice}</div> : null}
        <div className="view-wrap">
          <ActiveViewRouter activeView={activeView} sessionUser={sessionUser} actions={actions} />
        </div>
      </main>
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

export default App;
