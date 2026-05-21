import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { supabase } from "../../config/supabaseClient";

const Header = () => {
  const { user, hasPaid, signOut } = useUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/signin");
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-secondary dark:text-zinc-100 hover:text-primary transition-colors no-underline">
              <img src="/bg-logo.png" alt="HDE Logo" className="w-12 h-12 object-contain" />
              <span className="text-primary font-extrabold">HDE</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary font-medium transition-colors no-underline">Home</Link>
            
            {/* Professional Directory Link */}
            <Link to="/directory" className="text-gray-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary font-medium transition-colors no-underline">Find Professionals</Link>
            
            <Link to="/plans" className="text-gray-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary font-medium transition-colors no-underline">House Plans</Link>

            {user ? (
               <>
                <Link to="/dashboard" className="text-gray-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary font-medium transition-colors no-underline">Dashboard</Link>
                {hasPaid && (
                  <span className="px-2 py-1 text-xs font-bold text-white dark:text-black bg-primary rounded-full">
                    PRO
                  </span>
                )}
                <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/signin" className="px-5 py-2 text-sm font-medium text-white dark:text-zinc-950 bg-primary rounded-full shadow-md hover:shadow-lg transition-all no-underline">
                Sign In
              </Link>
            )}
          </nav>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-600 dark:text-zinc-400 hover:text-primary focus:outline-none p-2 cursor-pointer">
              <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 absolute w-full left-0 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-2 flex flex-col">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-zinc-300 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-zinc-900 no-underline" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link to="/directory" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-zinc-300 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-zinc-900 no-underline" onClick={() => setMenuOpen(false)}>
              Find Professionals
            </Link>
            <Link to="/plans" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-zinc-300 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-zinc-900 no-underline" onClick={() => setMenuOpen(false)}>
              House Plans
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-zinc-300 hover:text-primary dark:hover:text-primary hover:bg-gray-50 dark:hover:bg-zinc-900 no-underline" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/signin" className="block px-3 py-2 mt-4 text-center rounded-md text-base font-bold text-white dark:text-zinc-950 bg-primary no-underline" onClick={() => setMenuOpen(false)}>
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
