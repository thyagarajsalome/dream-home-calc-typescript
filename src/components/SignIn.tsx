// src/components/SignIn.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { supabase } from "../supabaseClient";
import AuthLayout from "./AuthLayout";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate("/dashboard"); // Redirect after success
    } catch (err: any) {
      console.error("Sign In Error:", err);
      setError(err.message || "Failed to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google Sign In Error:", err);
      setError("Failed to sign in with Google.");
    }
  };

  return (
    <AuthLayout>
      <h2>Sign In</h2>
      {/* ... (Keep your existing UI/Buttons, just ensure onClick handlers match above) ... */}
      
      <button
        type="button"
        className="btn full-width"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
        style={{
          // ... keep your styles
          backgroundColor: "#fff",
          color: "#333",
          border: "1px solid #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "1.5rem"
        }}
      >
        <img 
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
          alt="Google logo" 
          style={{ width: "20px", height: "20px" }} 
        />
        {isSubmitting ? "Signing In..." : "Sign in with Google"}
      </button>

      {/* Divider and Form */}
      {/* ... Keep divider ... */}

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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>
        <button type="submit" className="btn full-width" disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Sign In with Email"}
        </button>
        {error && (
          <p style={{ color: "var(--danger-color)", marginTop: "1rem", textAlign: "center", fontWeight: "500" }}>
            {error}
          </p>
        )}
      </form>
      {/* ... Keep the rest of the UI ... */}
      <div className="signup-value-prop" style={{ marginTop: "2rem" }}>
        <h4>New Here? Create an Account!</h4>
         {/* ... bullets ... */}
        <p className="auth-switch-link" style={{ marginTop: "1rem" }}>
          <Link to="/signup">Sign Up Now</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignIn;