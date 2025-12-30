import React from 'react';
import './Spinner.css';

const Spinner = ({ className = '', size = 16, ...props }) => {
  return (
    <svg
      role="status"
      aria-label="Loading"
      className={`spinner-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="32"
        opacity="0.2"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="24"
        className="spinner-circle"
      />
    </svg>
  );
};

export default Spinner;

