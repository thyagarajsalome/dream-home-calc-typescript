import React, { useState, useEffect } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("main section");

    const handleScroll = () => {
      let current = "";
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 100) {
          current = section.getAttribute("id") || "";
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href")?.includes(current)) {
          link.classList.add("active");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="header">
      <nav className="navbar container">
        <a href="#home" className="logo" onClick={closeMenu}>
          <i className="fas fa-home"></i> DreamHomeCalc
        </a>
        <ul className={isMenuOpen ? "nav-menu active" : "nav-menu"}>
          <li>
            <a href="#home" className="nav-link" onClick={closeMenu}>
              Home
            </a>
          </li>
          <li>
            <a href="#about" className="nav-link" onClick={closeMenu}>
              About
            </a>
          </li>
          <li>
            <a href="#tools" className="nav-link" onClick={closeMenu}>
              Calculator
            </a>
          </li>
          <li>
            <a href="#faq" className="nav-link" onClick={closeMenu}>
              FAQ
            </a>
          </li>
        </ul>
        <div className="hamburger" onClick={toggleMenu}>
          <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </div>
      </nav>
    </header>
  );
}
