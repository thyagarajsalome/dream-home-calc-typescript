import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
// FIX: Imported BrowserRouter instead of HashRouter
import { BrowserRouter } from "react-router-dom"; 
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
      {/* FIX: Replaced HashRouter with BrowserRouter */}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}> 
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);