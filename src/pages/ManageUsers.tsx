import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import GenericList from '../components/GenericList';
import { Plus, Trash2, Lock, Unlock, Ban, CheckCircle } from 'lucide-react';

export default function ManageUsers() {
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const columns = [
    { key: 'name', label: 'Name', render: (u: any) => (
      <div className="flex flex-col gap-1 items-start">
        <span className="font-medium text-white">{u.name}</span>
        <div className="flex gap-2">
          {u.isBlocked && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase border border-red-500/20">Blocked</span>}
          {u.isDebarred && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full uppercase border border-orange-500/20">Debarred</span>}
        </div>
      </div>
    ) },
    { key: 'email', label: 'Email' },
    { key: 'createdAt', label: 'Registered', render: (u: any) => new Date(u.createdAt).toLocaleDateString() },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', formData);
      toast.success('User created successfully');
      setShowModal(false);
      setRefresh(r => r + 1);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create');
    }
  };

  const toggleBlock = async (id: string, isBlockedNow: boolean) => {
    try {
      await axios.put(`/api/users/${id}/block`, { isBlocked: !isBlockedNow });
      toast.success(`User ${isBlockedNow ? 'unblocked' : 'blocked'}`);
      setRefresh(r => r + 1);
    } catch (e: any) { toast.error('Action failed'); }
  };

  const toggleDebar = async (id: string, isDebarredNow: boolean) => {
    try {
      await axios.put(`/api/users/${id}/debar`, { isDebarred: !isDebarredNow });
      toast.success(`User borrowing ${isDebarredNow ? 'allowed' : 'debarred'}`);
      setRefresh(r => r + 1);
    } catch (e: any) { toast.error('Action failed'); }
  };

  const renderActions = (row: any) => (
    <div className="flex justify-end gap-2 text-gray-400">
      <button onClick={() => toggleDebar(row._id, row.isDebarred)} className="p-1 hover:text-white hover:bg-gray-800 rounded transition-colors" title={row.isDebarred ? "Allow Borrowing" : "Debar from Borrowing"}>
        {row.isDebarred ? <Ban size={16} className="text-red-500" /> : <Ban size={16} className="text-gray-400 hover:text-red-400" />}
      </button>
      <button onClick={() => toggleBlock(row._id, row.isBlocked)} className="p-1 hover:text-white hover:bg-gray-800 rounded transition-colors" title={row.isBlocked ? "Unblock User" : "Block User"}>
        {row.isBlocked ? <Unlock size={16} className="text-green-400" /> : <Lock size={16} className="text-red-400" />}
      </button>
      <button onClick={async () => {
        try {
          await axios.delete(`/api/users/${row._id}`); 
          toast.success('User deleted');
          setRefresh(r=>r+1);
        } catch(e: any) { toast.error('Delete failed'); }
      }} className="p-1 hover:text-red-400 hover:bg-gray-800 rounded">
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
         <h1 className="text-2xl font-bold">Manage Users</h1>
         <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
           <Plus size={18} /> Add User
         </button>
      </div>

      <div className="flex-1 overflow-y-auto">
         <GenericList key={refresh} endpoint="/api/users" columns={columns} renderActions={renderActions} searchFields={['name', 'email']} />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
           <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl w-full max-w-md">
             <h2 className="text-xl font-bold mb-4">Register New User</h2>
             <form onSubmit={handleCreate} className="space-y-4">
               {['name', 'email', 'password'].map(f => (
                 <div key={f}>
                   <label className="block text-sm text-gray-400 capitalize mb-1">{f}</label>
                   <input required type={f === 'password' ? 'password' : f === 'email' ? 'email' : 'text'} value={(formData as any)[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2" />
                 </div>
               ))}
               <div className="flex justify-end gap-3 mt-6">
                 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                 <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Register</button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
