import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { HashRouter } from "react-router-dom"; 
import App from "./App";
import "./styles/global.css";

// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js") // Points to the new killer worker
      .then((registration) => {
        console.log("SW registered:", registration.scope);
      })
      .catch((err) => console.log("SW registration failed", err));
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      {/* HashRouter is used to prevent 404s on refresh with GitHub Pages */}
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}> 
        <App />
      </HashRouter>
    </HelmetProvider>
  </React.StrictMode>
);