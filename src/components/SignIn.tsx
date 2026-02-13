// src/components/SignIn.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
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
      // Firebase Sign In logic
      await signInWithEmailAndPassword(auth, email, password);
      // The UserContext listener (onAuthStateChanged) will automatically 
      // handle the redirection to the home page or dashboard.
    } catch (err: any) {
      console.error("Firebase Sign In Error:", err.code, err.message);
      
      // Scalable error handling based on Firebase error codes
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
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
        {error && (
          <p style={{ color: "var(--danger-color)", marginTop: "1rem", textAlign: "center", fontWeight: "500" }}>
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
    </AuthLayout>
  );
};

export default SignIn;