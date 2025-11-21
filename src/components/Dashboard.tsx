// src/components/Dashboard.tsx

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  type: string;
  data: any;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { user, loading } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
    } else if (user) {
      fetchProjects();
    }
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
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      setProjects(projects.filter((p) => p.id !== id));
    }
  };

  const toggleDetails = (id: string) => {
    setExpandedProjectId(expandedProjectId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper to render saved data values nicely
  const renderDataValue = (key: string, value: any) => {
    if (typeof value === "object" && value !== null) return "Complex Data";
    if (
      key.toLowerCase().includes("cost") ||
      key.toLowerCase().includes("price")
    ) {
      return `₹${Number(value).toLocaleString("en-IN")}`;
    }
    return value.toString();
  };

  if (loading || isLoadingData)
    return <div className="loading-container">Loading Dashboard...</div>;

  return (
    <section className="container">
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h2
            className="section-title"
            style={{ marginBottom: 0, textAlign: "left" }}
          >
            My Saved Projects
          </h2>
          <Link to="/" className="btn">
            <i className="fas fa-plus"></i> New Calculation
          </Link>
        </div>

        {projects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
            <p>You haven't saved any projects yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {projects.map((project) => (
              <div
                key={project.id}
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "1.2rem",
                        color: "var(--secondary-color)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {project.name}
                    </h3>
                    <div style={{ fontSize: "0.9rem", color: "#666" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "4px",
                          background: "#eee",
                          marginRight: "1rem",
                          textTransform: "capitalize",
                          fontWeight: "bold",
                        }}
                      >
                        {project.type.replace("-", " ")}
                      </span>
                      <span>
                        <i className="far fa-calendar-alt"></i>{" "}
                        {formatDate(project.created_at)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => toggleDetails(project.id)}
                      className="btn"
                      style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                    >
                      {expandedProjectId === project.id
                        ? "Hide Details"
                        : "View Details"}
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="btn btn-secondary"
                      style={{
                        color: "var(--danger-color)",
                        background: "#fff",
                        border: "1px solid var(--danger-color)",
                        padding: "0.5rem",
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                {/* --- EXPANDED DETAILS VIEW --- */}
                {expandedProjectId === project.id && (
                  <div
                    style={{
                      marginTop: "1.5rem",
                      paddingTop: "1rem",
                      borderTop: "1px dashed #ddd",
                    }}
                  >
                    <h4 style={{ marginBottom: "0.5rem" }}>
                      Saved Estimate Details:
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {Object.entries(project.data).map(([key, value]) => {
                        if (
                          key === "breakdown" ||
                          key === "date" ||
                          typeof value === "object"
                        )
                          return null; // Skip complex objects for summary
                        return (
                          <div
                            key={key}
                            style={{
                              background: "#f9f9f9",
                              padding: "8px",
                              borderRadius: "4px",
                              fontSize: "0.9rem",
                            }}
                          >
                            <strong style={{ textTransform: "capitalize" }}>
                              {key.replace(/([A-Z])/g, " $1").trim()}:
                            </strong>{" "}
                            <br />
                            {renderDataValue(key, value)}
                          </div>
                        );
                      })}
                      {/* Show Total Cost prominently if available */}
                      {project.data.totalCost && (
                        <div
                          style={{
                            background: "var(--primary-color)",
                            color: "white",
                            padding: "8px",
                            borderRadius: "4px",
                            fontSize: "1rem",
                            fontWeight: "bold",
                          }}
                        >
                          Total Estimate: <br />₹
                          {Number(project.data.totalCost).toLocaleString(
                            "en-IN"
                          )}
                        </div>
                      )}
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
