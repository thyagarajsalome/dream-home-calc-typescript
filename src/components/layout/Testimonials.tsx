// src/components/layout/Testimonials.tsx
import React from "react";

const TESTIMONIALS = [
  { name: "Anand Sharma", city: "Delhi", comment: "The construction calculator is spot on. It saved me from a major budgeting error during my foundation phase." },
  { name: "Manjunatha R", city: "Bengaluru", comment: "I love the house plans collection! The compliant designs helped us finalize our dream home layout." },
  { name: "Vikram Rao", city: "Hyderabad", comment: "HDE's material BOQ tool is a game changer for contractors. The brand recommendations are very practical." },
  { name: "Sneha Patil", city: "Mumbai", comment: "The interior cost estimator helped us plan our 3BHK renovation perfectly without any hidden surprises." },
  { name: "Rajesh Gupta", city: "Kolkata", comment: "Simple, effective, and finally a tool tailored specifically for the Indian construction market." },
  { name: "Murugan Raj", city: "Chennai", comment: "The plumbing and electrical calculators are incredibly detailed. Great job on the technical specs!" },
  { name: "Amit Shah", city: "Ahmedabad", comment: "Saved hours of manual calculations. The PDF reports are professional and easy to share with builders." },
  { name: "David Johnson", city: "Pune", comment: "Highly recommend HDE for anyone building a home. The floor plans are modern and functional." },
];

export default function Testimonials() {
  return (
    <section className="bg-gray-900 py-16 overflow-hidden">
      <div className="container mx-auto px-4 mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Trusted by Home Builders</h2>
        <p className="text-primary font-medium tracking-widest uppercase text-sm">Real feedback from across India</p>
      </div>

      {/* Infinite Scroll Container */}
      <div className="flex w-full overflow-hidden group">
        <div className="flex animate-marquee whitespace-nowrap py-4 pause-on-hover">
          {/* Doubling the list for a seamless loop */}
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <div key={i} className="inline-block mx-4 w-80 md:w-96 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl whitespace-normal align-top">
              <div className="flex items-center gap-1 text-primary mb-3">
                {[...Array(5)].map((_, i) => <i key={i} className="fas fa-star text-xs"></i>)}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">"{t.comment}"</p>
              <div className="border-t border-gray-700 pt-3">
                <p className="text-white font-bold text-sm">{t.name}</p>
                <p className="text-gray-500 text-xs uppercase tracking-tighter">{t.city}, India</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 45s linear infinite;
        }
        .pause-on-hover:hover {
          animation-play-state: paused;
        }
      `}} />
    </section>
  );
}