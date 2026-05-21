import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { UserProvider } from "../context/UserContext";
import { ToastProvider } from "../context/ToastContext";
import Header from "../components/layout/Header";
import Hero from "../components/layout/Hero";
import CalculatorSuite from "../features/construction/CalculatorSuite";

export default function HomeApp() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <UserProvider>
          <Header />
          <main className="flex-grow">
            <Hero />
            <CalculatorSuite />
          </main>
        </UserProvider>
      </ToastProvider>
    </Router>
  );
}
