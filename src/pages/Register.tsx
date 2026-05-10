import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Register() {
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminId, setAdminId] = useState('');
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { registerAdmin, registerUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'user') {
      axios.get('/api/auth/admins')
        .then(res => setAdmins(res.data))
        .catch(() => toast.error('Failed to load admins'));
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'user' && !adminId) {
       toast.error('Please select an admin to join');
       return;
    }
    setLoading(true);
    try {
      if (role === 'admin') {
         await registerAdmin({ name, email, password });
      } else {
         await registerUser({ name, email, password, adminId });
      }
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            {role === 'admin' ? 'Register Library' : 'Register User'}
          </h1>
          <p className="text-gray-400 mt-2">Create a new {role === 'admin' ? 'library admin' : 'user'} account</p>
        </div>

        <div className="flex p-1 bg-gray-950 rounded-lg mb-6">
          <button
            onClick={() => setRole('user')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === 'user' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            User
          </button>
          <button
             onClick={() => setRole('admin')}
             className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === 'admin' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
            <input type="text" required
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
            <input type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Enter your email"
            />
          </div>
          {role === 'user' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Select Admin</label>
              <select required
                value={adminId} onChange={e => setAdminId(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">-- Choose Admin --</option>
                {admins.map(a => (
                   <option key={a._id} value={a._id}>{a.email}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm text-gray-400">
           Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
