// src/App.tsx
import React, { Suspense, lazy, startTransition, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { ToastProvider } from "./context/ToastContext";


// Lazy-loaded pages
const PlanGallery = lazy(() => import("./features/plans/PlanGallery"));
const DirectoryPage = lazy(() => import("./features/directory/DirectoryPage"));
const ProRegistration = lazy(() => import("./features/directory/ProRegistration"));

// Layout components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Hero from "./components/layout/Hero";
import FAQ from "./components/layout/FAQ";
import Testimonials from "./components/layout/Testimonials";

import CalculatorTabs from "./features/construction/CalculatorTabs";
import { useGSAPTabSwitch } from "./hooks/useGSAP";


// Lazy-loaded calculators
const ConstructionCalculator     = lazy(() => import("./features/construction/ConstructionCalculator"));
const FlooringCalculator         = lazy(() => import("./features/construction/FlooringCalculator"));
const PaintingCalculator         = lazy(() => import("./features/construction/PaintingCalculator"));
const PlumbingCalculator         = lazy(() => import("./features/construction/PlumbingCalculator"));
const ElectricalCalculator       = lazy(() => import("./features/construction/ElectricalCalculator"));
const InteriorCalculator         = lazy(() => import("./features/construction/InteriorCalculator"));
const DoorsWindowsCalculator     = lazy(() => import("./features/construction/DoorsWindowsCalculator"));
const MaterialQuantityCalculator = lazy(() => import("./features/construction/MaterialQuantityCalculator"));

const SignIn      = lazy(() => import("./features/auth/SignIn"));
const SignUp      = lazy(() => import("./features/auth/SignUp"));
const UpgradePage = lazy(() => import("./features/dashboard/UpgradePage"));
const Dashboard   = lazy(() => import("./features/dashboard/Dashboard"));
const PrivacyPolicy  = lazy(() => import("./legacy-pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./legacy-pages/TermsOfService"));
const Contact        = lazy(() => import("./legacy-pages/Contact"));
const Disclaimer     = lazy(() => import("./legacy-pages/Disclaimer"));

const Loading = () => (
  <div className="flex flex-col justify-center items-center min-h-[600px] bg-gray-50 rounded-2xl border border-gray-100 animate-pulse">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <p className="text-gray-400 font-medium text-sm">Loading HDE Tools...</p>
  </div>
);

type CalculatorType =
  | "construction"
  | "interior"
  | "doors-windows"
  | "flooring"
  | "painting"
  | "plumbing"
  | "electrical"
  | "materials";

const MainLayout = () => {
  const { hasPaid } = useUser();
  const location    = useLocation();

  const routeState = location.state as {
    openCalculator?: CalculatorType;
    projectData?: any;
    projectName?: string;
  } | null;

  const [activeCalculator, setActiveCalculator] = React.useState<CalculatorType>(
    routeState?.openCalculator ?? "construction"
  );

  const { panelRef } = useGSAPTabSwitch(activeCalculator);

  useEffect(() => {
    if (routeState?.openCalculator) {
      startTransition(() => setActiveCalculator(routeState.openCalculator!));
      setTimeout(() => {
        const el = document.getElementById("tools");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, [routeState?.openCalculator]);

  const handleTabChange = (tab: CalculatorType) => {
    startTransition(() => setActiveCalculator(tab));
  };

  const projectData = routeState?.projectData ?? null;

  const renderCalculator = () => {
    switch (activeCalculator) {
      case "construction":  return <ConstructionCalculator />;
      case "materials":     return <MaterialQuantityCalculator />;
      case "interior":      return <InteriorCalculator hasPaid={hasPaid} />;
      case "doors-windows": return <DoorsWindowsCalculator hasPaid={hasPaid} />;
      case "flooring":      return <FlooringCalculator />;
      case "painting":      return <PaintingCalculator />;
      case "plumbing":      return <PlumbingCalculator />;
      case "electrical":    return <ElectricalCalculator />;
      default:              return <ConstructionCalculator />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      <Header />

      <main className="flex-grow">
        <Hero />

        <div className="container mx-auto px-4 py-8 max-w-7xl" id="tools">
          {projectData && routeState?.projectName && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-xl text-sm">
              <i className="fas fa-folder-open text-primary"></i>
              <span className="text-gray-700">
                Editing saved project: <strong className="text-primary">{routeState.projectName}</strong>
              </span>
              <span className="text-gray-400 text-xs ml-1">— modify values and save again to update</span>
            </div>
          )}

<CalculatorTabs 
  activeCalculator={activeCalculator} 
  setActiveCalculator={setActiveCalculator} 
  hasPaid={hasPaid}
/>

          <div ref={panelRef} className="mt-8 min-h-[600px]">
            <Suspense fallback={<Loading />}>
              {renderCalculator()}
            </Suspense>
          </div>
        </div>

        <FAQ />
        <Testimonials />
      </main>

      <Footer />
    </div>
  );
};

const ProtectedRoute = () => {
  const { user, loading } = useUser();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/signin" />;
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <Suspense fallback={<Loading />}><Outlet /></Suspense>
      </main>
      <Footer />
    </div>
  );
};

const InfoLayout = () => (
  <div className="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main className="flex-grow container mx-auto px-4 py-8 pt-24">
      <Suspense fallback={<Loading />}><Outlet /></Suspense>
    </main>
    <Footer />
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useUser();
  if (loading) return <Loading />;
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/signin" element={user ? <Navigate to="/" /> : <SignIn />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />

        <Route element={<InfoLayout />}>
          <Route path="/privacy"    element={<PrivacyPolicy />} />
          <Route path="/terms"      element={<TermsOfService />} />
          <Route path="/contact"    element={<Contact />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/plans"      element={<PlanGallery />} />
          <Route path="/directory"  element={<DirectoryPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/upgrade"   element={<UpgradePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register-pro" element={<ProRegistration />} /> {/* Moved inside ProtectedRoute */}
        </Route>

        <Route path="/"  element={<MainLayout />} />
        <Route path="*"  element={<Navigate to="/" />} />

      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ToastProvider>
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  </ToastProvider>
);

export default App;
