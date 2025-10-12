import React from "react";

export default function Header() {
  return (
    <header className="header">
      <nav className="navbar container">
        <a href="#home" className="logo">
          <i className="fas fa-home"></i> DreamHomeCalc
        </a>
        <ul className="nav-menu">
          <li>
            <a href="#home" className="nav-link">
              Home
            </a>
          </li>
          <li>
            <a href="#about" className="nav-link">
              About
            </a>
          </li>
          <li>
            <a href="#tools" className="nav-link">
              Calculator
            </a>
          </li>
          <li>
            <a href="#faq" className="nav-link">
              FAQ
            </a>
          </li>
        </ul>
        <div className="hamburger">
          <i className="fas fa-bars"></i>
        </div>
      </nav>
    </header>
  );
}
