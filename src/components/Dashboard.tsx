// src/components/Dashboard.tsx

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

// ... (Keep your existing interfaces and logic) ...
interface Project {
  id: string;
  name: string;
  type: string;
  data: any;
  created_at: string;
}

const Dashboard: React.FC = () => {
  // ... (Keep your existing state and fetch logic) ...
  const { user, loading } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/signin");
    else if (user) fetchProjects();
  }, [user, loading, navigate]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  const toggleDetails = (id: string) =>
    setExpandedProjectId(expandedProjectId === id ? null : id);
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  const renderDataValue = (k: string, v: any) =>
    typeof v === "object"
      ? ""
      : k.toLowerCase().includes("cost")
      ? `₹${Number(v).toLocaleString("en-IN")}`
      : v;

  if (loading || isLoadingData)
    return <div className="loading-container">Loading Dashboard...</div>;

  return (
    <section className="container">
      {/* --- NEW: Navigation Bar inside Dashboard --- */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          to="/"
          className="btn"
          style={{
            backgroundColor: "var(--secondary-color)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <i className="fas fa-arrow-left"></i> Back to Calculators
        </Link>
      </div>
      {/* ------------------------------------------- */}

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            borderBottom: "1px solid #eee",
            paddingBottom: "1rem",
          }}
        >
          <h2
            className="section-title"
            style={{ marginBottom: 0, textAlign: "left" }}
          >
            My Saved Projects
          </h2>
          <Link
            to="/"
            className="btn btn-primary"
            style={{ backgroundColor: "var(--accent-color)" }}
          >
            <i className="fas fa-plus"></i> New Project
          </Link>
        </div>

        {/* ... (Keep existing project listing logic) ... */}
        {projects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>No saved projects yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {projects.map((project) => (
              <div
                key={project.id}
                style={{
                  border: "1px solid var(--border-color)",
                  padding: "1.5rem",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <h3>{project.name}</h3>
                    <span style={{ color: "#666" }}>
                      {formatDate(project.created_at)} • {project.type}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={() => toggleDetails(project.id)}
                      className="btn"
                      style={{ marginRight: "10px" }}
                    >
                      {expandedProjectId === project.id ? "Hide" : "View"}
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="btn"
                      style={{ background: "var(--danger-color)" }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                {/* Expanded view logic... */}
                {expandedProjectId === project.id && (
                  <div
                    style={{
                      marginTop: "1rem",
                      paddingTop: "1rem",
                      borderTop: "1px dashed #ccc",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {Object.entries(project.data).map(([k, v]) => {
                        if (typeof v === "object" || k === "date") return null;
                        return (
                          <div
                            key={k}
                            style={{
                              background: "#f8f9fa",
                              padding: "5px 10px",
                              borderRadius: "4px",
                            }}
                          >
                            <strong>{k}:</strong> {renderDataValue(k, v)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
