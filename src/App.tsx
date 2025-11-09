// src/App.tsx

import React, { useState, useEffect } from "react";
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
import { supabase } from "./supabaseClient"; // Ensure this path is correct
import { User } from "@supabase/supabase-js";

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
import GuestCalculator from "./components/GuestCalculator";
// --- NEW IMPORT ---
import MaterialQuantityCalculator from "./components/MaterialQuantityCalculator";

// --- Import Page Components ---
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import Disclaimer from "./pages/Disclaimer";

// --- Type Definition ---
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
  | "materials"; // <-- ADDED

// --- Layout Components ---

// Layout for the main authenticated calculator pages
const MainLayout = ({
  user,
  hasPaid,
  installPrompt,
}: {
  user: User | null;
  hasPaid: boolean;
  installPrompt: any;
}) => {
  const [activeCalculator, setActiveCalculator] =
    useState<CalculatorType>("construction");

  const renderCalculator = () => {
    // Dynamically render the selected calculator component
    // --- ALL CALCULATORS NOW RECEIVE 'hasPaid' PROP ---
    switch (activeCalculator) {
      case "construction":
        return <Calculator hasPaid={hasPaid} />;
      case "eligibility":
        return <LoanEligibilityCalculator hasPaid={hasPaid} />;
      case "loan":
        return <LoanCalculator hasPaid={hasPaid} />;
      // --- NEW CASE ---
      case "materials":
        return <MaterialQuantityCalculator hasPaid={hasPaid} />;
      // -----------------
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
        return <Calculator hasPaid={hasPaid} />;
    }
  };

  return (
    <>
      <Header user={user} installPrompt={installPrompt} />
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

// Layout for public static info pages and the Guest Calculator
const InfoLayout = ({
  user,
  installPrompt,
}: {
  user: User | null;
  installPrompt: any;
}) => (
  <>
    <Header user={user} installPrompt={installPrompt} />
    <main>
      {/* Outlet renders the matched child route component (e.g., PrivacyPolicy, GuestCalculator) */}
      <Outlet />
    </main>
    <Footer />
  </>
);

// --- Route Protection ---

// Component to protect routes that require authentication
const ProtectedRoute = ({ user }: { user: User | null }) => {
  if (!user) {
    // If no user is logged in, redirect them to the sign-in page
    return <Navigate to="/signin" />;
  }
  // If a user is logged in, render the nested routes (children) defined within this route
  return <Outlet />;
};

// --- Auth Redirect/Error Handler ---

// Component to handle redirects and errors from Supabase auth (like expired links)
const AuthHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const hash = location.hash; // Get the fragment identifier part of the URL (e.g., #error=...)

    // Check if the hash contains Supabase error parameters
    if (hash.includes("error=access_denied")) {
      let userMessage = "Access denied. Could not verify email."; // Default error
      // Provide more specific feedback based on the error description
      if (
        hash.includes("Email+link+is+invalid+or+has+expired") ||
        hash.includes("otp_expired")
      ) {
        userMessage =
          "Verification link is invalid or has expired. Please try signing up again or request a new verification email.";
      }
      setMessage(userMessage); // Set the error message state
      // Redirect back to the signup page using replace to avoid adding the error URL to history
      navigate("/signup", { replace: true });
    } else if (
      hash.includes("access_token") &&
      hash.includes("refresh_token")
    ) {
      // Handle successful verification/login from email link
      // The onAuthStateChange listener below will handle the session update.
      // We just need to clean the URL by redirecting to the home page.
      navigate("/", { replace: true });
    }

    // Only run this effect when the location (URL) changes
  }, [location, navigate]);

  // If there's an error message, display it temporarily
  if (message) {
    // Display the error within the standard auth layout
    return (
      <div className="auth-container">
        <div className="card auth-card" style={{ textAlign: "center" }}>
          <h3 style={{ color: "var(--danger-color)", marginBottom: "1rem" }}>
            Verification Error
          </h3>
          <p>{message}</p>
          <Link to="/signup" className="btn" style={{ marginTop: "1.5rem" }}>
            Go to Sign Up
          </Link>
        </div>
      </div>
    );
  }

  // Otherwise, render nothing - this component primarily handles redirection
  return null;
};

// --- Main App Component ---

const App = () => {
  // --- State Variables ---
  const [user, setUser] = useState<User | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true); // START in loading state
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // --- Effects ---

  // Effect to capture the PWA installation prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // Effect to check the initial session state and listen for auth changes
  useEffect(() => {
    // Check for an existing session when the app loads
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false); // *** Initial auth check is complete HERE ***
    };
    getSession();

    // Set up a listener for real-time authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        // If user logs out, ensure loading is false
        if (!session?.user) {
          setLoading(false);
          setHasPaid(false); // Reset paid status on logout
        }
      }
    );

    // Cleanup: unsubscribe from the auth listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Run only once on mount

  // *** CORRECTED Effect to fetch the user's profile ***
  useEffect(() => {
    const fetchUserProfile = async () => {
      // No setLoading(true) here - initial load is handled above
      const { data, error } = await supabase
        .from("profiles")
        .select("has_paid")
        .eq("id", user!.id) // Use non-null assertion as we check user above
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setHasPaid(false);
      } else if (data) {
        setHasPaid(data.has_paid);
      }
      // No setLoading(false) here
    };

    // Only fetch profile *after* initial loading is done AND a user exists
    if (!loading && user) {
      fetchUserProfile();
    } else if (!user) {
      // If there is no user (e.g., after logout), ensure paid status is false
      setHasPaid(false);
    }
  }, [user, loading]); // Depend on user and the initial loading state

  // --- Conditional Rendering ---

  // Display a loading indicator ONLY during the initial auth check
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  // --- Router Setup ---
  return (
    <Router>
      {/* AuthHandler runs on all routes */}
      <AuthHandler />
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/signin"
          element={user ? <Navigate to="/" /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <SignUp />}
        />

        {/* Public Routes */}
        <Route
          element={<InfoLayout user={user} installPrompt={installPrompt} />}
        >
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/guest-calculator" element={<GuestCalculator />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route
            path="/"
            element={
              <MainLayout
                user={user}
                hasPaid={hasPaid}
                installPrompt={installPrompt}
              />
            }
          />
          <Route
            path="/upgrade"
            element={<UpgradePage user={user} setHasPaid={setHasPaid} />}
          />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to={user ? "/" : "/signin"} />} />
      </Routes>
    </Router>
  );
};

export default App;
