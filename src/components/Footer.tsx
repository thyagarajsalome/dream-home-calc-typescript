import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <a href="#home" className="logo" style={{ color: "#fff" }}>
          <i className="fas fa-home"></i> DreamHomeCalc
        </a>
        <p style={{ marginTop: "0.5rem" }}>
          &copy; 2025 DreamHomeCalc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
