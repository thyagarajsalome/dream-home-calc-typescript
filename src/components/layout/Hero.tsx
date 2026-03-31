import React, { useEffect } from "react";
import { useGSAPHeroParallax } from "../../hooks/useGSAP";

export default function Hero() {
  // GSAP parallax — subtle background shift + content fade as user scrolls
  useGSAPHeroParallax("#home", ".hero-content");

  const scrollToTools = () => {
    const toolsSection = document.getElementById("tools");
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      className="relative w-full py-24 md:py-32 flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url('/hero-pic.webp')`,
        backgroundAttachment: "scroll", // GSAP takes over, no CSS fixed needed
      }}
    >
      {/* Light overlay */}
      <div className="absolute inset-0 bg-white/0"></div>

      {/* hero-content class is what GSAP targets for the fade-out-on-scroll */}
      <div className="hero-content relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary mb-6 leading-tight drop-shadow-sm">
          Build Your Dream, <br className="hidden md:block" />
          <span className="text-primary">Know Your Budget</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-800 mb-10 max-w-2xl mx-auto leading-relaxed">
          Get accurate, detailed construction cost estimates for your home in India.
          Plan smarter, avoid surprises, and bring your vision to life.
        </p>

        <button
          onClick={scrollToTools}
          className="inline-flex items-center gap-2 bg-primary hover:bg-yellow-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-lg"
        >
          Start Calculating
          <i className="fas fa-arrow-down"></i>
        </button>
      </div>
    </section>
  );
}