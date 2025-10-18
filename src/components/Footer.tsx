import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <ul className="footer-links">
          <li>
            <Link to="/contact">Contact</Link>
          </li>
          <li>
            <Link to="/disclaimer">Disclaimer</Link>
          </li>
          <li>
            <Link to="/privacy">Privacy Policy</Link>
          </li>
          <li>
            <Link to="/terms">Terms of Service</Link>
          </li>
        </ul>
        <p>&copy; 2025 DreamHomeCalc. All rights reserved.</p>
      </div>
    </footer>
  );
}
