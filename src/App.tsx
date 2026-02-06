import React, { Suspense, lazy } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import CalculatorTabs from "./components/CalculatorTabs";
import FAQ from "./components/FAQ";
import SEO from "./components/SEO"; // Import SEO Component

// Lazy Load Components for Performance
const Calculator = lazy(() => import("./components/Calculator"));
const FlooringCalculator = lazy(
  () => import("./components/FlooringCalculator")
);
const PaintingCalculator = lazy(
  () => import("./components/PaintingCalculator")
);
const PlumbingCalculator = lazy(
  () => import("./components/PlumbingCalculator")
);
const ElectricalCalculator = lazy(
  () => import("./components/ElectricalCalculator")
);
const LoanCalculator = lazy(() => import("./components/LoanCalculator"));
const LoanEligibilityCalculator = lazy(
  () => import("./components/LoanEligibilityCalculator")
);
const DoorsWindowsCalculator = lazy(
  () => import("./components/DoorsWindowsCalculator")
);
const InteriorCalculator = lazy(
  () => import("./components/InteriorCalculator")
);
const MaterialQuantityCalculator = lazy(
  () => import("./components/MaterialQuantityCalculator")
);
const SignIn = lazy(() => import("./components/SignIn"));
const SignUp = lazy(() => import("./components/SignUp"));
const UpgradePage = lazy(() => import("./components/UpgradePage"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Contact = lazy(() => import("./pages/Contact"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));

// Loading Spinner
const Loading = () => <div className="loading-container">Loading...</div>;

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
  const [activeCalculator, setActiveCalculator] =
    React.useState<CalculatorType>("construction");

  const renderCalculator = () => {
    switch (activeCalculator) {
      case "construction":
        return <Calculator />;
      case "eligibility":
        return <LoanEligibilityCalculator />;
      case "loan":
        return <LoanCalculator hasPaid={hasPaid} />;
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
      <SEO
        title="Cost Calculator"
        description="Calculate construction costs, materials, and loan eligibility for building your dream home in India."
        keywords="construction cost calculator, home loan calculator, interior design cost, flooring estimator"
      />
      <Header />
      <main>
        <Hero />
        <CalculatorTabs
          activeCalculator={activeCalculator}
          setActiveCalculator={setActiveCalculator}
          hasPaid={hasPaid}
        />
        <Suspense fallback={<Loading />}>{renderCalculator()}</Suspense>
        <FAQ />
      </main>
      <Footer />
    </>
  );
};

const InfoLayout = () => (
  <>
    <Header />
    <main>
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </main>
    <Footer />
  </>
);

const ProtectedRoute = () => {
  const { user, loading } = useUser();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/signin" />;
  return (
    <Suspense fallback={<Loading />}>
      <Outlet />
    </Suspense>
  );
};

const AuthHandler = () => {
  // Logic from original file to handle auth redirects
  return null;
};

const AppRoutes = () => {
  const { user, loading } = useUser();
  if (loading) return <Loading />;

  return (
    <Router>
      <AuthHandler />
      <Routes>
        <Route
          path="/signin"
          element={
            <Suspense fallback={<Loading />}>
              <SEO title="Sign In" description="Sign in to your account." />
              {user ? <Navigate to="/" /> : <SignIn />}
            </Suspense>
          }
        />
        <Route
          path="/signup"
          element={
            <Suspense fallback={<Loading />}>
              <SEO title="Sign Up" description="Create a free account." />
              {user ? <Navigate to="/" /> : <SignUp />}
            </Suspense>
          }
        />

        <Route element={<InfoLayout />}>
          <Route
            path="/privacy"
            element={
              <>
                <SEO title="Privacy Policy" description="Our privacy policy." />
                <PrivacyPolicy />
              </>
            }
          />
          <Route
            path="/terms"
            element={
              <>
                <SEO
                  title="Terms of Service"
                  description="Read our terms of service."
                />
                <TermsOfService />
              </>
            }
          />
          <Route
            path="/contact"
            element={
              <>
                <SEO
                  title="Contact Us"
                  description="Get in touch with the DreamHomeCalc team."
                />
                <Contact />
              </>
            }
          />
          <Route
            path="/disclaimer"
            element={
              <>
                <SEO title="Disclaimer" description="Usage disclaimer." />
                <Disclaimer />
              </>
            }
          />
        </Route>

        <Route path="/" element={<MainLayout />} />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/upgrade"
            element={
              <>
                <SEO
                  title="Upgrade to Pro"
                  description="Unlock premium features."
                />
                <UpgradePage />
              </>
            }
          />
          <Route
            path="/dashboard"
            element={
              <>
                <SEO
                  title="My Dashboard"
                  description="Manage your saved projects."
                />
                <Dashboard />
              </>
            }
          />
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
