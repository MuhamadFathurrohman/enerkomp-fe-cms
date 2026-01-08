// views/Unauthorized.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import "../sass/views/Unauthorized/Unauthorized.css";

const Unauthorized = () => {
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-container">
        <div className="unauthorized-icon">
          <ShieldAlert size={48} />
        </div>
        <h1 className="unauthorized-title">Access Denied</h1>
        <p className="unauthorized-message">
          You don't have permission to access this page.
        </p>
        <Link to="/dashboard/home" className="unauthorized-btn">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
