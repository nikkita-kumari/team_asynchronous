import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import GenericList from '../components/GenericList';
import { Plus, Edit2, Trash2, X, Book } from 'lucide-react';

export default function ManageBooks() {
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [formData, setFormData] = useState({ title: '', author: '', category: '', publisher: '', isbn: '', quantity: 1, description: '' });

  const columns = [
    { 
      key: 'title', 
      label: 'Book Details', 
      render: (b: any) => (
        <div>
          <div className="font-medium text-white text-base">{b.title}</div>
          <div className="text-gray-400 text-xs mt-0.5">{b.author} &bull; {b.publisher || 'Unknown Publisher'}</div>
        </div>
      ) 
    },
    { 
      key: 'category', 
      label: 'Category',
      render: (b: any) => (
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md text-xs font-medium">
          {b.category}
        </span>
      )
    },
    { 
      key: 'isbn', 
      label: 'ISBN',
      render: (b: any) => <span className="text-gray-400 font-mono text-xs bg-gray-900 px-2 py-1 rounded">{b.isbn || 'N/A'}</span>
    },
    { 
      key: 'quantity', 
      label: 'Stock',
      render: (b: any) => (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${b.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {b.quantity}
          </span>
          <span className="text-gray-500 text-xs">Total</span>
        </div>
      )
    },
  ];

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/books', formData);
      toast.success('Book created successfully');
      setShowModal(false);
      setFormData({ title: '', author: '', category: '', publisher: '', isbn: '', quantity: 1, description: '' });
      setRefresh(r => r + 1);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create');
    }
  };

  const deleteBook = async (id: string) => {
    try {
      await axios.delete(`/api/books/${id}`);
      toast.success('Book deleted');
      setDeleteConfirmId(null);
      setRefresh(r => r + 1);
    } catch (e: any) { toast.error('Failed to delete book'); }
  };

  const renderActions = (row: any) => (
    <div className="flex justify-end gap-2 text-gray-400">
      <button 
        onClick={() => setDeleteConfirmId(row._id)} 
        className="p-1.5 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
        title="Delete Book"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 shrink-0">
         <div>
           <h1 className="text-2xl font-bold text-white">Manage Books</h1>
           <p className="text-gray-400 text-sm mt-1">Add, update, or remove books from the library inventory</p>
         </div>
         <button 
           onClick={() => setShowModal(true)} 
           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
         >
           <Plus size={18} /> Add New Book
         </button>
      </div>

      <div className="flex-1 overflow-y-auto mb-6">
         <GenericList 
           key={refresh} 
           endpoint="/api/books" 
           columns={columns} 
           renderActions={renderActions} 
           searchFields={['title', 'author', 'category', 'publisher', 'isbn']} 
           filterKey="category"
           filterOptions={['Computer Science', 'Information Technology', 'Electronics Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'First Year', 'Other']}
           emptyMessage="No books found in the library. Add one to get started."
         />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
             <div className="bg-gray-950 px-6 py-4 border-b border-gray-800 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                 <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                   <Book size={20} />
                 </div>
                 <h2 className="text-xl font-bold text-white">Add New Book</h2>
               </div>
               <button 
                 onClick={() => setShowModal(false)}
                 className="text-gray-400 hover:text-white p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
               >
                 <X size={20} />
               </button>
             </div>
             
             <form onSubmit={handleCreate} className="p-6 overflow-y-auto max-h-[80vh]">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-300 mb-1.5">Book Title *</label>
                   <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-gray-600 transition-colors" placeholder="e.g. The Great Gatsby" />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1.5">Author *</label>
                   <input required value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-gray-600 transition-colors" placeholder="e.g. F. Scott Fitzgerald" />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1.5">Category *</label>
                   <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white transition-colors">
                     <option value="">Select Category/Branch</option>
                     <option value="Computer Science">Computer Science</option>
                     <option value="Information Technology">Information Technology</option>
                     <option value="Electronics Engineering">Electronics Engineering</option>
                     <option value="Electrical Engineering">Electrical Engineering</option>
                     <option value="Mechanical Engineering">Mechanical Engineering</option>
                     <option value="Civil Engineering">Civil Engineering</option>
                     <option value="First Year">First Year</option>
                     <option value="Other">Other</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1.5">Publisher</label>
                   <input value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-gray-600 transition-colors" placeholder="e.g. Scribner" />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1.5">ISBN</label>
                   <input value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-gray-600 transition-colors" placeholder="e.g. 978-0743273565" />
                 </div>

                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                   <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-gray-600 transition-colors resize-none" placeholder="Brief description of the book..." />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1.5">Quantity *</label>
                   <input type="number" required min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors" />
                 </div>
               </div>

               <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-800">
                 <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                 <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Save Book</button>
               </div>
             </form>
           </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
             <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center mb-4">
                <Trash2 size={24} />
             </div>
             <h2 className="text-xl font-bold text-white mb-2">Delete Book</h2>
             <p className="text-gray-400 text-sm mb-6">Are you sure you want to delete this book? This action cannot be undone.</p>
             <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex-1">Cancel</button>
                <button onClick={() => deleteBook(deleteConfirmId)} className="px-5 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex-1">Delete</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
