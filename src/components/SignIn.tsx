// src/components/SignIn.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AuthLayout from "./AuthLayout";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err: any) {
      setError("Failed to sign in. Please check your email and password.");
    }
  };

  return (
    <AuthLayout>
      <h2>Sign In</h2>
      <form onSubmit={handleSignIn}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="btn full-width">
          Sign In
        </button>
        {error && (
          <p style={{ color: "red", marginTop: "1rem", textAlign: "center" }}>
            {error}
          </p>
        )}
      </form>
      <div className="signup-value-prop">
        <h4>New Here? Create an Account!</h4>
        <ul>
          <li>
            <i className="fas fa-star"></i> Access Premium Calculators
          </li>
          <li>
            <i className="fas fa-save"></i> Save & Download Reports
          </li>
          <li>
            <i className="fas fa-chart-line"></i> Detailed Breakdowns
          </li>
        </ul>
        <p className="auth-switch-link" style={{ marginTop: "1rem" }}>
          <Link to="/signup">Sign Up Now</Link>
        </p>
      </div>
      {/* REMOVED: Guest Link Box */}
    </AuthLayout>
  );
};

export default SignIn;
