import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const BlockedAccount = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-red-500/20">
         <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
           <span className="text-3xl">!</span>
         </div>
         <h1 className="text-2xl font-bold mb-4">Account Blocked</h1>
         <p className="text-gray-400 mb-8">
           Your account has been blocked by the admin. You cannot access library features at this time.
           Please contact your librarian for assistance.
         </p>
         <button 
           onClick={handleLogout}
           className="bg-gray-800 hover:bg-gray-700 w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
         >
           <LogOut size={18} />
           Sign Out
         </button>
      </div>
    </div>
  );
};

export default BlockedAccount;
