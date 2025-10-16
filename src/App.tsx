import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

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
import Payment from "./components/Payment";

type CalculatorType =
  | "construction"
  | "flooring"
  | "painting"
  | "plumbing"
  | "electrical";

const App = () => {
  const [activeCalculator, setActiveCalculator] =
    useState<CalculatorType>("construction");
  const [user, setUser] = useState<User | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().hasPaid) {
          setHasPaid(true);
        } else {
          setHasPaid(false);
        }
      } else {
        setHasPaid(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderCalculator = () => {
    // Basic calculator is free
    if (activeCalculator === "construction") {
      return <Calculator hasPaid={hasPaid} />;
    }
    // Other calculators require payment
    if (!hasPaid) {
      return <Payment user={user} />;
    }

    switch (activeCalculator) {
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

  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner component
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
        <Route
          path="/"
          element={
            user ? (
              <>
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
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
