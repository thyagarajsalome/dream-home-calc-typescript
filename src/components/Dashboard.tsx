// src/components/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, hasPaid, loading } = useUser();
  // If you were fetching extra data from Firestore here, 
  // you likely don't need it as UserContext handles the profile now.

  if (loading) return <div className="container">Loading...</div>;

  if (!user) {
    return (
      <div className="container" style={{ textAlign: "center", marginTop: "3rem" }}>
        <h2>Please Sign In</h2>
        <p>You need to be logged in to view your dashboard.</p>
        <Link to="/signin" className="btn">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: "2rem" }}>
      <h2>Welcome, {user.email}</h2>
      
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h3>Account Status</h3>
        <p>
          <strong>Plan:</strong> {hasPaid ? "Premium (Lifetime)" : "Free"}
        </p>
        <p>
          <strong>User ID:</strong> {user.id}
        </p>
        
        {!hasPaid && (
          <div style={{ marginTop: "1rem" }}>
            <p>Upgrade to Premium to save reports and access all tools.</p>
            <Link to="/upgrade" className="btn">Upgrade Now</Link>
          </div>
        )}
      </div>

      {hasPaid && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <h3>Saved Reports</h3>
          <p>You can view your saved calculations here.</p>
          {/* Add Supabase fetching logic here if you have a 'reports' table */}
          <p><em>No reports saved yet.</em></p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;