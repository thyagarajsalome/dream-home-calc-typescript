import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

export default function AstroApp() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </Router>
  );
}
