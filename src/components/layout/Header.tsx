// src/components/Header.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { supabase } from "../supabaseClient";

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-secondary hover:text-primary transition-colors">
              <i className="fas fa-home text-primary"></i>
              <span>DreamHome<span className="text-primary">Calc</span></span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-primary font-medium transition-colors">Home</Link>
            <Link to="/" className="text-gray-600 hover:text-primary font-medium transition-colors">Calculators</Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-primary font-medium transition-colors">Dashboard</Link>
                {hasPaid && (
                  <span className="px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-primary to-yellow-500 rounded-full">
                    PRO
                  </span>
                )}
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 text-sm font-medium text-red-500 border border-red-200 rounded-full hover:bg-red-50 transition-all"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link 
                to="/signin" 
                className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-full shadow-md hover:bg-yellow-600 hover:shadow-lg transition-all"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-600 hover:text-primary focus:outline-none p-2"
            >
              <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-2 flex flex-col">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              Calculators
            </Link>
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link 
                to="/signin" 
                className="block px-3 py-2 mt-4 text-center rounded-md text-base font-bold text-white bg-primary"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;