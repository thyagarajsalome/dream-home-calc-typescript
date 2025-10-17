import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { supabase } from "./supabaseClient"; // Correct import
import { User } from "@supabase/supabase-js"; // Supabase user type
import Header from "./components/Header";
import Hero from "./components/Hero";
import Calculator from "./components/Calculator";
import FlooringCalculator from "./components/FlooringCalculator";
import PaintingCalculator from "./components/PaintingCalculator";
import PlumbingCalculator from "./components/PlumbingCalculator";
import ElectricalCalculator from "./components/ElectricalCalculator";
import CalculatorTabs from "./components/CalculatorTabs";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import UpgradePage from "./components/UpgradePage";

type CalculatorType =
  | "construction"
  | "flooring"
  | "painting"
  | "plumbing"
  | "electrical";

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
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>Loading...</div>
    );
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
