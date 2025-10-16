import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
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
import UpgradePage from "./components/UpgradePage";

type CalculatorType =
  | "construction"
  | "flooring"
  | "painting"
  | "plumbing"
  | "electrical";

// This layout component wraps the main application view
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
    // This logic is now protected by the hasPaid prop in CalculatorTabs, which navigates away if needed
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

// This component protects routes that require a user to be logged in
const ProtectedRoute = ({ user }: { user: User | null }) => {
  if (!user) {
    return <Navigate to="/signin" />;
  }
  return <Outlet />; // Renders the child routes (like Home or Upgrade)
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  // Effect for handling authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Effect for listening to real-time payment status changes from Firestore
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
        setHasPaid(doc.exists() && doc.data().hasPaid === true);
      });
      return () => unsubscribeSnapshot();
    } else {
      setHasPaid(false); // Reset payment status on logout
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>Loading...</div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes for sign-in and sign-up */}
        <Route
          path="/signin"
          element={user ? <Navigate to="/" /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <SignUp />}
        />

        {/* Protected routes that require a logged-in user */}
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
