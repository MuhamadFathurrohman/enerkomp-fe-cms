import axios from "axios";

// =========================
// SESSION STATE
// =========================
const sessionExpiredListeners = [];
const tooLongListeners = [];
let isSessionExpiredTriggered = false;
let sessionExpiredAt = null;

// Timer (unified)
let accessTokenExpiryTime = null;
let sessionTimerInterval = null;

const MAX_IDLE_MINUTES = 15;

// =========================
// SESSION EXPIRED LISTENERS
// =========================
export const onSessionExpired = (callback) => {
  sessionExpiredListeners.push(callback);
  return () => {
    const idx = sessionExpiredListeners.indexOf(callback);
    if (idx !== -1) sessionExpiredListeners.splice(idx, 1);
  };
};

const triggerSessionExpired = () => {
  if (isSessionExpiredTriggered) return;

  isSessionExpiredTriggered = true;
  sessionExpiredAt = Date.now();

  sessionExpiredListeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error("Session expired listener error:", err);
    }
  });
};

export const resetSessionExpiredFlag = () => {
  isSessionExpiredTriggered = false;
  sessionExpiredAt = null;
};

export const canStillExtendSession = (maxIdleMinutes = MAX_IDLE_MINUTES) => {
  if (!sessionExpiredAt) return true;

  const elapsedMinutes = (Date.now() - sessionExpiredAt) / 1000 / 60;
  return elapsedMinutes <= maxIdleMinutes;
};

export const getMinutesSinceExpired = () => {
  if (!sessionExpiredAt) return 0;
  return Math.floor((Date.now() - sessionExpiredAt) / 1000 / 60);
};

// =========================
// SESSION EXPIRED TOO LONG LISTENERS
// =========================
export const onSessionExpiredTooLong = (callback) => {
  tooLongListeners.push(callback);
  return () => {
    const idx = tooLongListeners.indexOf(callback);
    if (idx !== -1) tooLongListeners.splice(idx, 1);
  };
};

const triggerSessionExpiredTooLong = () => {
  tooLongListeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error("Session expired too long listener error:", err);
    }
  });
};

// =========================
// UNIFIED SESSION TIMER
// =========================
const startSessionTimer = () => {
  stopSessionTimer(); // Cleanup existing

  sessionTimerInterval = setInterval(() => {
    const now = Date.now();

    // Access token expiry
    if (accessTokenExpiryTime && now >= accessTokenExpiryTime) {
      triggerSessionExpired();
      accessTokenExpiryTime = null; // Clear after trigger
    }

    // Too long idle (only if already expired)
    if (sessionExpiredAt) {
      const minutesSinceExpired = (now - sessionExpiredAt) / 1000 / 60;
      if (minutesSinceExpired > MAX_IDLE_MINUTES) {
        triggerSessionExpiredTooLong();
        stopSessionTimer();
      }
    }
  }, 10000);
};

const stopSessionTimer = () => {
  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
};

export const setAccessTokenExpiry = (expiresInMs = 15 * 60 * 1000) => {
  accessTokenExpiryTime = Date.now() + expiresInMs;
  startSessionTimer();
};

export const resetAccessTokenExpiry = () => {
  stopSessionTimer();
  accessTokenExpiryTime = null;
};

// =========================
// SESSION REFRESHED LISTENERS
// =========================
const sessionRefreshedListeners = [];

export const onSessionRefreshed = (callback) => {
  sessionRefreshedListeners.push(callback);
  return () => {
    const idx = sessionRefreshedListeners.indexOf(callback);
    if (idx !== -1) sessionRefreshedListeners.splice(idx, 1);
  };
};

export const triggerSessionRefreshed = () => {
  sessionRefreshedListeners.forEach((cb) => {
    try {
      cb();
    } catch (error) {
      console.error("Session refreshed listener error:", error);
    }
  });
};

// =========================
// BASE URL
// =========================
const BASE_URL = import.meta.env.VITE_API_URL || "";

// =========================
// API CLIENTS
// =========================
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const apiClientNoHeaders = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    const isLoginCall = requestUrl.includes("/auth/login");
    const isRefreshCall = requestUrl.includes("/auth/refresh");
    const isMeCall = requestUrl.includes("/auth/me");

    if (status === 401 && !isLoginCall && !isMeCall && !isRefreshCall) {
      triggerSessionExpired();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClientNoHeaders };
