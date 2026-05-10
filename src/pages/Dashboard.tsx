import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Activity, Clock, DollarSign, Bookmark, Sparkles } from 'lucide-react';
import GenericList from '../components/GenericList';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      axios.get('/api/dashboard').then(res => setStats(res.data)).catch(console.error);
    }
  }, [user]);

  if (user?.role === 'user') {
    const requestBook = async (id: string, fetchData: any) => {
      try {
         await axios.post('/api/borrows/request', { bookId: id });
         toast.success('Borrow request sent');
         fetchData();
      } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
    };
    const reserveBook = async (id: string, fetchData: any) => {
      try {
         await axios.post('/api/reservations', { bookId: id });
         toast.success('Reservation created');
         fetchData();
      } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
    };

    const columns = [
      { key: 'title', label: 'Book Title', render: (r: any) => <div className="font-medium text-white">{r.title}</div> },
      { key: 'author', label: 'Author', render: (r: any) => <div className="text-gray-400">{r.author}</div> },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Availability', render: (r: any) => r.quantity > 0 ? <span className="text-green-400">Available ({r.quantity})</span> : <span className="text-red-400">Out of Stock</span> }
    ];

    const renderActions = (row: any, fetchData: any) => {
      if (row.userIssued) return <span className="text-gray-500 text-sm">Currently Issued</span>;
      if (row.userReserved) return <span className="text-purple-400 text-sm">Reserved</span>;
      if (row.userRequested) return <span className="text-orange-400 text-sm">Requested</span>;
      
      return row.quantity > 0 ? (
         <button onClick={() => requestBook(row._id, fetchData)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">Borrow Book</button>
      ) : (
         <button onClick={() => reserveBook(row._id, fetchData)} className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors">Reserve Book</button>
      );
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent inline-block">Welcome back, {user.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
           <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center justify-between">
              <div><p className="text-gray-400 text-sm">Library Status</p><p className="text-xl font-semibold mt-1">Active Member</p></div>
              <div className="bg-blue-500/10 p-3 rounded-lg text-blue-400"><BookOpen size={24} /></div>
           </div>
        </div>

        <div className="mt-8 relative">
           <div className="absolute -top-3 -left-3 text-yellow-500 opacity-20"><Sparkles size={64} /></div>
           <GenericList 
             endpoint="/api/books/recommendations" 
             title="AI Recommended for You" 
             columns={columns} 
             renderActions={renderActions}
             emptyMessage="No recommendations yet. Borrow some books first!"
           />
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard title="Total Books" value={stats.totalBooks} icon={<BookOpen size={24} />} color="blue" />
           <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={24} />} color="indigo" />
           <StatCard title="Issued Books" value={stats.issuedBooks} icon={<Activity size={24} />} color="green" />
           <StatCard title="Pending Requests" value={stats.pendingRequests} icon={<Clock size={24} />} color="orange" />
           <StatCard title="Overdue Books" value={stats.overdueBooks} icon={<Clock size={24} />} color="red" />
           <StatCard title="Reservations" value={stats.reservations} icon={<Bookmark size={24} />} color="purple" />
           <StatCard title="Total Fine Collected" value={`₹${stats.totalFineCollected}`} icon={<DollarSign size={24} />} color="emerald" />
           <StatCard title="Pending Fees" value={stats.pendingFeesCount} icon={<DollarSign size={24} />} color="yellow" />
        </div>
      ) : (
        <div className="text-gray-400">Loading stats...</div>
      )}
    </div>
  );
}

const StatCard = ({ title, value, icon, color }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-500/10 text-blue-400',
    indigo: 'bg-indigo-500/10 text-indigo-400',
    green: 'bg-green-500/10 text-green-400',
    orange: 'bg-orange-500/10 text-orange-400',
    red: 'bg-red-500/10 text-red-400',
    purple: 'bg-purple-500/10 text-purple-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
  };
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center justify-between">
       <div>
         <p className="text-gray-400 text-sm font-medium">{title}</p>
         <p className="text-2xl font-bold mt-1 max-w-[200px] truncate">{value}</p>
       </div>
       <div className={`p-4 rounded-xl ${colorMap[color]}`}>
         {icon}
       </div>
    </div>
  );
};
