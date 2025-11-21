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
          <img src="/icons/bg-logo.png" alt="DreamHomeCalc Logo" />
          <span>HDE</span>
        </Link>

        <ul className={isMenuOpen ? "nav-menu active" : "nav-menu"}>
          {/* --- NEW: Dashboard Link for Logged In Users --- */}
          {user && (
            <li>
              <Link
                to="/dashboard"
                className="nav-link"
                style={{ fontWeight: "bold", color: "var(--primary-color)" }}
              >
                <i className="fas fa-columns"></i> Dashboard
              </Link>
            </li>
          )}
          {/* ----------------------------------------------- */}

          {installPrompt && (
            <li>
              <button onClick={handleInstallClick} className="btn install-btn">
                <i className="fas fa-download"></i> Install
              </button>
            </li>
          )}

          {user ? (
            <>
              <li className="user-info">
                <span>{user.email}</span>
              </li>
              <li>
                <button onClick={handleSignOut} className="sign-out-btn">
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                to="/signin"
                className="btn"
                style={{ padding: "0.5rem 1rem" }}
              >
                Sign In
              </Link>
            </li>
          )}

          <li className="dropdown" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="nav-link"
              style={{ background: "none", border: "none", cursor: "pointer" }}
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
                <Link to="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms">Terms of Service</Link>
              </li>
            </ul>
          </li>
        </ul>
        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </div>
      </nav>
    </header>
  );
};

export default Header;
