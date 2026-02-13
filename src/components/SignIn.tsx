// src/components/SignIn.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
import AuthLayout from "./AuthLayout";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Firebase Sign In Error:", err);
      
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Failed to sign in. Please check your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Sign In Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h2>Sign In</h2>

      {/* Google Sign-In Button */}
      <button
        type="button"
        className="btn full-width"
        onClick={handleGoogleSignIn}
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
        {isSubmitting ? "Signing In..." : "Sign in with Google"}
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }}></div>
        <span style={{ padding: "0 10px", color: "#666", fontSize: "0.9rem" }}>OR</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }}></div>
      </div>

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
      <div className="signup-value-prop" style={{ marginTop: "2rem" }}>
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
    </AuthLayout>
  );
};

export default SignIn;