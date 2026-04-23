import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
// Updated: Import BrowserRouter instead of HashRouter for Firebase Hosting
import { BrowserRouter } from "react-router-dom"; 
import App from "./App";
import "./styles/global.css";

// Force unregister any stuck service workers
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log("Service Worker forcefully unregistered.");
    }
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      {/* BrowserRouter is now used since Firebase Hosting supports clean URLs via rewrites */}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}> 
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);