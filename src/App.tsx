// src/App.tsx

import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate, // Import useNavigate
  useLocation, // Import useLocation
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
import GuestCalculator from "./components/GuestCalculator"; // Make sure this exists

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
  | "electrical";

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
    switch (activeCalculator) {
      case "construction":
        return <Calculator hasPaid={hasPaid} />;
      case "eligibility":
        return <LoanEligibilityCalculator />;
      case "loan":
        return <LoanCalculator />;
      case "interior":
        return <InteriorCalculator />;
      case "doors-windows":
        return <DoorsWindowsCalculator />;
      case "flooring":
        return <FlooringCalculator />;
      case "painting":
        return <PaintingCalculator />;
      case "plumbing":
        return <PlumbingCalculator />;
      case "electrical":
        return <ElectricalCalculator />;
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
      // Redirect back to the signup page after showing the message
      // 'replace: true' avoids adding the error URL to browser history
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
    // You could replace this with a more styled notification component
    return (
      <div className="auth-container">
        <div className="card auth-card" style={{ textAlign: "center" }}>
          <h3 style={{ color: "var(--danger-color)", marginBottom: "1rem" }}>
            Verification Error
          </h3>
          <p>{message}</p>
          <Link to="/signup" className="btn" style={{ marginTop: "1.5rem" }}>
            Go to Sign Up
          </Link>{" "}
          {/* */}
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
  const [user, setUser] = useState<User | null>(null); // Stores the logged-in user object or null
  const [hasPaid, setHasPaid] = useState(false); // Tracks if the user has Pro access
  const [loading, setLoading] = useState(true); // Tracks initial authentication check state
  const [installPrompt, setInstallPrompt] = useState<any>(null); // Stores the PWA install prompt event

  // --- Effects ---

  // Effect to capture the PWA installation prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent the browser's default install banner
      setInstallPrompt(e); // Save the event so it can be triggered manually
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    // Cleanup: remove the event listener when the component unmounts
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
      setUser(session?.user ?? null); // Update user state based on session
      setLoading(false); // Initial auth check is complete
    };
    getSession();

    // Set up a listener for real-time authentication state changes (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null); // Update user state whenever auth changes
      }
    );

    // Cleanup: unsubscribe from the auth listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Effect to fetch the user's profile (payment status) whenever the user state changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        // Only fetch if a user is logged in
        setLoading(true); // Indicate loading while fetching profile data
        const { data, error } = await supabase
          .from("profiles") // Target the 'profiles' table
          .select("has_paid") // Select only the 'has_paid' column
          .eq("id", user.id) // Filter for the current user's ID
          .single(); // Expect only one result

        if (error) {
          console.error("Error fetching user profile:", error);
          setHasPaid(false); // Assume not paid if there's an error
        } else if (data) {
          setHasPaid(data.has_paid); // Update payment status from the database
        }
        setLoading(false); // Profile fetching complete
      } else {
        // If there's no user, reset payment status
        setHasPaid(false);
        if (!loading) setLoading(false); // Ensure loading is false if already checked session
      }
    };
    fetchUserProfile();
  }, [user, loading]); // Rerun this effect if the user object changes

  // --- Conditional Rendering ---

  // Display a loading indicator during the initial auth check
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  // --- Router Setup ---
  return (
    <Router>
      {/* AuthHandler runs on all routes to check for auth-related URL fragments */}
      <AuthHandler />
      <Routes>
        {/* Authentication Routes (Sign In / Sign Up) */}
        <Route
          path="/signin"
          element={user ? <Navigate to="/" /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <SignUp />}
        />

        {/* Public Routes (using InfoLayout with Header/Footer) */}
        <Route
          element={<InfoLayout user={user} installPrompt={installPrompt} />}
        >
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/guest-calculator" element={<GuestCalculator />} />
        </Route>

        {/* Protected Routes (require login, using ProtectedRoute wrapper) */}
        <Route element={<ProtectedRoute user={user} />}>
          {/* Main App Route */}
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
          {/* Upgrade Page Route */}
          <Route
            path="/upgrade"
            element={<UpgradePage user={user} setHasPaid={setHasPaid} />}
          />
          {/* Add any other authenticated routes here */}
        </Route>

        {/* Fallback for unmatched routes - redirect home or to signin based on auth state */}
        <Route path="*" element={<Navigate to={user ? "/" : "/signin"} />} />
      </Routes>
    </Router>
  );
};

export default App;
