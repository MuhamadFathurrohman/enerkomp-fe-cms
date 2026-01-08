import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import generalApiService from "../../services/generalApiService";
import Logo from "../../assets/images/logo.svg";
import PulseDots from "../../components/Loaders/PulseDots";
import "../../sass/views/Auth/ResetPassword/ResetPassword.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  // ✅ Ambil email dari localStorage
  const [email] = useState(() => {
    return localStorage.getItem("resetEmail") || "";
  });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);

  // 🔥 State untuk toggle visibility password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 🔥 State untuk tracking focus dan error tooltip
  const [focusedInput, setFocusedInput] = useState(null); // 'password' | 'confirmPassword'
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [showConfirmPasswordError, setShowConfirmPasswordError] =
    useState(false);

  // 🔥 Validasi password (sesuai backend: min 6 karakter)
  const isPasswordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword;
  const isFormValid =
    isPasswordValid && passwordsMatch && password && confirmPassword;

  // 🔥 Validasi keberadaan token & email
  useEffect(() => {
    if (!token || !email) {
      setAlert({
        show: true,
        message:
          "Missing information. Please request a new password reset link.",
        type: "error",
      });
      setIsTokenValid(false);
    }
  }, [token, email]);

  // 🔥 Auto-hide alert
  useEffect(() => {
    if (alert.show) {
      const fadeOutTimeout = setTimeout(() => setIsFadingOut(true), 3000);
      const clearTimeoutId = setTimeout(() => {
        setAlert((prev) => ({ ...prev, show: false }));
        setIsFadingOut(false);
      }, 4000);
      return () => {
        clearTimeout(fadeOutTimeout);
        clearTimeout(clearTimeoutId);
      };
    }
  }, [alert.show]);

  // 🔥 useEffect untuk mengatur tampilan error tooltip
  useEffect(() => {
    if (focusedInput === "password" && password && !isPasswordValid) {
      setShowPasswordError(true);
    } else {
      setShowPasswordError(false);
    }

    if (
      focusedInput === "confirmPassword" &&
      confirmPassword &&
      !passwordsMatch
    ) {
      setShowConfirmPasswordError(true);
    } else {
      setShowConfirmPasswordError(false);
    }
  }, [
    focusedInput,
    password,
    confirmPassword,
    isPasswordValid,
    passwordsMatch,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid || !isTokenValid) return;

    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    // ✅ Kirim email (dari localStorage), token, dan password
    const result = await generalApiService.create("/auth/reset-password", {
      token,
      email,
      password,
    });

    if (result.success) {
      // ✅ Hapus email dari localStorage setelah sukses
      localStorage.removeItem("resetEmail");

      setAlert({
        show: true,
        message:
          "Your password has been updated successfully. Redirecting to login...",
        type: "success",
      });
      setTimeout(() => navigate("/login"), 3000);
    } else {
      setAlert({
        show: true,
        message:
          result.message || "Failed to update password. Please try again.",
        type: "error",
      });

      // Nonaktifkan form jika error terkait token/email
      if (
        result.message?.toLowerCase().includes("token") ||
        result.message?.toLowerCase().includes("email")
      ) {
        setIsTokenValid(false);
      }
    }

    setLoading(false);
  };

  // ✅ Tampilkan error jika token atau email tidak tersedia
  if (!token || !email) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <div className="reset-password-logo">
              <img src={Logo} alt="Logo" className="reset-password-logo-img" />
            </div>
            <h1 className="reset-password-title">Incomplete Reset Request</h1>
            <p className="reset-password-subtitle">
              We couldn't verify your reset request.
            </p>
          </div>

          <div className="reset-password-error-content">
            <p className="reset-password-error-text">
              Please go back to the login page and request a new password reset
              link.
            </p>

            <button
              type="button"
              className="reset-password-retry-button"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      {/* Alert Overlay */}
      {alert.show && (
        <div className="reset-password-alert-overlay">
          <div
            className={`reset-password-alert ${alert.type} ${
              isFadingOut ? "fade-out" : "fade-in"
            }`}
          >
            {alert.message}
          </div>
        </div>
      )}

      <div className="reset-password-card">
        <div className="reset-password-header">
          <div className="reset-password-logo">
            <img src={Logo} alt="Logo" className="reset-password-logo-img" />
          </div>
          <h1 className="reset-password-title">Reset Password</h1>
          <p className="reset-password-subtitle">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="reset-password-form-group">
            <label htmlFor="password" className="reset-password-form-label">
              New Password
            </label>
            <div className="reset-password-input-password">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`reset-password-form-input ${
                  password && !isPasswordValid ? "has-error" : ""
                }`}
                required
                disabled={loading || !isTokenValid}
                placeholder="At least 6 characters"
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
              />
              <button
                type="button"
                className="reset-password-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || !isTokenValid}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>

              {showPasswordError && (
                <div className="reset-password-error-tooltip">
                  Password must be at least 6 characters.
                </div>
              )}
            </div>
          </div>

          <div className="reset-password-form-group">
            <label
              htmlFor="confirmPassword"
              className="reset-password-form-label"
            >
              Confirm New Password
            </label>
            <div className="reset-password-input-password">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`reset-password-form-input ${
                  confirmPassword && !passwordsMatch ? "has-error" : ""
                }`}
                required
                disabled={loading || !isTokenValid}
                placeholder="Re-enter your password"
                onFocus={() => setFocusedInput("confirmPassword")}
                onBlur={() => setFocusedInput(null)}
              />
              <button
                type="button"
                className="reset-password-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading || !isTokenValid}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>

              {showConfirmPasswordError && (
                <div className="reset-password-error-tooltip">
                  Passwords do not match.
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="reset-password-button"
            disabled={loading || !isFormValid || !isTokenValid}
          >
            {loading ? (
              <span className="reset-password-button-loading">
                <PulseDots size="sm" color="white" />
              </span>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
