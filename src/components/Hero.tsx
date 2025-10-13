import React from "react";

export default function Hero() {
  return (
    <section id="home">
      <div className="container">
        <h1 className="hero-text-main">Build Your Dream, Know Your Budget</h1>
        <p>
          Our calculator gives you an instant, detailed cost estimate for
          building your home in India. Plan smarter, avoid surprises, and bring
          your vision to life.
        </p>
        <a href="#tools" className="cta-button">
          Start Calculating <i className="fas fa-arrow-down"></i>
        </a>
      </div>
    </section>
  );
}
