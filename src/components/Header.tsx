// src/components/Header.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUser } from "../context/UserContext";

const Header: React.FC = () => {
  const { user, installPrompt } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
  };

  // Close dropdown logic (keep existing)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="header">
      <nav className="navbar container">
        <Link to="/" className="logo">
          <img src="/icons/bg-logo.png" alt="Logo" />
          <span>DreamHome</span>
        </Link>

        <ul className={isMenuOpen ? "nav-menu active" : "nav-menu"}>
          {/* 1. Install Button */}
          {installPrompt && (
            <li>
              <button onClick={handleInstallClick} className="btn install-btn">
                <i className="fas fa-download"></i> Install
              </button>
            </li>
          )}

          {/* 2. Resources Dropdown */}
          <li className="dropdown" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="nav-link"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Resources <i className="fas fa-chevron-down fa-xs"></i>
            </button>
            <ul className={`dropdown-menu ${isDropdownOpen ? "show" : ""}`}>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <Link to="/disclaimer">Disclaimer</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy</Link>
              </li>
              <li>
                <Link to="/terms">Terms</Link>
              </li>
            </ul>
          </li>

          {/* 3. Auth & Dashboard Section */}
          {user ? (
            <>
              {/* MOVED: Dashboard is now a prominent button item */}
              <li style={{ marginLeft: "10px" }}>
                <Link
                  to="/dashboard"
                  className="btn"
                  style={{
                    backgroundColor: "var(--accent-color)",
                    color: "#fff",
                    padding: "0.5rem 1rem",
                  }}
                >
                  <i className="fas fa-columns"></i> My Dashboard
                </Link>
              </li>
              <li className="user-info" style={{ marginLeft: "15px" }}>
                {/* Truncate long emails */}
                <span>{user.email?.split("@")[0]}</span>
              </li>
              <li>
                <button
                  onClick={handleSignOut}
                  className="sign-out-btn"
                  style={{ marginLeft: "5px" }}
                >
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                to="/signin"
                className="btn"
                style={{ padding: "0.5rem 1.5rem" }}
              >
                Sign In
              </Link>
            </li>
          )}
        </ul>
        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </div>
      </nav>
    </header>
  );
};

export default Header;
