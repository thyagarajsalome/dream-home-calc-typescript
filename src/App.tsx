// src/App.tsx
import React, { Suspense, lazy, startTransition, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { ToastProvider } from "./context/ToastContext";


// Helper to handle ChunkLoadError on deployment changes
const lazyWithRetry = (componentImport: () => Promise<any>) => 
  lazy(() => componentImport().catch((error) => {
    console.error("Chunk load failed, reloading page...", error);
    window.location.reload();
    return { default: () => null };
  }));

// Lazy-loaded pages
const PlanGallery = lazyWithRetry(() => import("./features/plans/PlanGallery"));
const DirectoryPage = lazyWithRetry(() => import("./features/directory/DirectoryPage"));
const ProRegistration = lazyWithRetry(() => import("./features/directory/ProRegistration"));

// Layout components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Hero from "./components/layout/Hero";
import FAQ from "./components/layout/FAQ";
import Testimonials from "./components/layout/Testimonials";

import CalculatorTabs from "./features/construction/CalculatorTabs";
import { useGSAPTabSwitch } from "./hooks/useGSAP";


// Lazy-loaded calculators
const ConstructionCalculator     = lazyWithRetry(() => import("./features/construction/ConstructionCalculator"));
const FlooringCalculator         = lazyWithRetry(() => import("./features/construction/FlooringCalculator"));
const PaintingCalculator         = lazyWithRetry(() => import("./features/construction/PaintingCalculator"));
const PlumbingCalculator         = lazyWithRetry(() => import("./features/construction/PlumbingCalculator"));
const ElectricalCalculator       = lazyWithRetry(() => import("./features/construction/ElectricalCalculator"));
const InteriorCalculator         = lazyWithRetry(() => import("./features/construction/InteriorCalculator"));
const DoorsWindowsCalculator     = lazyWithRetry(() => import("./features/construction/DoorsWindowsCalculator"));
const MaterialQuantityCalculator = lazyWithRetry(() => import("./features/construction/MaterialQuantityCalculator"));

const SignIn      = lazyWithRetry(() => import("./features/auth/SignIn"));
const SignUp      = lazyWithRetry(() => import("./features/auth/SignUp"));
const UpgradePage = lazyWithRetry(() => import("./features/dashboard/UpgradePage"));
const Dashboard   = lazyWithRetry(() => import("./features/dashboard/Dashboard"));
const PrivacyPolicy  = lazyWithRetry(() => import("./legacy-pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./legacy-pages/TermsOfService"));
const Contact        = lazyWithRetry(() => import("./legacy-pages/Contact"));
const Disclaimer     = lazyWithRetry(() => import("./legacy-pages/Disclaimer"));

const Loading = () => (
  <div className="flex flex-col justify-center items-center min-h-[600px] bg-gray-50 rounded-2xl border border-gray-100 animate-pulse">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <p className="text-gray-400 font-medium text-sm">Loading HDE Tools...</p>
  </div>
);

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.name === 'ChunkLoadError' || String(this.state.error).includes('fetch');
      return (
        <div className="flex flex-col justify-center items-center min-h-[600px] bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops, something went wrong</h2>
          <p className="text-gray-500 mb-6 max-w-md">
            {isChunkError 
              ? "We just released a new update and your browser is trying to load old files. Please click below to refresh."
              : this.state.error?.message || "An unexpected error occurred while loading this page."}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md"
          >
            <i className="fas fa-sync-alt mr-2"></i> Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
            <Route path="/upgrade"    element={<UpgradePage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register-pro" element={<ProRegistration />} /> {/* Moved inside ProtectedRoute */}
          </Route>

          <Route path="/"  element={<MainLayout />} />
          <Route path="*"  element={<Navigate to="/" />} />

        </Routes>
      </Suspense>
    </ErrorBoundary>
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
