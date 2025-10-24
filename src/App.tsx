// src/App.tsx

import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import { User } from "@supabase/supabase-js";

// Components
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

// Auth & Upgrade Pages
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import UpgradePage from "./components/UpgradePage";

// New Info Pages
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import Disclaimer from "./pages/Disclaimer";

// --- IMPORT THE NEW GUEST CALCULATOR ---
import GuestCalculator from "./components/GuestCalculator"; // Make sure GuestCalculator.tsx exists in the components folder

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

// Layout for the main calculator pages (protected)
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
    switch (activeCalculator) {
      case "construction":
        return <Calculator hasPaid={hasPaid} />; //
      case "eligibility":
        return <LoanEligibilityCalculator />; //
      case "loan":
        return <LoanCalculator />; //
      case "interior":
        return <InteriorCalculator />; //
      case "doors-windows":
        return <DoorsWindowsCalculator />; //
      case "flooring":
        return <FlooringCalculator />; //
      case "painting":
        return <PaintingCalculator />; //
      case "plumbing":
        return <PlumbingCalculator />; //
      case "electrical":
        return <ElectricalCalculator />; //
      default:
        return <Calculator hasPaid={hasPaid} />; //
    }
  };

  return (
    <>
      <Header user={user} installPrompt={installPrompt} /> {/* */}
      <main>
        <Hero /> {/* */}
        <CalculatorTabs //
          activeCalculator={activeCalculator}
          setActiveCalculator={setActiveCalculator}
          hasPaid={hasPaid}
        />
        {renderCalculator()}
        <FAQ /> {/* */}
      </main>
      <Footer /> {/* */}
    </>
  );
};

// Layout for the static info pages and public guest calculator
const InfoLayout = ({
  user,
  installPrompt,
}: {
  user: User | null;
  installPrompt: any;
}) => (
  <>
    <Header user={user} installPrompt={installPrompt} /> {/* */}
    <main>
      <Outlet />{" "}
      {/* Renders child routes like PrivacyPolicy, GuestCalculator */}
    </main>
    <Footer /> {/* */}
  </>
);

// Protects routes that require a logged-in user
const ProtectedRoute = ({ user }: { user: User | null }) => {
  if (!user) {
    // If no user, redirect to signin page
    return <Navigate to="/signin" />;
  }
  // If user exists, render the child routes (Outlet)
  return <Outlet />;
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Effect to listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent the default browser install prompt
      setInstallPrompt(e); // Store the event to trigger it later
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // Effect to check auth state on initial load and subscribe to changes
  useEffect(() => {
    const getSession = async () => {
      // Check if there's an active session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null); // Set user state
      setLoading(false); // Mark loading as complete
    };
    getSession();

    // Listen for changes in authentication state (signin/signout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null); // Update user state on change
      }
    );

    // Cleanup subscription on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Effect to fetch user profile (specifically payment status) when user state changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setLoading(true); // Start loading while fetching profile
        // Fetch 'has_paid' field from 'profiles' table for the current user
        const { data, error } = await supabase
          .from("profiles")
          .select("has_paid")
          .eq("id", user.id)
          .single(); // Expecting only one row

        if (error) {
          console.error("Error fetching user profile:", error);
          setHasPaid(false); // Assume not paid if there's an error
        } else if (data) {
          setHasPaid(data.has_paid); // Set payment status from fetched data
        }
        setLoading(false); // Mark loading as complete
      } else {
        // If there's no user, they haven't paid
        setHasPaid(false);
      }
    };
    fetchUserProfile();
  }, [user]); // Re-run this effect whenever the 'user' object changes

  // Show loading indicator while checking auth state or fetching profile
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/signin"
          // If user is already logged in, redirect to home, otherwise show SignIn component
          element={user ? <Navigate to="/" /> : <SignIn />} //
        />
        <Route
          path="/signup"
          // If user is already logged in, redirect to home, otherwise show SignUp component
          element={user ? <Navigate to="/" /> : <SignUp />} //
        />

        {/* Public Routes using InfoLayout (Header + Footer) */}
        <Route
          element={<InfoLayout user={user} installPrompt={installPrompt} />}
        >
          <Route path="/privacy" element={<PrivacyPolicy />} /> {/* */}
          <Route path="/terms" element={<TermsOfService />} /> {/* */}
          <Route path="/contact" element={<Contact />} /> {/* */}
          <Route path="/disclaimer" element={<Disclaimer />} /> {/* */}
          {/* --- ROUTE FOR THE NEW GUEST CALCULATOR --- */}
          {/* This route is accessible without login */}
          <Route path="/guest-calculator" element={<GuestCalculator />} />
        </Route>

        {/* Protected Routes (Require Login) */}
        {/* Uses ProtectedRoute component to check for user */}
        <Route element={<ProtectedRoute user={user} />}>
          {/* Main application home route */}
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
          {/* Upgrade page route */}
          <Route
            path="/upgrade"
            element={<UpgradePage user={user} setHasPaid={setHasPaid} />} //
          />
          {/* Add other protected routes inside this Route element if needed */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
