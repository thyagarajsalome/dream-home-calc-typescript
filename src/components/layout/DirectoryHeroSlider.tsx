import React, { useEffect, useState } from 'react';
import { HeroService, HeroBanner } from '../../services/heroService';

const DirectoryHeroSlider = () => {
  const [slides, setSlides] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    HeroService.getBanners()
      .then(data => {
        setSlides(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || slides.length === 0) return null;

  return (
    <div className="w-full h-[400px] mb-8 overflow-hidden rounded-xl shadow-lg relative bg-secondary flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: `url(${slides[0].image_url})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <div className="relative z-10 px-12 text-white text-center">
        <h1 className="text-4xl font-bold mb-2">{slides[0].title || "Verified Professionals"}</h1>
        <p className="text-lg opacity-90">{slides[0].subtitle || "Connect with trusted experts near you."}</p>
      </div>
    </div>
  );
};

export default DirectoryHeroSlider;