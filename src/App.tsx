// src/App.tsx
import React, { Suspense, lazy, startTransition } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";

// --- FIXED IMPORTS START ---
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Hero from "./components/layout/Hero";
import FAQ from "./components/layout/FAQ";
import SEO from "./components/layout/SEO";
import CalculatorTabs from "./features/construction/CalculatorTabs"; // Moved to features
// --- FIXED IMPORTS END ---

// Lazy Components - Updated Paths
const Calculator = lazy(() => import("./features/construction/ConstructionCalculator")); // Updated based on your previous refactor
// OR if you kept the old name: const Calculator = lazy(() => import("./features/construction/Calculator"));

const FlooringCalculator = lazy(() => import("./features/construction/FlooringCalculator"));
const PaintingCalculator = lazy(() => import("./features/construction/PaintingCalculator"));
const PlumbingCalculator = lazy(() => import("./features/construction/PlumbingCalculator"));
const ElectricalCalculator = lazy(() => import("./features/construction/ElectricalCalculator"));
const InteriorCalculator = lazy(() => import("./features/construction/InteriorCalculator"));
const DoorsWindowsCalculator = lazy(() => import("./features/construction/DoorsWindowsCalculator"));
const MaterialQuantityCalculator = lazy(() => import("./features/construction/MaterialQuantityCalculator"));

const LoanCalculator = lazy(() => import("./features/loan/LoanCalculator"));
const LoanEligibilityCalculator = lazy(() => import("./features/loan/LoanEligibilityCalculator"));

const SignIn = lazy(() => import("./features/auth/SignIn"));
const SignUp = lazy(() => import("./features/auth/SignUp"));

const UpgradePage = lazy(() => import("./features/dashboard/UpgradePage"));
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));

// Pages usually stay in /pages, so these might be fine if you didn't move them
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Contact = lazy(() => import("./pages/Contact"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));

// Better Loading Spinner with Tailwind
const Loading = () => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

type CalculatorType = "construction" | "eligibility" | "loan" | "interior" | "doors-windows" | "flooring" | "painting" | "plumbing" | "electrical" | "materials";

const MainLayout = () => {
  const { hasPaid } = useUser();
  const [activeCalculator, setActiveCalculator] = React.useState<CalculatorType>("construction");

  const handleTabChange = (tab: CalculatorType) => {
    startTransition(() => {
      setActiveCalculator(tab);
    });
  };

  const renderCalculator = () => {
    switch (activeCalculator) {
      case "construction": return <Calculator />;
      case "eligibility": return <LoanEligibilityCalculator />;
      case "loan": return <LoanCalculator hasPaid={hasPaid} />;
      case "materials": return <MaterialQuantityCalculator />;
      case "interior": return <InteriorCalculator hasPaid={hasPaid} />;
      case "doors-windows": return <DoorsWindowsCalculator hasPaid={hasPaid} />;
      case "flooring": return <FlooringCalculator />;
      case "painting": return <PaintingCalculator />;
      case "plumbing": return <PlumbingCalculator />;
      case "electrical": return <ElectricalCalculator />;
      default: return <Calculator />;
    }
  };

  return (
    <>
      <SEO 
        title="Home Design English" 
        description="Calculate construction and interior costs for your dream home in India." 
      />
      <Header />
      <main className="min-h-screen bg-gray-50">
        <Hero />
        <CalculatorTabs activeCalculator={activeCalculator} setActiveCalculator={handleTabChange} hasPaid={hasPaid} />
        <div className="container mx-auto px-4 py-6">
          <Suspense fallback={<Loading />}>{renderCalculator()}</Suspense>
        </div>
        <FAQ />
      </main>
      <Footer />
    </>
  );
};

const ProtectedRoute = () => {
  const { user, loading } = useUser();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/signin" />;
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-20">
        <Suspense fallback={<Loading />}><Outlet /></Suspense>
      </main>
      <Footer />
    </>
  );
};

const InfoLayout = () => (
  <>
    <Header />
    <main className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <Suspense fallback={<Loading />}><Outlet /></Suspense>
    </main>
    <Footer />
  </>
);

const AppRoutes = () => {
  const { user, loading } = useUser();
  if (loading) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/signin" element={user ? <Navigate to="/" /> : <SignIn />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />
        
        <Route element={<InfoLayout />}>
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route path="/" element={<MainLayout />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <UserProvider>
    <AppRoutes />
  </UserProvider>
);

export default App;