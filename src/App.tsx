import React, { Suspense, lazy } from "react";
// Changed HashRouter to BrowserRouter for cleaner URLs on your custom domain
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
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

const Loading = () => <div className="loading-container">Loading...</div>;

type CalculatorType = "construction" | "eligibility" | "loan" | "interior" | "doors-windows" | "flooring" | "painting" | "plumbing" | "electrical" | "materials";

const MainLayout = () => {
  const { hasPaid } = useUser();
  const [activeCalculator, setActiveCalculator] = React.useState<CalculatorType>("construction");

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
      {/* Updated branding name for SEO */}
      <SEO 
        title="Home Design English" 
        description="Calculate construction and interior costs for your dream home in India." 
      />
      <Header />
      <main>
        <Hero />
        <CalculatorTabs activeCalculator={activeCalculator} setActiveCalculator={setActiveCalculator} hasPaid={hasPaid} />
        <Suspense fallback={<Loading />}>{renderCalculator()}</Suspense>
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
      <main><Suspense fallback={<Loading />}><Outlet /></Suspense></main>
      <Footer />
    </>
  );
};

const InfoLayout = () => (
  <>
    <Header />
    <main style={{ minHeight: "60vh", padding: "2rem 0" }}>
      <Suspense fallback={<Loading />}><Outlet /></Suspense>
    </main>
    <Footer />
  </>
);

const AppRoutes = () => {
  const { user, loading } = useUser();
  if (loading) return <Loading />;

  return (
    <Router>
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
    </Router>
  );
};

const App = () => (
  <UserProvider>
    <AppRoutes />
  </UserProvider>
);

export default App;