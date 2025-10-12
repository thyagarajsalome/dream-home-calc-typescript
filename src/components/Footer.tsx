import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <a href="#home" className="logo" style={{ color: "#fff" }}>
          <i className="fas fa-home"></i> DreamHomeCalc
        </a>
        <ul className="social-links">
          <li>
            <a href="#" aria-label="Facebook">
              <i className="fab fa-facebook-f"></i>
            </a>
          </li>
          <li>
            <a href="#" aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
          </li>
          <li>
            <a href="#" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
          </li>
        </ul>
        <p style={{ marginTop: "1rem" }}>
          &copy; 2025 DreamHomeCalc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
