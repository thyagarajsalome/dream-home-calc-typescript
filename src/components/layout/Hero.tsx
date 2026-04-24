import React, { useEffect, useState } from "react";
import { HeroService, HeroBanner } from "../../services/heroService";
import { useGSAPHeroParallax } from "../../hooks/useGSAP";

export default function Hero() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Apply parallax effect to the container and button wrapper
  useGSAPHeroParallax("#home", ".hero-content");

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const data = await HeroService.getBanners();
        setBanners(data);
      } catch (err) {
        console.error("Failed to load hero images", err);
      } finally {
        setLoading(false);
      }
    };
    loadBanners();
  }, []);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  const scrollToTools = () => {
    const toolsSection = document.getElementById("tools");
    if (toolsSection) toolsSection.scrollIntoView({ behavior: "smooth" });
  };

  if (loading || banners.length === 0) {
    return <div className="h-[45vh] md:h-[55vh] lg:h-[65vh] bg-gray-200 animate-pulse"></div>;
  }

  return (
    <section 
      id="home" 
      className="relative w-full h-[45vh] sm:h-[50vh] md:h-[55vh] lg:h-[65vh] overflow-hidden flex items-center justify-center bg-secondary"
    >
      {/* Image Slider Layer */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
          }`}
          style={{
            backgroundImage: `url(${banner.image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transitionProperty: "opacity, transform",
          }}
        >
          {/* Light overlay to make UI elements pop */}
          <div className="absolute inset-0 bg-black/15"></div>
        </div>
      ))}

      {/* Centered Button Overlay */}
      <div className="hero-content relative z-10 container mx-auto px-4 text-center">
        <button
          onClick={scrollToTools}
          className="inline-flex items-center gap-2 md:gap-3 bg-primary hover:bg-yellow-600 text-white font-bold 
                     py-3 px-8 text-base 
                     md:py-4 md:px-10 md:text-lg 
                     rounded-full shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
        >
          Start Calculating
          <i className="fas fa-arrow-down text-sm"></i>
        </button>
      </div>

      {/* Navigation Indicators (Dots) */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-3">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`transition-all duration-300 rounded-full ${
              i === currentIndex 
                ? "w-6 md:w-8 h-1.5 md:h-2 bg-primary" 
                : "w-1.5 md:w-2 h-1.5 md:h-2 bg-white/40 hover:bg-white"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}