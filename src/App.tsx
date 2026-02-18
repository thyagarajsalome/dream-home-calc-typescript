import React, { Suspense, lazy, startTransition } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { ToastProvider } from "./context/ToastContext"; // <-- Toast Context imported

// Components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Hero from "./components/layout/Hero";
import FAQ from "./components/layout/FAQ";
import SEO from "./components/layout/SEO";
import CalculatorTabs from "./features/construction/CalculatorTabs";

// Lazy Load Calculators
const ConstructionCalculator = lazy(() => import("./features/construction/ConstructionCalculator"));
const FlooringCalculator = lazy(() => import("./features/construction/FlooringCalculator"));
const PaintingCalculator = lazy(() => import("./features/construction/PaintingCalculator"));
const PlumbingCalculator = lazy(() => import("./features/construction/PlumbingCalculator"));
const ElectricalCalculator = lazy(() => import("./features/construction/ElectricalCalculator"));
const InteriorCalculator = lazy(() => import("./features/construction/InteriorCalculator"));
const DoorsWindowsCalculator = lazy(() => import("./features/construction/DoorsWindowsCalculator"));
const MaterialQuantityCalculator = lazy(() => import("./features/construction/MaterialQuantityCalculator"));

const SignIn = lazy(() => import("./features/auth/SignIn"));
const SignUp = lazy(() => import("./features/auth/SignUp"));
const UpgradePage = lazy(() => import("./features/dashboard/UpgradePage"));
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Contact = lazy(() => import("./pages/Contact"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));

const Loading = () => (
  <div className="flex justify-center items-center min-h-[50vh] bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// REMOVED: "loan" | "eligibility"
type CalculatorType = "construction" | "interior" | "doors-windows" | "flooring" | "painting" | "plumbing" | "electrical" | "materials";

const MainLayout = () => {
  const { hasPaid } = useUser();
  const [activeCalculator, setActiveCalculator] = React.useState<CalculatorType>("construction");

  const handleTabChange = (tab: CalculatorType) => {
    startTransition(() => setActiveCalculator(tab));
  };

  const renderCalculator = () => {
    switch (activeCalculator) {
      case "construction": return <ConstructionCalculator />;
      case "materials": return <MaterialQuantityCalculator />;
      case "interior": return <InteriorCalculator hasPaid={hasPaid} />;
      case "doors-windows": return <DoorsWindowsCalculator hasPaid={hasPaid} />;
      case "flooring": return <FlooringCalculator />;
      case "painting": return <PaintingCalculator />;
      case "plumbing": return <PlumbingCalculator />;
      case "electrical": return <ElectricalCalculator />;
      // REMOVED: Loan cases
      default: return <ConstructionCalculator />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SEO title="Home Design English" description="Calculate construction and interior costs for your dream home in India." />
      <Header />
      
      <main className="flex-grow">
        <Hero />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <CalculatorTabs activeCalculator={activeCalculator} setActiveCalculator={handleTabChange} hasPaid={hasPaid} />
          
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

const ProtectedRoute = () => {
  const { user, loading } = useUser();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/signin" />;
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <Suspense fallback={<Loading />}><Outlet /></Suspense>
      </main>
      <Footer />
    </div>
  );
};

const InfoLayout = () => (
  <div className="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main className="flex-grow container mx-auto px-4 py-8 pt-24">
      <Suspense fallback={<Loading />}><Outlet /></Suspense>
    </main>
    <Footer />
  </div>
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

// FIX: Wrapped the App with ToastProvider here!
const App = () => (
  <ToastProvider>
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  </ToastProvider>
);

export default App;