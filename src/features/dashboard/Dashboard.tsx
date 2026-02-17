import React from "react";
// FIX: Go up two levels
import { useUser } from "../../context/UserContext";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, hasPaid, loading } = useUser();

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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, <span className="font-semibold text-primary">{user.email}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Premium</span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">Free Tier</span>
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

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                <i className="fas fa-folder-open text-xl"></i>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Saved Projects</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
                <i className="fas fa-file-pdf text-xl"></i>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Reports Generated</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[200px]">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Estimates</h3>
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
              <i className="fas fa-clipboard-list text-3xl mb-2"></i>
              <p>No projects saved yet.</p>
              <Link to="/" className="mt-4 text-primary hover:underline text-sm font-medium">Start a new calculation</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;