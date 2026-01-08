import React from "react";
import { useNavigate } from "react-router-dom";
import "../sass/views/NotFound/NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/dashboard");
  };

  return (
    <div className="notfound-container">
      <div className="notfound-card">
        <div className="notfound-content">
          <div className="error-code">404</div>
          <h2 className="error-title">
            Page <span className="highlight">Not Found</span>
          </h2>
          <p className="error-message">
            Oops! The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>

          <div className="button-group">
            <button className="notfound-button primary" onClick={handleGoHome}>
              Go to Homepage
            </button>
            <button
              className="notfound-button secondary"
              onClick={handleGoBack}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
