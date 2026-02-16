// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { HashRouter } from "react-router-dom"; // Import HashRouter
import App from "./App";
import "./styles/global.css";

// Basic Service Worker registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((err) => console.log("SW registration failed", err));
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <HashRouter> 
        <App />
      </HashRouter>
    </HelmetProvider>
  </React.StrictMode>
);