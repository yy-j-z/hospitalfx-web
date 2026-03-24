const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "hospitalfx-auth-token";
const USER_ID_KEY = "hospitalfx-user-id";
const DEFAULT_TIMEOUT_MS = 12000;

function getAuthToken() {
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function getSessionUserId() {
  const raw = window.sessionStorage.getItem(USER_ID_KEY);
  return raw ? Number(raw) : null;
}

export function setSession(token, userId) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.sessionStorage.setItem(USER_ID_KEY, String(userId));
}

export function clearSession() {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_ID_KEY);
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-Auth-Token": token } : {}),
        ...(options.headers || {})
      },
      signal: controller.signal,
      ...options
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
      }
      const text = await response.text();
      throw new Error(resolveReadableErrorMessage(response.status, text));
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("请求超时，请确认后端服务已启动。");
    }
    if (error instanceof TypeError) {
      throw new Error("无法连接后端服务，请确认 Spring Boot 服务已启动。");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function readableErrorMessage(status, text) {
  const content = text?.trim();
  if (!content) {
    if (status >= 500) {
      return "后端服务暂时不可用，请稍后重试。";
    }
    if (status === 401) {
      return "登录状态已失效，请重新登录。";
    }
    if (status === 403) {
      return "当前账号没有执行此操作的权限。";
    }
    return "请求失败，请稍后重试。";
  }
  return content.length > 180 ? `${content.slice(0, 180)}...` : content;
}

function resolveReadableErrorMessage(status, text) {
  const content = text?.trim();
  if (content?.startsWith("{")) {
    try {
      const payload = JSON.parse(content);
      if (payload?.path?.includes("/api/ai/") && status >= 500) {
        return "AI 服务暂时不可用，请确认后端已配置模型 Key 并可访问外网。";
      }
      if (payload?.message) {
        return payload.message;
      }
    } catch {
      // Fall back to the legacy message resolver below.
    }
  }
  return readableErrorMessage(status, text);
}

export const api = {
  fetchState() {
    return request("/app/state");
  },
  login(payload) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  registerPatient(payload) {
    return request("/patients/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  createRegistration(payload) {
    return request("/registrations", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  cancelRegistration(id) {
    return request(`/registrations/${id}`, {
      method: "DELETE"
    });
  },
  saveDiagnosis(id, payload) {
    return request(`/registrations/${id}/diagnosis`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  markDispensed(id) {
    return request(`/registrations/${id}/dispense`, {
      method: "PUT"
    });
  },
  sendConsultMessage(payload) {
    return request("/consult-messages", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  replyConsultMessage(id, payload) {
    return request(`/consult-messages/${id}/reply`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  updateUser(id, payload) {
    return request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  requestRegistrationAi(payload) {
    return request("/ai/registration-advice", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  requestPatientAi(payload) {
    return request("/ai/patient-advice", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  requestDoctorMedicationAi(payload) {
    return request("/ai/doctor-medication-advice", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};
