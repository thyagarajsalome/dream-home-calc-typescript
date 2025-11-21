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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
            <i
              className="fas fa-folder-open"
              style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}
            ></i>
            <p>You haven't saved any projects yet.</p>
            <p>Go to a calculator and click "Save" to see it here.</p>
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
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fff",
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
                        display: "inline-block",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "4px",
                        background: "#eee",
                        marginRight: "10rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {project.type}
                    </span>
                    <span>
                      <i className="far fa-calendar-alt"></i>{" "}
                      {formatDate(project.created_at)}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  {/* Future: Add 'View/Edit' functionality */}
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="btn btn-secondary"
                    style={{
                      color: "var(--danger-color)",
                      background: "#fff",
                      border: "1px solid var(--danger-color)",
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
