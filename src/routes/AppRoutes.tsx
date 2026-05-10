import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import BlockedAccount from '../pages/BlockedAccount';
import Dashboard from '../pages/Dashboard';
import ManageBooks from '../pages/ManageBooks';
import ManageUsers from '../pages/ManageUsers';
import GenericList from '../components/GenericList';

// Inline simple pages
const AvailableBooks = () => {
   const { user } = useAuth();
   const requestBook = async (id: string, fetchData: any) => {
      try {
        await axios.post('/api/borrows/request', { bookId: id });
        toast.success("Borrow request sent");
        fetchData();
      } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
   };
   const reserveBook = async (id: string, fetchData: any) => {
      try {
        await axios.post('/api/reservations', { bookId: id });
        toast.success("Reservation requested");
        fetchData();
      } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
   };
   const columns = [
      { key: 'title', label: 'Title', render: (b: any) => <div className="font-medium text-white">{b.title}<div className="text-xs text-gray-500">{b.author}</div></div> },
      { key: 'category', label: 'Category' },
      { key: 'quantity', label: 'Availability', render: (b: any) => b.quantity > 0 ? <span className="text-green-400">{b.quantity} available</span> : <span className="text-red-400">Out of stock</span> },
   ];
   const renderActions = (row: any, fetchData: any) => {
      if (row.userIssued) {
         return <span className="text-sm bg-gray-500/20 text-gray-400 px-3 py-1.5 rounded-lg">Issued to you</span>;
      }
      if (row.userRequested) {
         return <span className="text-sm bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg">Requested</span>;
      }
      if (row.userReserved) {
         return <span className="text-sm bg-purple-600/20 text-purple-400 px-3 py-1.5 rounded-lg">Reserved</span>;
      }

      return row.quantity > 0 ? (
         <button onClick={() => requestBook(row._id, fetchData)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">Borrow Book</button>
      ) : (
         <button onClick={() => reserveBook(row._id, fetchData)} className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors">Reserve Book</button>
      );
   };
   return <GenericList 
      endpoint="/api/books" 
      title="Available Books" 
      columns={columns} 
      renderActions={renderActions} 
      searchFields={['title', 'author', 'category', 'publisher', 'isbn']} 
      filterKey="category"
      filterOptions={[
        'Computer Science', 
        'Information Technology', 
        'Electronics Engineering', 
        'Electrical Engineering', 
        'Mechanical Engineering', 
        'Civil Engineering',
        'First Year',
        'Other'
      ]}
   />;
};

const AdminRequests = () => {
   const handleAction = async (id: string, action: 'accept' | 'reject', fetchData: any) => {
      try {
        await axios.post(`/api/borrows/requests/${id}/${action}`);
        toast.success(`Request ${action}ed`);
        fetchData();
      } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
   };
   const columns = [
      { key: 'book', label: 'Book', render: (r: any) => <span className="font-medium text-white">{r.bookId?.title}</span> },
      { key: 'user', label: 'User', render: (r: any) => r.userId?.name },
      { key: 'date', label: 'Request Date', render: (r: any) => formatDistanceToNow(new Date(r.createdAt), {addSuffix: true}) },
   ];
   const renderActions = (row: any, fetchData: any) => (
      <div className="flex gap-2 justify-end">
        <button onClick={() => handleAction(row._id, 'accept', fetchData)} className="text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1 rounded transition-colors">Accept</button>
        <button onClick={() => handleAction(row._id, 'reject', fetchData)} className="text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1 rounded transition-colors">Reject</button>
      </div>
   );
   return <GenericList endpoint="/api/borrows/requests" title="Pending Borrow Requests" columns={columns} renderActions={renderActions} />;
};

const IssuedBooks = () => {
   const { user } = useAuth();
   const handleReturn = async (row: any, fetchData: any) => {
     try {
       await axios.post(`/api/borrows/return/${row._id}`);
       toast.success(`Book returned successfully by ${row.userId?.name || user?.name || 'User'}`);
       fetchData();
     } catch(e:any) { toast.error(e.response?.data?.message || 'Error'); }
   };
   const columns = [
      { key: 'book', label: 'Book', render: (r: any) => <span className="font-medium text-white">{r.bookId?.title}</span> },
      { key: 'user', label: 'User', render: (r: any) => r.userId?.name || '-' },
      ...(user?.role === 'admin' ? [{ key: 'userEmail', label: 'Email', render: (r: any) => <span className="text-gray-400 text-xs">{r.userId?.email}</span> }] : []),
      { key: 'issueDate', label: 'Issue Date', render: (r: any) => format(new Date(r.issueDate), 'MMM dd, yyyy') },
      { key: 'dueDate', label: 'Due Date', render: (r: any) => format(new Date(r.dueDate), 'MMM dd, yyyy') },
      { key: 'status', label: 'Status', render: (r: any) => {
          const due = new Date(r.dueDate);
          const now = new Date();
          const p = "px-2 py-0.5 rounded-full text-xs font-medium border";
          if (now > due) return <span className={`text-red-400 border-red-500/20 bg-red-500/10 ${p}`}>Overdue</span>;
          return <span className={`text-green-400 border-green-500/20 bg-green-500/10 ${p}`}>Active</span>;
      }},
      { key: 'lateDetails', label: 'Late Details', render: (r: any) => {
          const due = new Date(r.dueDate);
          const now = new Date();
          if (now <= due) return <span className="text-gray-500">-</span>;
          const lateDays = Math.max(0, differenceInDays(now, due));
          const fine = lateDays * 5;
          return (
             <div className="flex flex-col text-xs">
                <span className="text-red-400">{lateDays} days late</span>
                <span className="text-orange-400 font-medium">₹{fine} Fine</span>
             </div>
          );
      }}
   ];
   const renderActions = (row: any, fetchData: any) => (
      <button onClick={()=>handleReturn(row, fetchData)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-center rounded transition-colors">
         {user?.role === 'admin' ? 'Mark Returned' : 'Return'}
      </button>
   );
   return <GenericList endpoint="/api/borrows/issued" title="Issued Books" columns={columns} renderActions={renderActions} />;
};

const ReturnedBooks = () => {
   const { user } = useAuth();
   const columns = [
      { key: 'book', label: 'Book', render: (r: any) => <span className="font-medium text-white">{r.bookId?.title}</span> },
      { key: 'user', label: 'User', render: (r: any) => r.userId?.name || '-' },
      ...(user?.role === 'admin' ? [{ key: 'userEmail', label: 'Email', render: (r: any) => <span className="text-gray-400 text-xs">{r.userId?.email}</span> }] : []),
      { key: 'returnDate', label: 'Return Date', render: (r: any) => format(new Date(r.returnDate), 'MMM dd, yyyy h:mm a') },
      { key: 'fine', label: 'Late Fine', render: (r: any) => r.fineAmount > 0 ? <span className="text-red-400">₹{r.fineAmount}</span> : <span className="text-gray-400">₹0</span> },
   ];
   return <GenericList endpoint="/api/borrows/returned" title="Borrowing History" columns={columns} />;
};

const DebarredUsers = () => {
   const handleAction = async (id: string, fetchData: any) => {
      try {
        await axios.put(`/api/users/${id}/debar`, { isDebarred: false });
        toast.success(`User borrowing allowed`);
        fetchData();
      } catch (e: any) { toast.error('Action failed'); }
   };
   const columns = [
      { key: 'name', label: 'Name', render: (r: any) => <span className="font-medium text-white">{r.name}</span> },
      { key: 'email', label: 'Email', render: (r: any) => <span className="text-gray-400">{r.email}</span> },
      { key: 'date', label: 'Registered On', render: (r: any) => <span className="text-gray-400">{format(new Date(r.createdAt), 'MMM dd, yyyy')}</span> },
   ];
   const renderActions = (row: any, fetchData: any) => (
      <button onClick={() => handleAction(row._id, fetchData)} className="text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded transition-colors font-medium">Remove Debar</button>
   );
   return <GenericList endpoint="/api/users/debarred" title="Debarred Students" columns={columns} renderActions={renderActions} />;
};

const Payments = () => {
   const { user } = useAuth();
   const handleAction = async (endpoint: string, fetchData: any) => {
     try {
       await axios.post(endpoint);
       toast.success("Success");
       fetchData();
     } catch(e:any) { toast.error('Error processing payment'); }
   };
   const columns = [
      { key: 'type', label: 'Fee Type', render: (p: any) => <span className="text-white">{p.type}</span> },
      ...(user?.role === 'admin' ? [{ key: 'user', label: 'User', render: (r: any) => r.userId?.name }] : []),
      { key: 'amount', label: 'Amount', render: (p: any) => `₹${p.amount}` },
      { key: 'status', label: 'Status', render: (p: any) => {
          const dict:any = { 'Pending': 'text-orange-400', 'Awaiting Verification': 'text-blue-400', 'Paid': 'text-green-400' };
          return <span className={dict[p.status] || 'text-gray-400'}>{p.status}</span>;
      }},
   ];
   const renderActions = (row: any, fetchData: any) => {
      if (user?.role === 'user' && row.status === 'Pending') {
         return <button onClick={()=>handleAction(`/api/payments/${row._id}/pay`, fetchData)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition-colors">Pay in Cash</button>;
      }
      if (user?.role === 'admin' && row.status === 'Awaiting Verification') {
         return <button onClick={()=>handleAction(`/api/payments/${row._id}/verify`, fetchData)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors">Verify Receipt</button>;
      }
      return null;
   };
   return <GenericList endpoint="/api/payments" title={user?.role === 'admin' ? "Payment Management" : "My Fines & Payments"} columns={columns} renderActions={renderActions} />;
};

const Reservations = () => {
   const { user } = useAuth();
   const handleAction = async (id: string, action: 'accept' | 'reject', fetchData: any) => {
      try {
        await axios.post(`/api/reservations/${id}/${action}`);
        toast.success(`Reservation ${action}ed`);
        fetchData();
      } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
   };
   const columns = [
      { key: 'book', label: 'Book Details', render: (r: any) => (
         <div>
           <div className="font-medium text-white">{r.bookId?.title}</div>
           <div className="text-gray-400 text-xs mt-0.5">{r.bookId?.author}</div>
         </div>
      )},
      ...(user?.role === 'admin' ? [{ key: 'user', label: 'Requested By', render: (r: any) => <span className="text-gray-300">{r.userId?.name}</span> }] : []),
      { key: 'date', label: 'Date', render: (r: any) => <span className="text-gray-300">{format(new Date(r.createdAt), 'MMM dd, yyyy')}</span> },
      { key: 'status', label: 'Status', render: (r: any) => {
          const s = r.status;
          if (s === 'Pending') return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-md text-xs font-medium">Pending Approval</span>;
          if (s === 'Active') return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md text-xs font-medium">In Queue</span>;
          if (s === 'Fulfilled') return <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-md text-xs font-medium">Auto-Issued</span>;
          return <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2.5 py-1 rounded-md text-xs font-medium">{s}</span>;
      }},
   ];
   const renderActions = (row: any, fetchData: any) => {
      if (user?.role === 'admin' && row.status === 'Pending') {
         return (
            <div className="flex gap-2 justify-end">
              <button onClick={() => handleAction(row._id, 'accept', fetchData)} className="text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded transition-colors font-medium">Accept Queue</button>
              <button onClick={() => handleAction(row._id, 'reject', fetchData)} className="text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1.5 rounded transition-colors font-medium">Reject</button>
            </div>
         );
      }
      return null;
   };
   return <GenericList endpoint="/api/reservations" title="Reservation Queue" columns={columns} renderActions={renderActions} />;
};


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/blocked" element={<BlockedAccount />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/admin/books" element={<ManageBooks />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/requests" element={<AdminRequests />} />
        <Route path="/admin/issued" element={<IssuedBooks />} />
        <Route path="/admin/returned" element={<ReturnedBooks />} />
        <Route path="/admin/payments" element={<Payments />} />
        <Route path="/admin/reservations" element={<Reservations />} />
        <Route path="/admin/debarred" element={<DebarredUsers />} />
      </Route>

      {/* User Routes */}
      <Route element={<ProtectedRoute allowedRoles={['user']} />}>
        <Route path="/library" element={<AvailableBooks />} />
        <Route path="/borrowed" element={<IssuedBooks />} />
        <Route path="/my-requests" element={<GenericList endpoint="/api/borrows/my-requests" title="My Requests" columns={[
          { key: 'book', label: 'Book', render: (r:any) => r.bookId?.title },
          { key: 'status', label: 'Status', render: (r:any) => r.status }
        ]} />} />
        <Route path="/history" element={<ReturnedBooks />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/payments" element={<Payments />} />
      </Route>

      {/* Shared Component for root dashboard based on role inside AuthContext logic */}
      <Route element={<ProtectedRoute />}>
         <Route path="/" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
