import React, { useState, useEffect } from "react";
import "../../sass/views/Auth/Login/Login.css";
import Logo from "../../assets/images/logo.svg";
import { NavLink, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import LoaderMain from "../../components/Loaders/LoaderMain";
import PulseDots from "../../components/Loaders/PulseDots";

export default function Login() {
  const { login, user, error, clearError, isAuthenticated, isInitialized } =
    useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [alert, setAlert] = useState(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect setelah sesi terverifikasi
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      redirectUserBasedOnRole(user);
    }
  }, [isInitialized, isAuthenticated, user]);

  // Handle error dari AuthContext
  useEffect(() => {
    if (error) {
      setAlert({
        type: "error",
        message: error,
      });
      setIsLoading(false);
    }
  }, [error]);

  const handleChange = (e) => {
    if (error) clearError();
    if (alert) setAlert(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const redirectUserBasedOnRole = (userData) => {
    try {
      navigate("/dashboard/home", { replace: true });
    } catch (error) {
      console.error("Redirect error:", error);
      setAlert({
        type: "error",
        message: "Error redirecting user. Please contact support.",
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setAlert({ type: "error", message: "Please fill in all fields" });
      return;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      const loginPromise = login(formData);
      const minLoadingTime = new Promise((resolve) =>
        setTimeout(resolve, 2000)
      );
      const [result] = await Promise.all([loginPromise, minLoadingTime]);

      if (result.success) {
        setAlert({
          type: "success",
          message: "Login successful! Redirecting...",
        });
        setTimeout(() => {}, 1000);
      } else {
        setAlert({
          type: "error",
          message: result.message || "Login failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setAlert({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-hide alert
  useEffect(() => {
    if (alert) {
      const fadeOutTimeout = setTimeout(() => setIsFadingOut(true), 3000);
      const clearTimeout_id = setTimeout(() => {
        setAlert(null);
        setIsFadingOut(false);
      }, 4000);
      return () => {
        clearTimeout(fadeOutTimeout);
        clearTimeout(clearTimeout_id);
      };
    }
  }, [alert]);

  if (!isInitialized) {
    return (
      <div className="login-container">
        <div className="login-card login-card--loading">
          <div className="initial-loader">
            <img src={Logo} alt="Logo" className="logo" />
            <LoaderMain variant="default" size={180} />
            <p className="initial-loader-text">Checking your connection...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="logo-wrapper">
          <img src={Logo} alt="Logo" className="logo" />
        </div>
        <h2>
          <span className="highlight"> CONTENT</span> MANAGEMENT SYSTEM
        </h2>
        <h3>PT ENERKOMP PERSADA RAYA</h3>
        <p className="sub-text">Please sign in to your account</p>

        <div className="section-input">
          <div>
            <label className="label-input" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="Enter Your Email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="section-input-password">
            <label className="label-input" htmlFor="password">
              Password
            </label>
            <div className="input-password">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="Enter Your Password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span
                onClick={() => !isLoading && setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            <NavLink to="/forgot-password" className={"forgot-password"}>
              Forgot Password?
            </NavLink>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`login-button ${isLoading ? "loading" : ""}`}
        >
          {isLoading ? (
            <div className="login-button-loading">
              <PulseDots size="sm" color="#fff" count={6} />
            </div>
          ) : (
            "Sign In"
          )}
        </button>

        {alert && (
          <div className="alert-overlay">
            <div
              className={`alert ${alert.type} ${
                isFadingOut ? "fade-out" : "fade-in"
              }`}
            >
              <span>{alert.message}</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
