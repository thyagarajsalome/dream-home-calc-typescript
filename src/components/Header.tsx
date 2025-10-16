import React, { useState } from "react";
import { signOut, User } from "firebase/auth";
import { auth } from "../firebase";

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header className="header">
      <nav className="navbar container">
        <a href="/" className="logo" onClick={closeMenu}>
          <i className="fas fa-home"></i> DreamHomeCalc
        </a>
        <ul className={isMenuOpen ? "nav-menu active" : "nav-menu"}>
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
        </ul>
        <div className="hamburger" onClick={toggleMenu}>
          <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </div>
      </nav>
    </header>
  );
};

export default Header;
