// src/components/SignUp.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AuthLayout from "./AuthLayout";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      setMessage("Account created! Please check your email to verify.");
    } catch (err: any) {
      console.error("Sign Up Error:", err);
      setError(err.message || "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    // Exact same as SignIn's google handler
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google Sign Up Error:", err);
      setError("Failed to sign up with Google.");
    }
  };

  return (
    <AuthLayout>
      <h2>Create an Account</h2>
      {/* ... Keep your existing UI, just ensure onClick/onSubmit handlers match ... */}
      
      <button
        type="button"
        className="btn full-width"
        onClick={handleGoogleSignUp}
        disabled={isSubmitting}
        style={{
             // ... styles
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
        {isSubmitting ? "Creating Account..." : "Sign up with Google"}
      </button>

      {/* ... Divider ... */}
      
      <form onSubmit={handleSignUp}>
        <div className="form-group">
            {/* ... Email input ... */}
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
            {/* ... Password input ... */}
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="At least 6 characters"
            disabled={isSubmitting}
          />
        </div>
        <button type="submit" className="btn full-width" disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Sign Up with Email"}
        </button>
        
        {error && (
          <p style={{ color: "var(--danger-color)", marginTop: "1rem", textAlign: "center", fontWeight: "500" }}>
            {error}
          </p>
        )}
        
        {message && (
          <div style={{ marginTop: "1rem", padding: "10px", backgroundColor: "#d4edda", color: "#155724", borderRadius: "8px", textAlign: "center" }}>
            {message}
          </div>
        )}
      </form>
      <p className="auth-switch-link" style={{ marginTop: "1rem" }}>
        Already have an account? <Link to="/signin">Sign In</Link>
      </p>
    </AuthLayout>
  );
};

export default SignUp;