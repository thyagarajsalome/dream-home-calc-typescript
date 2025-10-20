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
import LoanCalculator from "./components/LoanCalculator"; // Import the new component
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

type CalculatorType =
  | "construction"
  | "flooring"
  | "painting"
  | "plumbing"
  | "electrical"
  | "loan"; // Add the new type

// Layout for the main calculator pages
const MainLayout = ({
  user,
  hasPaid,
}: {
  user: User | null;
  hasPaid: boolean;
}) => {
  const [activeCalculator, setActiveCalculator] =
    useState<CalculatorType>("construction");

  const renderCalculator = () => {
    switch (activeCalculator) {
      case "construction":
        return <Calculator hasPaid={hasPaid} />;
      case "flooring":
        return <FlooringCalculator />;
      case "painting":
        return <PaintingCalculator />;
      case "plumbing":
        return <PlumbingCalculator />;
      case "electrical":
        return <ElectricalCalculator />;
      case "loan": // Add the case for the new calculator
        return <LoanCalculator />;
      default:
        return <Calculator hasPaid={hasPaid} />;
    }
  };

  return (
    <>
      <Header user={user} />
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

// ... (rest of the file is unchanged)

// Layout for the static info pages
const InfoLayout = ({ user }: { user: User | null }) => (
  <>
    <Header user={user} />
    <main>
      <Outlet />
    </main>
    <Footer />
  </>
);

const ProtectedRoute = ({ user }: { user: User | null }) => {
  if (!user) {
    return <Navigate to="/signin" />;
  }
  return <Outlet />;
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);

  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // for developer test (unlocking section)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("has_paid")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          setHasPaid(false);
        } else if (data) {
          setHasPaid(data.has_paid);
        }
        setLoading(false);
      } else {
        setHasPaid(false);
      }
    };
    fetchUserProfile();
  }, [user]);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/signin"
          element={user ? <Navigate to="/" /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <SignUp />}
        />

        {/* Routes for static pages */}
        <Route element={<InfoLayout user={user} />}>
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
        </Route>

        {/* Protected routes for the main app */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route
            path="/"
            element={<MainLayout user={user} hasPaid={hasPaid} />}
          />
          <Route
            path="/upgrade"
            element={<UpgradePage user={user} setHasPaid={setHasPaid} />}
          />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
