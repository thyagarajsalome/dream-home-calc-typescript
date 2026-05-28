import React, { useState, useEffect } from "react";

const screenshots = [
  {
    src: "/promo/01.webp",
    title: "All-in-One Construction Platform",
    description: "Get construction calculators, materials BOQ, plans, and professional directory in one app."
  },
  {
    src: "/promo/02.webp",
    title: "Find Verified Professionals",
    description: "Connect with verified local engineers, architects, and designers directly on WhatsApp or Call."
  },
  {
    src: "/promo/03.webp",
    title: "Detailed Cost Estimates",
    description: "Estimate costs for foundation, structure, finishing, plumbing, electrical, and flooring."
  },
  {
    src: "/promo/04.webp",
    title: "Material Quantity BOQ",
    description: "Calculate concrete, steel, bricks, tiles, paint, and other materials with absolute accuracy."
  },
  {
    src: "/promo/05.webp",
    title: "Premium Architectural Plans",
    description: "Access curated floor plans, 2D/3D elevations, structural blueprints, and space designs."
  }
];

const features = [
  {
    icon: "fa-calculator",
    color: "amber",
    title: "Civil Construction Calculator",
    desc: "Calculate precise cement, sand, aggregate, steel, and water amounts for slabs, beams, columns, and foundations."
  },
  {
    icon: "fa-file-invoice-dollar",
    color: "blue",
    title: "Material BOQ Generator",
    desc: "Export comprehensive Bill of Quantities lists to share with suppliers, saving up to 10% on wastage."
  },
  {
    icon: "fa-drafting-compass",
    color: "emerald",
    title: "Modern House Plans",
    desc: "Discover a gallery of multi-size floor plans, elevations, and structural drawings tailored for Indian homes."
  },
  {
    icon: "fa-address-book",
    color: "purple",
    title: "Contact Professionals",
    desc: "Connect directly with local verified civil engineers, interior decorators, and builders. No hidden fees."
  },
  {
    icon: "fa-paint-roller",
    color: "pink",
    title: "Finishing Calculators",
    desc: "Dedicated estimators for painting, tiling, flooring, doors, windows, false ceiling, and woodwork."
  },
  {
    icon: "fa-plug",
    color: "orange",
    title: "Plumbing & Electrical",
    desc: "Map out estimated fixture counts, pipe lengths, wiring details, and structural point-loads."
  }
];

