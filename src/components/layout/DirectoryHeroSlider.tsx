import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { HeroService } from '../../services/heroService';
import type { HeroBanner } from '../../services/heroService';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const DirectoryHeroSlider = () => {
  // Added proper TypeScript typing instead of any[]
  const [slides, setSlides] = useState<HeroBanner[]>([]);

  useEffect(() => {
    const cached = localStorage.getItem("hde_hero_banners_cache");
    if (cached) {
      setSlides(JSON.parse(cached));
    }
    HeroService.getBanners()
      .then((data) => {
        setSlides(data);
        localStorage.setItem("hde_hero_banners_cache", JSON.stringify(data));
      })
      .catch((err) => console.error("Failed to load banners:", err));
  }, []);

  if (slides.length === 0) return null;

  return (
    <div className="w-full h-[400px] mb-8 overflow-hidden rounded-xl shadow-lg">
      <Swiper
        spaceBetween={30}
        centeredSlides={true}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        className="h-full w-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div 
              className="relative w-full h-full bg-cover bg-center flex items-center"
              style={{ backgroundImage: `url(${slide.image_url})` }}
            >
              {/* Dark Overlay for Text Readability */}
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 px-12 text-white">
                <h1 className="text-4xl font-bold mb-2">{slide.title}</h1>
                {/* Updated to use slide.subtitle to match your HeroBanner interface */}
                <p className="text-lg opacity-90">{slide.subtitle}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default DirectoryHeroSlider;