import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle could go here */}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">
           Welcome, <strong className="text-white">{user?.name}</strong>
           <span className="ml-2 uppercase text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300 border border-gray-700">
             {user?.role}
           </span>
        </span>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
