// src/components/Header.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { supabase } from "../supabaseClient";
import "../styles/global.css";

const Header = () => {
  const { user, hasPaid } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/signin");
      setMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="header">
      <div className="container header-content">
        <div className="logo">
          <Link to="/">
            <h1>DreamHome Calc</h1>
          </Link>
        </div>

        <button 
          className="mobile-menu-btn" 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"}`}></i>
        </button>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/calculator" onClick={() => setMenuOpen(false)}>Calculators</Link>
          
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              {hasPaid && <span className="badge-pro">PRO</span>}
              <button onClick={handleLogout} className="btn-logout">
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/signin" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;