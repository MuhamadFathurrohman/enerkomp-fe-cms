import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import generalApiService from "../../services/generalApiService";
import Logo from "../../assets/images/logo.svg";
import PulseDots from "../../components/Loaders/PulseDots";
import "../../sass/views/Auth/ForgotPassword/ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [isFadingOut, setIsFadingOut] = useState(false);

  // ✅ Cooldown state
  const [cooldownActive, setCooldownActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const COOLDOWN_SECONDS = 120;

  // ✅ Countdown timer
  useEffect(() => {
    let timer;
    if (cooldownActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCooldownActive(false);
    }
    return () => clearInterval(timer);
  }, [cooldownActive, countdown]);

  // ✅ Auto-hide alert
  useEffect(() => {
    if (alert.show) {
      const fadeOutTimeout = setTimeout(() => setIsFadingOut(true), 3000);
      const clearTimeoutId = setTimeout(() => {
        setAlert({ show: false, message: "", type: "" });
        setIsFadingOut(false);
      }, 4000);
      return () => {
        clearTimeout(fadeOutTimeout);
        clearTimeout(clearTimeoutId);
      };
    }
  }, [alert.show]);

  // ✅ Submit handler — disesuaikan penuh dengan backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cooldownActive) return;

    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    const result = await generalApiService.create("/auth/forgot-password", {
      email,
    });

    // Di dalam handleSubmit, setelah result.success
    if (result.success) {
      if (email && email.includes("@")) {
        localStorage.setItem("resetEmail", email);
      }

      setAlert({
        show: true,
        message:
          "If your email is registered, you will receive a password reset link.",
        type: "success",
      });

      setCooldownActive(true);
      setCountdown(COOLDOWN_SECONDS);
    } else {
      // Hanya terjadi jika error jaringan, timeout, atau non-2xx
      setAlert({
        show: true,
        message: result.message || "An error occurred. Please try again.",
        type: "error",
      });
    }

    setLoading(false);
  };

  return (
    <div className="forgot-password-container">
      {/* Alert Overlay */}
      {alert.show && (
        <div className="alert-overlay">
          <div
            className={`alert ${alert.type} ${
              isFadingOut ? "fade-out" : "fade-in"
            }`}
          >
            {alert.message}
          </div>
        </div>
      )}

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img src={Logo} alt="Logo" className="auth-logo-img" />
          </div>
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">
            Enter your email and we’ll send you a link to reset your password.
          </p>

          {cooldownActive && (
            <p className="cooldown-message-top">
              You can request again in{" "}
              <strong>
                {Math.floor(countdown / 60)}m{" "}
                {String(countdown % 60).padStart(2, "0")}s
              </strong>
              .
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
              disabled={loading || cooldownActive}
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || cooldownActive}
          >
            {loading ? (
              <span className="login-button-loading">
                <PulseDots size="sm" color="white" />
              </span>
            ) : cooldownActive ? (
              "Please Wait..."
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <span>Remember your password? </span>
          <NavLink to="/login" className="auth-link">
            Sign In
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
