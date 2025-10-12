import React from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Calculator from "./components/Calculator";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div>
      <Header />
      <main>
        <Hero />
        <section id="about" className="container">
          <h2 className="section-title">Why Use Our Calculator?</h2>
          <p>
            DreamHomeCalc was created to demystify the construction budgeting
            process. We provide a transparent, easy-to-use tool for homeowners,
            builders, and designers in India. Our estimates are based on current
            market standards, giving you a realistic financial picture to help
            you make informed decisions for your project.
          </p>
        </section>
        <Calculator />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
