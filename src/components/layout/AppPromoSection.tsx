import React from "react";
import { Link } from "react-router-dom";

const AppPromoSection = () => {
  const playStoreLink = "https://play.google.com/store/apps/details?id=in.toolwebsite.twa";

  // Injected CSS animations for the banner
  const customStyles = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(1deg); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 10px 30px -10px rgba(15, 32, 66, 0.3), 0 0 15px rgba(197, 160, 89, 0.15); border-color: rgba(197, 160, 89, 0.2); }
      50% { box-shadow: 0 20px 40px -10px rgba(15, 32, 66, 0.5), 0 0 25px rgba(197, 160, 89, 0.4); border-color: rgba(197, 160, 89, 0.5); }
    }
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    .animate-float-mockup {
      animation: float 4.5s ease-in-out infinite;
    }
    .animate-glow-border {
      animation: pulse-glow 3s ease-in-out infinite;
    }
    .button-shimmer-container {
      position: relative;
      overflow: hidden;
    }
    .button-shimmer-effect::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      animation: shimmer 3s infinite;
    }
  `;

  return (
    <section className="py-16 bg-gradient-to-br from-white via-gray-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 transition-colors duration-200 border-t border-b border-gray-100 dark:border-zinc-800/80">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="bg-gradient-to-r from-secondary to-[#172c54] dark:from-zinc-900 dark:to-zinc-800/90 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col lg:flex-row items-center gap-12 border-2 border-primary/20 animate-glow-border">
          
          {/* Decorative Background Glows */}
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl translate-y-1/3 translate-x-1/3"></div>
          <div className="absolute left-0 top-0 w-48 h-48 bg-blue-500/10 rounded-full filter blur-2xl -translate-y-1/3 -translate-x-1/3"></div>

          {/* Left Text Side */}
          <div className="flex-1 space-y-6 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-widest mx-auto lg:mx-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <i className="fab fa-google-play"></i> HDE Mobile App
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">
              Take HDE on the go <br />
              <span className="text-primary normal-case font-extrabold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">Estimate & Plan Anywhere</span>
            </h2>

            <p className="text-gray-300 font-medium text-base sm:text-lg max-w-xl leading-relaxed">
              Calculate construction costs offline, generate material lists, view modern house designs, and connect with engineers directly from your mobile phone.
            </p>

            {/* Micro Rating Badge */}
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <div className="flex items-center gap-1 text-amber-400">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <span className="text-xs text-gray-300 font-bold uppercase">
                4.8/5 Rating &bull; 10,000+ Installs
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href={playStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary text-white hover:bg-primary-hover px-6 py-3.5 rounded-2xl font-black text-base transition-all shadow-lg hover:scale-[1.02] active:scale-95 no-underline button-shimmer-container button-shimmer-effect"
              >
                <i className="fab fa-google-play text-xl"></i> Install Free App
              </a>

              <Link
                to="/app"
                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white bg-white/5 hover:bg-white/10 px-6 py-3.5 rounded-2xl font-bold text-base transition-all no-underline"
              >
                See Features & Screenshots <i className="fas fa-arrow-right text-xs"></i>
              </Link>
            </div>
          </div>

          {/* Right Phone Frame Mockup with Floating Animation */}
          <div className="relative shrink-0 w-[240px] h-[480px] bg-zinc-950 rounded-[40px] p-2 shadow-2xl border-4 border-zinc-800 dark:border-zinc-700/80 z-10 hidden sm:block animate-float-mockup">
            {/* Camera / Speaker notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-950 rounded-b-xl z-20"></div>
            
            {/* Screen */}
            <div className="w-full h-full rounded-[30px] overflow-hidden bg-zinc-900">
              <img 
                src="/promo/01.webp" 
                alt="HDE App Screenshot" 
                className="w-full h-full object-cover select-none pointer-events-none" 
              />
            </div>

            {/* Navigation indicator overlay */}
            <Link 
              to="/app"
              className="absolute inset-0 w-full h-full rounded-[40px] bg-black/10 hover:bg-black/45 flex items-center justify-center transition-all duration-300 group cursor-pointer"
            >
              <span className="opacity-0 group-hover:opacity-100 bg-primary text-white font-black px-4 py-2 rounded-full uppercase tracking-wider text-xs shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                View Gallery <i className="fas fa-external-link-alt ml-1"></i>
              </span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AppPromoSection;