const colorMap: Record<string, { bg: string; text: string }> = {
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400" },
  pink: { bg: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-600 dark:text-pink-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600 dark:text-orange-400" }
};

const AppPromoPage = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % screenshots.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % screenshots.length);
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  const playStoreLink = "https://play.google.com/store/apps/details?id=in.toolwebsite.twa";

  return (
    <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-gray-800 dark:text-zinc-200 min-h-screen py-10 transition-colors duration-200">
      {/* Top Banner Accent */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-8 lg:py-16">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-widest animate-pulse mx-auto lg:mx-0">
              <i className="fab fa-google-play"></i> Android App Available Now
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-secondary dark:text-zinc-100 tracking-tight leading-none uppercase">
              Build Your Dream Home <br />
              <span className="text-primary normal-case font-extrabold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">With Absolute Precision</span>
            </h1>
            
            <p className="text-gray-600 dark:text-zinc-400 text-lg sm:text-xl font-medium max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Download the official HDE Construction mobile app. Calculate structural costs, estimate materials (BOQ), explore gorgeous floor plans, and hire trusted building experts directly.
            </p>

            {/* Ratings & Downloads badge */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 py-2">
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl">
                <span className="text-2xl font-black text-secondary dark:text-zinc-100">4.8</span>
                <div className="flex flex-col">
                  <div className="flex text-amber-500 text-xs gap-0.5">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star-half-alt"></i>
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-zinc-500 font-bold uppercase">Play Store Rating</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl">
                <span className="text-2xl font-black text-secondary dark:text-zinc-100">1K+</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-800 dark:text-zinc-300">Downloads</span>
                  <span className="text-[10px] text-gray-500 dark:text-zinc-500 font-bold uppercase">Trusted Builders</span>
                </div>
              </div>
            </div>

            {/* Download Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a 
                href={playStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-secondary text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-95 group no-underline"
              >
                <i className="fab fa-google-play text-2xl text-primary dark:text-secondary group-hover:animate-bounce"></i>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 leading-none m-0">Download on</p>
                  <p className="text-base font-extrabold m-0 leading-tight">Google Play Store</p>
                </div>
              </a>

              <a 
                href="#screenshots" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 px-8 py-4 rounded-2xl font-bold text-lg transition-all no-underline"
              >
                Explore Features <i className="fas fa-arrow-down text-sm"></i>
              </a>
            </div>

            <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
              *Compatible with all Android versions 8.0+. Ad-free, secure, and lightweight (less than 10MB).
            </p>
          </div>

          {/* RIGHT COLUMN - PHONE CAROUSEL FRAME */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div 
              className="relative w-[300px] h-[610px] bg-zinc-900 rounded-[50px] p-3 shadow-2xl border-4 border-zinc-800 dark:border-zinc-700/80 transition-transform duration-300 hover:scale-[1.02]"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Speaker / Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-20 flex justify-center items-center">
                <div className="w-12 h-1 bg-zinc-800 rounded-full mb-1"></div>
              </div>

              {/* Screen Area */}
              <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-zinc-950 flex items-center justify-center">
                {/* Active Slide Image */}
                <div className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out">
                  <img 
                    src={screenshots[activeSlide].src} 
                    alt={screenshots[activeSlide].title} 
                    className="w-full h-full object-cover select-none"
                    loading="eager"
                  />
                </div>

                {/* Left/Right Overlays to navigate on hover */}
                <button 
                  onClick={handlePrev} 
                  className="absolute left-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center z-30 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label="Previous screenshot"
                >
                  <i className="fas fa-chevron-left text-xs"></i>
                </button>
                <button 
                  onClick={handleNext} 
                  className="absolute right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center z-30 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label="Next screenshot"
                >
                  <i className="fas fa-chevron-right text-xs"></i>
                </button>
              </div>

              {/* Phone Home Bar Indicator */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-zinc-700 rounded-full z-20"></div>
            </div>

            {/* Carousel Dot Indicators */}
            <div className="flex gap-2.5 mt-6">
              {screenshots.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    activeSlide === index 
                      ? "bg-primary w-6" 
                      : "bg-gray-300 dark:bg-zinc-700 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            <div className="mt-3 text-center px-4 max-w-[280px]">
              <p className="text-sm font-bold text-secondary dark:text-zinc-300 transition-all duration-300">
                {screenshots[activeSlide].title}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                {screenshots[activeSlide].description}
              </p>
            </div>
          </div>
        </section>

        <hr className="border-gray-100 dark:border-zinc-800/80 my-12" id="screenshots" />

        {/* DETAILS AND SCREENSHOT GRID */}
        <section className="py-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary dark:text-zinc-100 uppercase tracking-tight">
              App Features & Visuals
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 max-w-xl mx-auto font-medium text-sm sm:text-base">
              Swipe or click through the high-quality interface preview to see what HDE Construction App offers.
            </p>
          </div>

          {/* Full Screen Visual Carousel Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {screenshots.map((slide, index) => (
              <div 
                key={index} 
                onClick={() => setActiveSlide(index)}
                className={`cursor-pointer rounded-2xl overflow-hidden border-2 p-1.5 transition-all duration-300 hover:scale-[1.03] ${
                  activeSlide === index 
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                    : "border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 shadow-sm"
                }`}
              >
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-950">
                  <img 
                    src={slide.src} 
                    alt={slide.title} 
                    className="w-full h-full object-cover" 
                  />
                  {activeSlide === index && (
                    <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                      <span className="bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                        Viewing
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-200 line-clamp-1">{slide.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-gray-100 dark:border-zinc-800/80 my-12" />

        {/* VALUE PROPOSITION GRID */}
        <section className="py-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary dark:text-zinc-100 uppercase tracking-tight">
              Powerful Tools at Your Fingertips
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 max-w-xl mx-auto font-medium text-sm sm:text-base">
              The HDE app is equipped with calculations approved by civil engineers and architectural experts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const colors = colorMap[feature.color] || colorMap.blue;
              return (
                <div 
                  key={i} 
                  className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex gap-4"
                >
                  <div className={`p-4 h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}>
                    <i className={`fas ${feature.icon} text-lg`}></i>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">{feature.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <hr className="border-gray-100 dark:border-zinc-800/80 my-12" />

        {/* DIRECTORY BRIDGE SECTION */}
        <section className="py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800/80 p-8 md:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Image V1.webp (Highlighted and Large) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border-4 border-primary/30 transition-all duration-500 hover:scale-[1.03] w-full max-w-[320px]">
                <img 
                  src="/promo/V1.webp" 
                  alt="HDE Connection Directory" 
                  className="w-full h-auto object-cover select-none"
                />
              </div>
            </div>
            
            {/* Right: Text + Disclaimer */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
                  <i className="fas fa-users-cog"></i> HDE Professional Directory
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-secondary dark:text-zinc-100 uppercase tracking-tight">
                  Grow Your Business or Find Trusted Local Pros
                </h3>
              </div>

              {/* English-only Paragraph (No URL inside text) */}
              <div className="bg-gray-50 dark:bg-zinc-950 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800/80">
                <p className="text-gray-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed font-medium">
                  Need a quick repair or planning a major home build? 🏠 Or are you an architect, builder, contractor, plumber, electrician, carpenter, painter, or layman looking to grow your network? 🛠️ The HDE Directory is building a bridge to connect skilled professionals directly with the homeowners and contractors who need them. We are actively growing a network of trusted tradespeople—from everyday painters, carpenters, laymen, and plumbers to top-tier architects and builders. Whether you need reliable help in your area or want to put your business on the local map to connect with clients actively searching for your trade, we are making it easier than ever. Get listed early or find your next local pro today.
                </p>
              </div>

              {/* Link Directory Button */}
              <div className="pt-2">
                <a
                  href="/directory"
                  className="inline-flex items-center gap-2 bg-secondary hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all no-underline shadow hover:scale-[1.02]"
                >
                  Get Listed / Find Local Pros Today <i className="fas fa-chevron-right text-xs"></i>
                </a>
              </div>

              {/* Specific Disclaimer */}
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl text-xs flex gap-3 text-amber-850 dark:text-amber-400">
                <i className="fas fa-info-circle text-base shrink-0 mt-0.5"></i>
                <p className="leading-relaxed font-semibold">
                  <strong>Connection Bridge Disclaimer:</strong> We are trying to build a connection or bridge so that house owners can get work done, and at the same time professional services can be served on both ends. HDE does not employ, manage, or take liability for physical work executed by listed professionals.
                </p>
              </div>
            </div>
            
          </div>
        </section>

        <hr className="border-gray-100 dark:border-zinc-800/80 my-12" />

        {/* BOTTOM CALL TO ACTION CONTAINER */}
        <section className="my-16 bg-gradient-to-r from-secondary to-[#1c3563] dark:from-zinc-900 dark:to-zinc-800/80 text-white rounded-3xl py-12 px-8 md:py-16 md:px-16 shadow-xl relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute left-10 bottom-0 w-32 h-32 bg-secondary/35 rounded-full filter blur-2xl translate-y-1/2"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight !text-white" style={{ color: '#ffffff' }}>
                Ready to Simplify Your House Construction?
              </h2>
              <p className="text-gray-300 font-medium max-w-xl text-base sm:text-lg">
                Join thousands of Indian homeowners and builders who estimate smarter, save material costs, and connect with trusted professionals. Download HDE Construction App for free today!
              </p>
            </div>
            
            <div className="lg:col-span-4 flex flex-col gap-4 items-center justify-center">
              <a 
                href={playStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-primary text-white hover:bg-primary-hover px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-95 text-center no-underline"
              >
                <i className="fab fa-google-play text-2xl"></i>
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-white/70 leading-none m-0">Download Free</p>
                  <p className="text-base font-extrabold m-0 mt-0.5 leading-tight">Get App on Play Store</p>
                </div>
              </a>
              <span className="text-[10px] text-gray-400 font-bold uppercase">
                100% Free &bull; No credit card required
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AppPromoPage;
