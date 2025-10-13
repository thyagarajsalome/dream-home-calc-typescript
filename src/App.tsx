import React from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Calculator from "./components/Calculator";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <div>
        <main>
          {/* <Hero /> */}
          <Calculator />
          <FAQ />
        </main>
        <Header />
        <Footer />
      </div>
    </>
  );
}
