// src/features/dashboard/Dashboard.tsx
import { HeroManager } from "./HeroManager";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { ProjectService } from "../../services/projectService";
import { useToast } from "../../context/ToastContext";

const CALCULATOR_META: Record<string, { label: string; icon: string; color: string }> = {
  construction:  { label: "Construction",   icon: "fas fa-home",         color: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400" },
  materials:     { label: "Materials BOQ",  icon: "fas fa-cubes",        color: "bg-stone-50 dark:bg-stone-900/40 text-stone-600 dark:text-stone-400" },
  interior:      { label: "Interiors",      icon: "fas fa-couch",        color: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400" },
  "doors-windows":{ label: "Doors/Windows", icon: "fas fa-door-open",    color: "bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400" },
  flooring:      { label: "Flooring",       icon: "fas fa-layer-group",  color: "bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400" },
  painting:      { label: "Painting",       icon: "fas fa-paint-roller", color: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400" },
  plumbing:      { label: "Plumbing",       icon: "fas fa-bath",         color: "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400" },
  electrical:    { label: "Electrical",     icon: "fas fa-bolt",         color: "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400" },
};

const Dashboard = () => {
  const { user, hasPaid, role, credits, loading } = useUser(); 
  const { showToast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await ProjectService.getAllByUser(user!.id);
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); 
    const isConfirmed = window.confirm("Are you sure you want to delete this project?");
    if (!isConfirmed) return;
    try {
      await ProjectService.deleteProject(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
      showToast("Project deleted successfully!", "success");
    } catch (error) {
      showToast("Failed to delete project.", "error");
    }
  };

  const handleOpenProject = (project: any) => {
    sessionStorage.setItem("projectData", JSON.stringify(project.data));
    window.location.href = `/?openCalculator=${project.type}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-zinc-100 mb-4">Access Restricted</h2>
          <p className="text-gray-600 dark:text-zinc-400 mb-6">Please sign in to view your dashboard.</p>
          <Link to="/signin" className="inline-block px-6 py-3 bg-primary text-white dark:text-zinc-950 rounded-lg font-medium hover:bg-primary-hover transition-colors">
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, <span className="font-semibold text-primary">{user.email}</span>
          </p>
        </div>
        <Link to="/upgrade" className="text-sm font-bold text-primary hover:underline flex items-center gap-2">
           <i className="fas fa-plus-circle"></i> Add More Credits
        </Link>
      </div>

      {/* --- NOTIFICATION BANNERS --- */}
      {!loading && credits === 0 && (
        <div className="mb-8 bg-red-50 border-2 border-red-100 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="bg-red-500 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <i className="fas fa-exclamation-circle text-xl"></i>
            </div>
            <div>
              <h4 className="text-red-900 font-bold text-lg leading-tight">Credits Exhausted</h4>
              <p className="text-red-700 text-sm">You have used all your project credits. Buy more to design new homes.</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/upgrade'}
            className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            Buy Credits Now
          </button>
        </div>
      )}

      {!loading && credits > 0 && credits <= 2 && (
        <div className="mb-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <i className="fas fa-bolt text-primary"></i>
            <p className="text-zinc-800 dark:text-zinc-200 text-sm font-medium">
              You're running low! Only <strong>{credits} credits</strong> remaining.
            </p>
          </div>
          <Link to="/upgrade" className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100 underline hover:no-underline">
            Top Up
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Account Status */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden sticky top-24">
            <div className="bg-secondary dark:bg-zinc-800 p-4 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto text-white text-2xl font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-white font-medium mt-2">Account Status</h3>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-4 mb-4">
                <span className="text-zinc-500 dark:text-zinc-400">Plan</span>
                {hasPaid ? (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full uppercase tracking-wider">Premium</span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs font-bold rounded-full uppercase tracking-wider">Free Tier</span>
                )}
              </div>
              {!hasPaid ? (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Unlock premium calculators and save unlimited reports.</p>
                  <Link to="/upgrade" className="block w-full py-2 bg-gradient-to-r from-zinc-950 to-zinc-900 dark:from-zinc-100 dark:to-white text-white dark:text-zinc-950 rounded-lg font-bold shadow-md hover:shadow-lg transition-all">
                    Upgrade to Pro
                  </Link>
                </div>
              ) : (
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900/40">
                  <p className="text-green-800 dark:text-green-400 font-medium flex items-center justify-center gap-2">
                    <i className="fas fa-check-circle"></i> All Features Unlocked
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Stats, Projects & Admin Controls */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-5 rounded-xl shadow-sm border flex items-center gap-4 transition-transform hover:-translate-y-1 ${
              credits === 0 ? "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50" : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800"
            }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                credits === 0 ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-primary/10 text-primary"
              }`}>
                <i className="fas fa-coins text-xl"></i>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Credits</p>
                <p className={`text-2xl font-bold ${credits === 0 ? "text-red-600" : "text-gray-800 dark:text-zinc-100"}`}>
                  {loading ? "-" : credits}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-400">
                <i className="fas fa-folder-open text-xl"></i>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Projects</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-zinc-100">{loadingProjects ? "-" : projects.length}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/20 rounded-full flex items-center justify-center text-purple-500 dark:text-purple-400">
                <i className="fas fa-file-pdf text-xl"></i>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Reports</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-zinc-100">{loadingProjects ? "-" : projects.length}</p>
              </div>
            </div>
          </div>

          {/* Project List */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 min-h-[300px]">
            <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <i className="fas fa-history text-primary"></i> Saved Estimates
            </h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">Click any project to open and edit it in the calculator.</p>

            {loadingProjects ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => {
                  const meta = CALCULATOR_META[project.type] || {
                    label: project.type,
                    icon: "fas fa-calculator",
                    color: "bg-gray-50 text-gray-600",
                  };
                  return (
                    <div
                      key={project.id}
                      onClick={() => handleOpenProject(project)}
                      className="group relative p-4 border border-gray-100 dark:border-zinc-800 rounded-xl cursor-pointer
                                 hover:border-primary/40 hover:shadow-md hover:bg-primary/5 dark:hover:bg-zinc-800/40
                                 transition-all duration-200 bg-gray-50 dark:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${meta.color}`}>
                            <i className={`${meta.icon} text-sm`}></i>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-800 dark:text-zinc-100 text-sm group-hover:text-primary transition-colors truncate">
                              {project.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-gray-400 dark:text-zinc-500 capitalize">{meta.label}</span>
                              <span className="text-gray-300 dark:text-zinc-700 text-xs">·</span>
                              <span className="text-xs text-gray-400 dark:text-zinc-500">
                                {new Date(project.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-base font-extrabold text-secondary dark:text-zinc-100">
                              {project.data?.totalCost
                                ? `₹${project.data.totalCost.toLocaleString("en-IN")}`
                                : "—"}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDelete(e, project.id)}
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex-shrink-0"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50">
                <i className="fas fa-clipboard-list text-4xl mb-3 text-gray-300 dark:text-zinc-600"></i>
                <p className="font-medium">No projects saved yet.</p>
                <Link to="/" className="mt-4 text-primary hover:text-primary-hover text-sm font-bold bg-white dark:bg-zinc-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm transition-all hover:shadow">
                  Start a new calculation
                </Link>
              </div>
            )}
          </div>

          {/* Admin Controls */}
          {role === 'admin' && (
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <i className="fas fa-tools"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-zinc-100">Admin Controls</h3>
              </div>
              <HeroManager />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;