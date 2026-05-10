import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Lock, CreditCard } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.isBlocked) {
    return <Navigate to="/blocked" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const isPaymentsPage = location.pathname === '/payments';

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col items-stretch overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
           <Outlet />
        </main>
        
        {user.isDebarred && !isPaymentsPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
            <div className="bg-gray-950 border border-red-500/30 p-8 rounded-2xl max-w-sm text-center shadow-2xl mx-4">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Feature Access Locked</h2>
              <p className="text-gray-400 mb-6 text-sm">
                You have been debarred from accessing library features. First clear all your dues, then you will be able to access the features.
              </p>
              <button 
                onClick={() => navigate('/payments')} 
                className="flex items-center justify-center w-full gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium text-sm"
              >
                <CreditCard size={18} /> Go to Payments
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
