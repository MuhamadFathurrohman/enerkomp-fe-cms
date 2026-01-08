// src/components/Loader/LoaderMain.jsx
import React from "react";
import PropTypes from "prop-types";
import "../../sass/components/Loader/LoaderMain/LoaderMain.css";

const LoaderMain = ({ variant = "default", size = 180 }) => {
  // Hanya 2 variants sesuai kebutuhan
  // Warna di-handle oleh CSS classes, bukan inline styles

  return (
    <div className="loader-main">
      <svg
        viewBox="0 0 240 240"
        height={size}
        width={size}
        className="loader-main__svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Group semua lingkaran dan geser ke tengah */}
        <g transform="translate(120, 120)">
          <circle
            strokeLinecap="round"
            strokeDashoffset={-330}
            strokeDasharray="0 660"
            strokeWidth={10}
            fill="none"
            r={52.5}
            cy={0}
            cx={0}
            className={`loader-main__ring loader-main__ring--a loader-main__ring--${variant}`}
          />
          <circle
            strokeLinecap="round"
            strokeDashoffset={-110}
            strokeDasharray="0 220"
            strokeWidth={10}
            fill="none"
            r={17.5}
            cy={0}
            cx={0}
            className={`loader-main__ring loader-main__ring--b loader-main__ring--${variant}`}
          />
          <circle
            strokeLinecap="round"
            strokeDasharray="0 440"
            strokeWidth={10}
            fill="none"
            r={35}
            cy={0}
            cx={-25}
            className={`loader-main__ring loader-main__ring--c loader-main__ring--${variant}`}
          />
          <circle
            strokeLinecap="round"
            strokeDasharray="0 440"
            strokeWidth={10}
            fill="none"
            r={35}
            cy={0}
            cx={25}
            className={`loader-main__ring loader-main__ring--d loader-main__ring--${variant}`}
          />
        </g>
      </svg>
    </div>
  );
};

LoaderMain.propTypes = {
  variant: PropTypes.oneOf([
    "default", // #2d4c52 - For initialize loading
    "light", // #DDE4F3 - For main page loading
  ]),
  size: PropTypes.number,
};

export default LoaderMain;
