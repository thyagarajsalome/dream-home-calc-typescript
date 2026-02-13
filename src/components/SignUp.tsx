// src/components/SignUp.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
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
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Account created successfully! Redirecting...");
    } catch (err: any) {
      console.error("Firebase Sign Up Error:", err);

      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use. Please sign in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (err.code === "auth/weak-password") {
        setError("The password is too weak.");
      } else {
        setError("Failed to create an account. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setMessage("Account linked successfully! Redirecting...");
    } catch (err: any) {
      console.error("Google Sign Up Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-up popup was closed. Please try again.");
      } else {
        setError("Failed to sign up with Google. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
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

      {/* Google Sign-Up Button */}
      <button
        type="button"
        className="btn full-width"
        onClick={handleGoogleSignUp}
        disabled={isSubmitting}
        style={{
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

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }}></div>
        <span style={{ padding: "0 10px", color: "#666", fontSize: "0.9rem" }}>OR</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }}></div>
      </div>

      <form onSubmit={handleSignUp}>
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
          <div
            style={{
              marginTop: "1rem",
              padding: "10px",
              backgroundColor: "#d4edda",
              color: "#155724",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "500"
            }}
          >
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