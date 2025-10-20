// src/components/FAQ.tsx
export default function FAQ() {
  return (
    <section id="faq">
      <div className="faq-container">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <details className="faq-item">
          <summary>How accurate is this calculator?</summary>
          <p>
            This tool provides a preliminary estimate based on generalized
            industry averages in India. Actual costs will vary based on your
            city, specific material choices, labor rates, and architectural
            complexity. Always consult a professional contractor for a detailed
            quote.
          </p>
        </details>
        <details className="faq-item">
          <summary>What is included in the "Pro" version?</summary>
          <p>
            The one-time Pro upgrade unlocks all specialized calculators
            (Flooring, Painting, Plumbing, Electrical, Interiors, Doors &
            Windows), enables Standard & Premium quality estimates in the main
            construction calculator, and removes all restrictions on saving or
            sharing reports.
          </p>
        </details>
        <details className="faq-item">
          <summary>What costs are NOT included in the estimate?</summary>
          <p>
            The estimate covers core construction and finishing. It does not
            include the cost of land, architectural fees, government permits,
            utility connections, interior furnishings (furniture, appliances),
            landscaping, or boundary walls.
          </p>
        </details>
        <details className="faq-item">
          <summary>How does my location affect the cost?</summary>
          <p>
            Costs differ significantly between cities. Metropolitan areas like
            Mumbai, Delhi, or Bengaluru have higher labor and material costs
            compared to smaller towns. Our calculator provides a general
            average; please adjust for your local market.
          </p>
        </details>
        <details className="faq-item">
          <summary>
            Can I use the specialized calculators without a Pro account?
          </summary>
          <p>
            The basic Construction, Loan EMI, and Eligibility calculators are
            free to use. To access the specialized calculators for Interiors,
            Doors & Windows, Flooring, Painting, Plumbing, and Electrical, you
            will need to upgrade to a Pro account.
          </p>
        </details>
      </div>
    </section>
  );
}
