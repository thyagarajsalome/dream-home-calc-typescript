// src/components/Hero.tsx
import React from "react";

export default function Hero() {
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
        backgroundImage: `url('https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=2070&auto=format&fit=crop')`,
      }}
    >
      {/* Dark Overlay - Increased opacity to 70% for better contrast */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* FIX: Added !text-white and inline style to override global CSS h1 color */}
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold !text-white mb-6 leading-tight drop-shadow-lg"
          style={{ color: '#ffffff' }}
        >
          Build Your Dream, <br className="hidden md:block" />
          <span className="text-primary">Know Your Budget</span>
        </h1>
        
        <p className="text-lg md:text-xl !text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          Get accurate, detailed construction cost estimates for your home in India. 
          Plan smarter, avoid surprises, and bring your vision to life.
        </p>
        
        <button 
          onClick={scrollToTools} 
          className="inline-flex items-center gap-2 bg-primary hover:bg-yellow-500 text-white font-bold py-4 px-8 rounded-full shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-lg"
        >
          Start Calculating 
          <i className="fas fa-arrow-down"></i>
        </button>
      </div>
    </section>
  );
}