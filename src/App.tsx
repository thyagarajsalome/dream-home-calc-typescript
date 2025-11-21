// src/App.tsx
import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
// ... existing imports ...
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Calculator from "./components/Calculator";
import FlooringCalculator from "./components/FlooringCalculator";
import PaintingCalculator from "./components/PaintingCalculator";
import PlumbingCalculator from "./components/PlumbingCalculator";
import ElectricalCalculator from "./components/ElectricalCalculator";
import LoanCalculator from "./components/LoanCalculator";
import LoanEligibilityCalculator from "./components/LoanEligibilityCalculator";
import DoorsWindowsCalculator from "./components/DoorsWindowsCalculator";
import InteriorCalculator from "./components/InteriorCalculator";
import CalculatorTabs from "./components/CalculatorTabs";
import FAQ from "./components/FAQ";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import UpgradePage from "./components/UpgradePage";
import MaterialQuantityCalculator from "./components/MaterialQuantityCalculator";
import Dashboard from "./components/Dashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import Disclaimer from "./pages/Disclaimer";

type CalculatorType =
  | "construction"
  | "eligibility"
  | "loan"
  | "interior"
  | "doors-windows"
  | "flooring"
  | "painting"
  | "plumbing"
  | "electrical"
  | "materials";

const MainLayout = () => {
  const { hasPaid } = useUser();
  const location = useLocation();
  const [activeCalculator, setActiveCalculator] =
    React.useState<CalculatorType>("construction");

  // Handle navigation from Dashboard Edit button
  useEffect(() => {
    if (location.state && (location.state as any).calculatorType) {
      setActiveCalculator((location.state as any).calculatorType);
    }
  }, [location]);

  const renderCalculator = () => {
    switch (activeCalculator) {
      case "construction":
        return <Calculator />;
      case "eligibility":
        return <LoanEligibilityCalculator />;
      case "loan":
        return <LoanCalculator />;
      case "materials":
        return <MaterialQuantityCalculator />;
      case "interior":
        return <InteriorCalculator hasPaid={hasPaid} />;
      case "doors-windows":
        return <DoorsWindowsCalculator hasPaid={hasPaid} />;
      case "flooring":
        return <FlooringCalculator />;
      case "painting":
        return <PaintingCalculator />;
      case "plumbing":
        return <PlumbingCalculator />;
      case "electrical":
        return <ElectricalCalculator />;
      default:
        return <Calculator />;
    }
  };

  return (
    <>
      <Header />
      <main>
        <Hero />
        <CalculatorTabs
          activeCalculator={activeCalculator}
          setActiveCalculator={setActiveCalculator}
          hasPaid={hasPaid}
        />
        {renderCalculator()}
        <FAQ />
      </main>
      <Footer />
    </>
  );
};

// ... Keep InfoLayout, ProtectedRoute, AuthHandler, AppRoutes, App same as before ...
const InfoLayout = () => (
  <>
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
  </>
);
const ProtectedRoute = () => {
  const { user, loading } = useUser();
  if (loading) return <div className="loading-container">Loading...</div>;
  if (!user) return <Navigate to="/signin" />;
  return <Outlet />;
};

const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = React.useState<string | null>(null);
  React.useEffect(() => {
    const hash = location.hash;
    if (hash.includes("error=access_denied")) {
      setMessage("Access denied. Could not verify email.");
      navigate("/signup", { replace: true });
    } else if (hash.includes("access_token")) {
      navigate("/", { replace: true });
    }
  }, [location, navigate]);
  if (message)
    return (
      <div className="auth-container">
        <div className="card auth-card">
          <p>{message}</p>
        </div>
      </div>
    );
  return null;
};

const AppRoutes = () => {
  const { user, loading } = useUser();
  if (loading) return <div className="loading-container">Loading...</div>;
  return (
    <Router>
      <AuthHandler />
      <Routes>
        <Route
          path="/signin"
          element={user ? <Navigate to="/" /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <SignUp />}
        />
        <Route element={<InfoLayout />}>
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
        </Route>
        <Route path="/" element={<MainLayout />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
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
