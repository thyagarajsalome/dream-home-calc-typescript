// src/components/layout/FAQ.tsx
import React from "react";

export default function FAQ() {
  return (
    <section id="faq" className="py-16 bg-gray-50 border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-extrabold text-center text-secondary mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          
          <details className="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:border-primary/30 open:ring-1 open:ring-primary/20">
            <summary className="flex justify-between items-center font-bold text-gray-800 cursor-pointer list-none text-base md:text-lg focus:outline-none">
              <span>How accurate is this calculator?</span>
              <span className="transition-transform duration-300 group-open:rotate-180 text-primary">
                <i className="fas fa-chevron-down"></i>
              </span>
            </summary>
            <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
              This tool provides a preliminary estimate based on generalized industry averages in India. Actual costs will vary based on your city, specific material choices, labor rates, and architectural complexity. Always consult a professional contractor for a detailed quote.
            </p>
          </details>

          <details className="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:border-primary/30 open:ring-1 open:ring-primary/20">
            <summary className="flex justify-between items-center font-bold text-gray-800 cursor-pointer list-none text-base md:text-lg focus:outline-none">
              <span>What is included in the "Pro" version?</span>
              <span className="transition-transform duration-300 group-open:rotate-180 text-primary">
                <i className="fas fa-chevron-down"></i>
              </span>
            </summary>
            <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
              Upgrading to a Pro plan (unlocked by purchasing credit packages starting from ₹199) unlocks all specialized calculators (
              <strong className="text-primary">Materials BOQ</strong>
              , Flooring, Painting, Plumbing, Electrical, Interiors, Doors & Windows), enables Standard & Premium quality estimates in the main construction calculator, and removes all restrictions on saving or sharing reports.
            </p>
          </details>

          <details className="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:border-primary/30 open:ring-1 open:ring-primary/20">
            <summary className="flex justify-between items-center font-bold text-gray-800 cursor-pointer list-none text-base md:text-lg focus:outline-none">
              <span>What costs are NOT included in the estimate?</span>
              <span className="transition-transform duration-300 group-open:rotate-180 text-primary">
                <i className="fas fa-chevron-down"></i>
              </span>
            </summary>
            <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
              The estimate covers core construction and finishing. It does not include the cost of land, architectural fees, government permits, utility connections, interior furnishings (furniture, appliances), landscaping, or boundary walls.
            </p>
          </details>

          <details className="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:border-primary/30 open:ring-1 open:ring-primary/20">
            <summary className="flex justify-between items-center font-bold text-gray-800 cursor-pointer list-none text-base md:text-lg focus:outline-none">
              <span>How does my location affect the cost?</span>
              <span className="transition-transform duration-300 group-open:rotate-180 text-primary">
                <i className="fas fa-chevron-down"></i>
              </span>
            </summary>
            <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
              Costs differ significantly between cities. Metropolitan areas like Mumbai, Delhi, or Bengaluru have higher labor and material costs compared to smaller towns. Our calculator provides a general average; please adjust for your local market.
            </p>
          </details>

          <details className="group bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm transition-all duration-300 [&_summary::-webkit-details-marker]:hidden open:border-primary/30 open:ring-1 open:ring-primary/20">
            <summary className="flex justify-between items-center font-bold text-gray-800 cursor-pointer list-none text-base md:text-lg focus:outline-none">
              <span>Can I use the specialized calculators without a Pro account?</span>
              <span className="transition-transform duration-300 group-open:rotate-180 text-primary">
                <i className="fas fa-chevron-down"></i>
              </span>
            </summary>
            <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
              The basic Construction, Loan EMI, and Eligibility calculators are free to use. To access the specialized calculators for Interiors, Doors & Windows, Flooring, Painting, Plumbing, Electrical, and <strong className="text-primary">Materials BOQ</strong>, you will need to upgrade to a Pro account.
            </p>
          </details>

        </div>
      </div>
    </section>
  );
}
