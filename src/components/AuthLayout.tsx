import React from "react";

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="auth-container">
      <a href="/" className="auth-logo">
        <i className="fas fa-home"></i> DreamHomeCalc
      </a>
      <div className="card auth-card">{children}</div>
    </div>
  );
};

export default AuthLayout;
