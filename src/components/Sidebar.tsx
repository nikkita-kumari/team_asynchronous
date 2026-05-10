import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, LayoutDashboard, Bookmark, CreditCard, Clock, Activity, ArrowRightLeft } from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const adminLinks = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Manage Books', path: '/admin/books', icon: <BookOpen size={20} /> },
    { name: 'Manage Users', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Pending Requests', path: '/admin/requests', icon: <Activity size={20} /> },
    { name: 'Issued Books', path: '/admin/issued', icon: <ArrowRightLeft size={20} /> },
    { name: 'Returned Books', path: '/admin/returned', icon: <Clock size={20} /> },
    { name: 'Reservations', path: '/admin/reservations', icon: <Bookmark size={20} /> },
    { name: 'Payments', path: '/admin/payments', icon: <CreditCard size={20} /> },
    { name: 'Debarred Students', path: '/admin/debarred', icon: <Users size={20} /> },
  ];

  const userLinks = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Available Books', path: '/library', icon: <BookOpen size={20} /> },
    { name: 'My Requests', path: '/my-requests', icon: <Activity size={20} /> },
    { name: 'Borrowed Books', path: '/borrowed', icon: <ArrowRightLeft size={20} /> },
    { name: 'My Reservations', path: '/reservations', icon: <Bookmark size={20} /> },
    { name: 'Fines & Payments', path: '/payments', icon: <CreditCard size={20} /> },
    { name: 'Borrow History', path: '/history', icon: <Clock size={20} /> },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col h-full flex-shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          SmartLibrary
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`
            }
          >
            {link.icon}
            {link.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
