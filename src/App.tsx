// src/App.tsx
import React, { Suspense, lazy, startTransition } from "react";
// FIX: Removed Router/BrowserRouter import. Only use Routes/Route.
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import CalculatorTabs from "./components/CalculatorTabs";
import FAQ from "./components/FAQ";
import SEO from "./components/SEO";

// Lazy Components
const Calculator = lazy(() => import("./components/Calculator"));
const FlooringCalculator = lazy(() => import("./components/FlooringCalculator"));
const PaintingCalculator = lazy(() => import("./components/PaintingCalculator"));
const PlumbingCalculator = lazy(() => import("./components/PlumbingCalculator"));
const ElectricalCalculator = lazy(() => import("./components/ElectricalCalculator"));
const LoanCalculator = lazy(() => import("./components/LoanCalculator"));
const LoanEligibilityCalculator = lazy(() => import("./components/LoanEligibilityCalculator"));
const DoorsWindowsCalculator = lazy(() => import("./components/DoorsWindowsCalculator"));
const InteriorCalculator = lazy(() => import("./components/InteriorCalculator"));
const MaterialQuantityCalculator = lazy(() => import("./components/MaterialQuantityCalculator"));
const SignIn = lazy(() => import("./components/SignIn"));
const SignUp = lazy(() => import("./components/SignUp"));
const UpgradePage = lazy(() => import("./components/UpgradePage"));
const Dashboard = lazy(() => import("./components/Dashboard"));
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

  // Wrap state update in startTransition to prevent suspension errors during tab switch
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
    // FIX: Wrapped everything in Suspense to handle lazy loading of routes
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