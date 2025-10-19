import React from "react";

const heroStyles: React.CSSProperties = {
  backgroundImage: `linear-gradient(rgba(40, 40, 40, 0.6), rgba(40, 40, 40, 0.6)), url('https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=2070&auto=format&fit=crop')`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  color: "#fff",
  padding: "6rem 1rem",
  textAlign: "center",
};

export default function Hero() {
  const scrollToTools = () => {
    const toolsSection = document.getElementById("tools");
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" style={heroStyles}>
      <div className="container">
        <h1 className="hero-text-main" style={{ color: "#fff" }}>
          Build Your Dream, Know Your Budget
        </h1>
        <p>
          Our calculator gives you an instant, detailed cost estimate for
          building your home in India. Plan smarter, avoid surprises, and bring
          your vision to life.
        </p>
        <button onClick={scrollToTools} className="cta-button">
          Start Calculating <i className="fas fa-arrow-down"></i>
        </button>
      </div>
    </section>
  );
}
