import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";

interface HeaderProps {
  user: User | null;
  installPrompt: any;
}

const Header: React.FC<HeaderProps> = ({ user, installPrompt }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      <nav className="navbar container">
        <Link to="/" className="logo">
          <i className="fas fa-home"></i> DreamHomeCalc
        </Link>
        <ul className={isMenuOpen ? "nav-menu active" : "nav-menu"}>
          {installPrompt && (
            <li>
              <button onClick={handleInstallClick} className="btn install-btn">
                <i className="fas fa-download"></i> Install App
              </button>
            </li>
          )}
          {user && (
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
                <Link to="/contact" onClick={() => setIsDropdownOpen(false)}>
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" onClick={() => setIsDropdownOpen(false)}>
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/privacy" onClick={() => setIsDropdownOpen(false)}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" onClick={() => setIsDropdownOpen(false)}>
                  Terms of Service
                </Link>
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
