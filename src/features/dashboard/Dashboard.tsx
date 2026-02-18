import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { ProjectService } from "../../services/projectService";

const Dashboard = () => {
  const { user, hasPaid, loading } = useUser();
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Fetch projects when the dashboard loads and user is available
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

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
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your dashboard and saved projects.</p>
          <Link to="/signin" className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors">
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, <span className="font-semibold text-primary">{user.email}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* --- Left Column: Account Status --- */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-secondary p-4 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto text-white text-2xl font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-white font-medium mt-2">Account Status</h3>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <span className="text-gray-500">Plan</span>
                {hasPaid ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">Premium</span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase tracking-wider">Free Tier</span>
                )}
              </div>
              
              {!hasPaid ? (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">Unlock premium calculators and save unlimited reports.</p>
                  <Link to="/upgrade" className="block w-full py-2 bg-gradient-to-r from-primary to-yellow-500 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all">
                    Upgrade to Pro
                  </Link>
                </div>
              ) : (
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-green-800 font-medium flex items-center justify-center gap-2">
                    <i className="fas fa-check-circle"></i> All Features Unlocked
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Right Column: Stats & Projects --- */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Top Stats Boxes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                <i className="fas fa-folder-open text-xl"></i>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Saved Projects</p>
                <p className="text-2xl font-bold text-gray-800">{loadingProjects ? "-" : projects.length}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
                <i className="fas fa-file-pdf text-xl"></i>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Reports Generated</p>
                <p className="text-2xl font-bold text-gray-800">{loadingProjects ? "-" : projects.length}</p>
              </div>
            </div>
          </div>

          {/* Project List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px]">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-history text-primary"></i> Recent Estimates
            </h3>
            
            {loadingProjects ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all bg-gray-50 hover:bg-white flex justify-between items-center group">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg group-hover:text-primary transition-colors">{project.name}</h4>
                      <div className="flex gap-4 text-xs text-gray-500 mt-2">
                        <span className="capitalize font-medium px-2 py-1 bg-gray-200 rounded-md">
                          <i className="fas fa-calculator mr-1"></i>{project.type.replace('-', ' ')}
                        </span>
                        <span className="flex items-center">
                          <i className="far fa-calendar-alt mr-1"></i>
                          {new Date(project.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-secondary">
                        {project.data?.totalCost ? `₹${project.data.totalCost.toLocaleString('en-IN')}` : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <i className="fas fa-clipboard-list text-4xl mb-3 text-gray-300"></i>
                <p className="font-medium">No projects saved yet.</p>
                <Link to="/" className="mt-4 text-primary hover:text-yellow-600 text-sm font-bold bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow">
                  Start a new calculation
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;