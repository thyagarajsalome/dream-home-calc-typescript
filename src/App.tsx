// src/App.tsx

import React from "react";
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

// --- Import Components ---
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

// --- Import Page Components ---
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

// Main Layout is now the "Public" Home Page too
const MainLayout = () => {
  const { hasPaid } = useUser(); // Returns false if not logged in
  const [activeCalculator, setActiveCalculator] =
    React.useState<CalculatorType>("construction");

  const renderCalculator = () => {
    switch (activeCalculator) {
      case "construction":
        return <Calculator />;
      case "eligibility":
        return <LoanEligibilityCalculator hasPaid={hasPaid} />;
      case "loan":
        return <LoanCalculator hasPaid={hasPaid} />;
      case "materials":
        return <MaterialQuantityCalculator hasPaid={hasPaid} />;
      case "interior":
        return <InteriorCalculator hasPaid={hasPaid} />;
      case "doors-windows":
        return <DoorsWindowsCalculator hasPaid={hasPaid} />;
      case "flooring":
        return <FlooringCalculator hasPaid={hasPaid} />;
      case "painting":
        return <PaintingCalculator hasPaid={hasPaid} />;
      case "plumbing":
        return <PlumbingCalculator hasPaid={hasPaid} />;
      case "electrical":
        return <ElectricalCalculator hasPaid={hasPaid} />;
      default:
        return <Calculator />;
    }
  };

  return (
    <>
      {/* Header handles Guest/User view internally via Context */}
      <Header />
      <main>
        <Hero />
        <CalculatorTabs
          activeCalculator={activeCalculator}
          setActiveCalculator={setActiveCalculator}
        />
        {renderCalculator()}
        <FAQ />
      </main>
      <Footer />
    </>
  );
};

// Layout for public static info pages
const InfoLayout = () => (
  <>
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
  </>
);

// Protected Route - Only for pages that strictly require an account (like Payments)
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
      setMessage(
        "Access denied. Could not verify email. Link might be expired."
      );
      navigate("/signup", { replace: true });
    } else if (
      hash.includes("access_token") &&
      hash.includes("refresh_token")
    ) {
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  if (message) {
    return (
      <div className="auth-container">
        <div className="card auth-card" style={{ textAlign: "center" }}>
          <h3 style={{ color: "var(--danger-color)" }}>Error</h3>
          <p>{message}</p>
          <Link to="/signup" className="btn" style={{ marginTop: "1.5rem" }}>
            Go to Sign Up
          </Link>
        </div>
      </div>
    );
  }
  return null;
};

const AppRoutes = () => {
  const { user, loading } = useUser();

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <Router>
      <AuthHandler />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/signin"
          element={user ? <Navigate to="/" /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <SignUp />}
        />

        {/* Static Info Pages */}
        <Route element={<InfoLayout />}>
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
        </Route>

        {/* OPEN ACCESS: The Main Calculator is now Public */}
        <Route path="/" element={<MainLayout />} />

        {/* PROTECTED: Only Upgrade requires login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/upgrade" element={<UpgradePage />} />
        </Route>

        {/* Fallback */}
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
