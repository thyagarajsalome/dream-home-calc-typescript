// src/components/SignUp.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient"; //
import AuthLayout from "./AuthLayout"; //

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        //
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        setMessage("Success! Please check your email to confirm your account.");
      }
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to create an account. The email may already be in use."
      );
    }
  };

  return (
    <AuthLayout>
      {" "}
      {/* */}
      <h2>Create an Account</h2>
      <p
        style={{
          textAlign: "center",
          marginBottom: "1.5rem",
          color: "var(--text-color)",
        }}
      >
        Unlock all features by creating a free account.
      </p>
      <form onSubmit={handleSignUp}>
        {/* ... email and password inputs ... */}
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
            placeholder="At least 6 characters"
          />
        </div>
        <button type="submit" className="btn full-width">
          Sign Up
        </button>
        {error && (
          <p style={{ color: "red", marginTop: "1rem", textAlign: "center" }}>
            {error}
          </p>
        )}
        {message && (
          <p style={{ color: "green", marginTop: "1rem", textAlign: "center" }}>
            {message}
          </p>
        )}
      </form>
      <p className="auth-switch-link">
        Already have an account? <Link to="/signin">Sign In</Link> {/* */}
      </p>
      {/* --- Updated Guest Link Section --- */}
      <div className="highlighted-link-box">
        <p>Just want a quick estimate?</p>
        <Link to="/guest-calculator">Try Guest Calculator</Link> {/* */}
      </div>
    </AuthLayout>
  );
};

export default SignUp;
