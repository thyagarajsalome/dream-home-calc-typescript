import React from "react";

export default function FAQ() {
  return (
    <section id="faq" className="container">
      <h2 className="section-title">Frequently Asked Questions</h2>
      <div className="faq-container">
        <details className="faq-item">
          <summary>Is this calculator accurate?</summary>
          <p>
            This tool provides a preliminary estimate based on standard industry
            percentages in India. Actual costs can vary based on your specific
            location, material choices, labor rates, and architectural design.
            Always consult with a professional contractor for a detailed quote.
          </p>
        </details>
        <details className="faq-item">
          <summary>What does "Finish Quality" mean?</summary>
          <p>
            <b>Basic:</b> Uses standard, budget-friendly materials for flooring,
            paint, and fittings. <br />
            <b>Standard:</b> A mix of quality and value, with better-grade
            materials and finishes. <br />
            <b>Premium:</b> Involves high-end, luxury materials, branded
            fittings, and specialized finishes.
          </p>
        </details>
        <details className="faq-item">
          <summary>What is included in the estimate?</summary>
          <p>
            The estimate covers the core civil, finishing, and basic
            electrical/plumbing work. It does not typically include the cost of
            land, architectural fees, government permits, interior furnishing,
            or landscaping.
          </p>
        </details>
      </div>
    </section>
  );
}
