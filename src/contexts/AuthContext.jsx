// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from "react";
import {
  apiClientNoHeaders,
  onSessionExpired,
  onSessionExpiredTooLong, // ✅ BARU
  resetSessionExpiredFlag,
  triggerSessionRefreshed,
  setAccessTokenExpiry,
  resetAccessTokenExpiry,
  canStillExtendSession,
  getMinutesSinceExpired,
} from "../services/api";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isInitialized: false,
  sessionExpired: false,
  sessionExpiredTooLong: false,
};

const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  CLEAR_ERROR: "CLEAR_ERROR",
  RESTORE_SESSION: "RESTORE_SESSION",
  SET_INITIALIZED: "SET_INITIALIZED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  CLEAR_SESSION_EXPIRED: "CLEAR_SESSION_EXPIRED",
  SESSION_EXPIRED_TOO_LONG: "SESSION_EXPIRED_TOO_LONG",
  UPDATE_USER: "UPDATE_USER",
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return { ...state, loading: true, error: null };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
        sessionExpired: false,
        sessionExpiredTooLong: false,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload.message,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        isInitialized: true,
        sessionExpired: false,
        sessionExpiredTooLong: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case AUTH_ACTIONS.RESTORE_SESSION:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        sessionExpired: false,
        sessionExpiredTooLong: false,
      };

    case AUTH_ACTIONS.SET_INITIALIZED:
      return { ...state, isInitialized: true, loading: false };

    case AUTH_ACTIONS.SESSION_EXPIRED:
      return { ...state, sessionExpired: true };

    case AUTH_ACTIONS.CLEAR_SESSION_EXPIRED:
      return { ...state, sessionExpired: false, sessionExpiredTooLong: false };

    case AUTH_ACTIONS.SESSION_EXPIRED_TOO_LONG:
      return { ...state, sessionExpiredTooLong: true };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };

    default:
      return state;
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ======================================================
  // ✅ SIMPLIFIED: Single Event Listener for Expired
  // ======================================================
  useEffect(() => {
    const handleExpired = () => {
      dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
    };

    const unsub = onSessionExpired(handleExpired);
    return () => unsub();
  }, []);

  // ======================================================
  // ✅ SIMPLIFIED: Single Event Listener for Too Long
  // ======================================================
  useEffect(() => {
    const handleTooLong = () => {
      dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED_TOO_LONG });
    };

    const unsub = onSessionExpiredTooLong(handleTooLong);
    return () => unsub();
  }, []);

  // ======================================================
  // ✅ VISIBILITY CHANGE (Backup Only)
  // ======================================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        state.sessionExpired &&
        !state.sessionExpiredTooLong
      ) {
        const minutesSinceExpired = getMinutesSinceExpired();

        if (minutesSinceExpired > 15) {
          dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED_TOO_LONG });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.sessionExpired, state.sessionExpiredTooLong]);

  // ======================================================
  // EXTEND SESSION
  // ======================================================
  const extendSession = async () => {
    try {
      if (!canStillExtendSession(15)) {
        dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED_TOO_LONG });
        return;
      }

      await apiClientNoHeaders.post("/auth/refresh");

      const meResponse = await apiClientNoHeaders.get("/auth/me");
      const user = meResponse.data;

      const permissions = user.role?.permissions || [];
      const formattedPermissions = permissions.map((p) => ({
        resource: p.resource,
        access: p.action,
      }));

      const userData = {
        ...user,
        permissions: formattedPermissions,
        roleName: user.role?.name || "user",
      };

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { token: null, user: userData },
      });

      dispatch({ type: AUTH_ACTIONS.CLEAR_SESSION_EXPIRED });
      resetSessionExpiredFlag();
      setAccessTokenExpiry(15 * 60 * 1000);
      triggerSessionRefreshed();
    } catch (err) {
      console.error("Failed to extend session:", err);
      dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED_TOO_LONG });
    }
  };

  // ======================================================
  // INITIAL SESSION RESTORE
  // ======================================================
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await apiClientNoHeaders.get("/auth/me");
        const user = response.data;

        const permissions = user.role?.permissions || [];
        const formattedPermissions = permissions.map((p) => ({
          resource: p.resource,
          access: p.action,
        }));

        const userData = {
          ...user,
          permissions: formattedPermissions,
          roleName: user.role?.name || "user",
        };

        dispatch({
          type: AUTH_ACTIONS.RESTORE_SESSION,
          payload: { user: userData, token: null },
        });

        setAccessTokenExpiry(15 * 60 * 1000);
      } catch (error) {
        // No active session
      } finally {
        dispatch({ type: AUTH_ACTIONS.SET_INITIALIZED });
      }
    };

    restoreSession();
  }, []);

  // ======================================================
  // LOGIN
  // ======================================================
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      await apiClientNoHeaders.post("/auth/login", credentials);

      const meResponse = await apiClientNoHeaders.get("/auth/me");
      const user = meResponse.data;

      const permissions = user.role?.permissions || [];
      const formattedPermissions = permissions.map((p) => ({
        resource: p.resource,
        access: p.action,
      }));

      const userData = {
        ...user,
        permissions: formattedPermissions,
        roleName: user.role?.name || "user",
      };

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { token: null, user: userData },
      });

      resetSessionExpiredFlag();
      setAccessTokenExpiry(15 * 60 * 1000);

      return { success: true, data: { user: userData } };
    } catch (err) {
      let message = "Login failed";
      if (err.response?.status === 401) {
        message = "Email or password is incorrect";
      }

      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: { message } });
      return { success: false, message };
    }
  };

  // ======================================================
  // LOGOUT
  // ======================================================
  const logout = async () => {
    try {
      await apiClientNoHeaders.post("/auth/logout");
    } catch (err) {
      console.error("Logout endpoint failed:", err);
    }

    resetSessionExpiredFlag();
    resetAccessTokenExpiry();

    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    dispatch({ type: AUTH_ACTIONS.CLEAR_SESSION_EXPIRED });
  };

  const clearError = () => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

  const updateUser = (updatedUserData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: updatedUserData,
    });
  };

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    isInitialized: state.isInitialized,
    sessionExpired: state.sessionExpired,
    sessionExpiredTooLong: state.sessionExpiredTooLong,
    login,
    logout,
    clearError,
    extendSession,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
