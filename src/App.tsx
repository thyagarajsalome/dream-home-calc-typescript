// src/App.tsx
import React, { Suspense, lazy, startTransition } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { ToastProvider } from "./context/ToastContext";

// Layout components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Hero from "./components/layout/Hero";
import FAQ from "./components/layout/FAQ";
import SEO from "./components/layout/SEO";
import CalculatorTabs from "./features/construction/CalculatorTabs";

// Lazy-loaded calculators
const ConstructionCalculator  = lazy(() => import("./features/construction/ConstructionCalculator"));
const FlooringCalculator      = lazy(() => import("./features/construction/FlooringCalculator"));
const PaintingCalculator      = lazy(() => import("./features/construction/PaintingCalculator"));
const PlumbingCalculator      = lazy(() => import("./features/construction/PlumbingCalculator"));
const ElectricalCalculator    = lazy(() => import("./features/construction/ElectricalCalculator"));
const InteriorCalculator      = lazy(() => import("./features/construction/InteriorCalculator"));
const DoorsWindowsCalculator  = lazy(() => import("./features/construction/DoorsWindowsCalculator"));
const MaterialQuantityCalculator = lazy(() => import("./features/construction/MaterialQuantityCalculator"));

const SignIn       = lazy(() => import("./features/auth/SignIn"));
const SignUp       = lazy(() => import("./features/auth/SignUp"));
const UpgradePage  = lazy(() => import("./features/dashboard/UpgradePage"));
const Dashboard    = lazy(() => import("./features/dashboard/Dashboard"));
const PrivacyPolicy   = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService  = lazy(() => import("./pages/TermsOfService"));
const Contact         = lazy(() => import("./pages/Contact"));
const Disclaimer      = lazy(() => import("./pages/Disclaimer"));

const Loading = () => (
  <div className="flex justify-center items-center min-h-[50vh] bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

type CalculatorType =
  | "construction"
  | "interior"
  | "doors-windows"
  | "flooring"
  | "painting"
  | "plumbing"
  | "electrical"
  | "materials";

const MainLayout = () => {
  const { hasPaid } = useUser();
  const [activeCalculator, setActiveCalculator] = React.useState<CalculatorType>("construction");

  const handleTabChange = (tab: CalculatorType) => {
    startTransition(() => setActiveCalculator(tab));
  };

  const renderCalculator = () => {
    switch (activeCalculator) {
      case "construction":  return <ConstructionCalculator />;
      case "materials":     return <MaterialQuantityCalculator />;
      case "interior":      return <InteriorCalculator hasPaid={hasPaid} />;
      case "doors-windows": return <DoorsWindowsCalculator hasPaid={hasPaid} />;
      case "flooring":      return <FlooringCalculator />;
      case "painting":      return <PaintingCalculator />;
      case "plumbing":      return <PlumbingCalculator />;
      case "electrical":    return <ElectricalCalculator />;
      default:              return <ConstructionCalculator />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SEO
        title="Home Design English"
        description="Calculate construction and interior costs for your dream home in India."
      />
      <Header />

      <main className="flex-grow">
        <Hero />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <CalculatorTabs
            activeCalculator={activeCalculator}
            setActiveCalculator={handleTabChange}
            hasPaid={hasPaid}
          />
          <div className="mt-8 min-h-[600px]">
            <Suspense fallback={<Loading />}>
              {renderCalculator()}
            </Suspense>
          </div>
        </div>
        <FAQ />
      </main>

      <Footer />
    </div>
  );
};

// ... keep remaining ProtectedRoute, InfoLayout, AppRoutes, and App as they were ...