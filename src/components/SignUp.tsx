// src/components/SignUp.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
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
      // Firebase Sign Up logic
      await createUserWithEmailAndPassword(auth, email, password);
      
      // Success message
      setMessage("Account created successfully! Redirecting...");
      
      // Note: The UserContext listener (onAuthStateChanged) will 
      // detect the new user and handle the dashboard redirection.
    } catch (err: any) {
      console.error("Firebase Sign Up Error:", err.code, err.message);

      // Scalable error handling based on Firebase error codes
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
          {isSubmitting ? "Creating Account..." : "Sign Up"}
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
      <p className="auth-switch-link">
        Already have an account? <Link to="/signin">Sign In</Link>
      </p>
    </AuthLayout>
  );
};

export default SignUp;