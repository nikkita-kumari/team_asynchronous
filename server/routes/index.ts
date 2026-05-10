import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import bookRoutes from './bookRoutes.js';
import borrowRoutes from './borrowRoutes.js';
// Add additional routes here directly to save files
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { Payment, Reservation, IssuedBook, ReturnedBook, BorrowRequest } from '../models/Records.js';
import { Book } from '../models/Book.js';
import { User } from '../models/User.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/borrows', borrowRoutes);

// Payments endpoints
router.get('/payments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const filter: any = { adminId: req.user!.adminId };
    if (req.user!.role === 'user') filter.userId = req.user!.id;
    const payments = await Payment.find(filter).populate('userId').sort({ createdAt: -1 });
    res.json(payments);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/payments/:id/pay', requireAuth, async (req: AuthRequest, res) => {
  try {
    const filter: any = { _id: req.params.id, adminId: req.user!.adminId, status: 'Pending' };
    if (req.user!.role === 'user') filter.userId = req.user!.id; // only own payments
    const payment = await Payment.findOneAndUpdate(filter, { status: 'Awaiting Verification' });
    if (!payment) return res.status(404).json({ message: 'Payment not found or already processed' });
    res.json({ message: 'Payment submitted, awaiting admin verification' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/payments/:id/verify', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user!.adminId, status: 'Awaiting Verification' },
      { status: 'Paid' }
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment verified successfully' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Reservations
router.post('/reservations', requireAuth, async (req: AuthRequest, res) => {
   try {
     if (req.user!.role === 'admin') return res.status(403).json({ message: 'Admins cannot reserve' });

     const user = await User.findById(req.user!.id);
     if (user?.isDebarred) {
       return res.status(403).json({ message: 'You have been debarred from reserving books due to unpaid fines.' });
     }

     const { bookId } = req.body;
     const book = await Book.findById(bookId);
     if (!book) return res.status(404).json({ message: 'Book not found' });
     if (book.quantity > 0) return res.status(400).json({ message: 'Book is available, no need to reserve' });

     const existing = await Reservation.findOne({ bookId, userId: req.user!.id, status: { $in: ['Pending', 'Active'] } });
     if (existing) return res.status(400).json({ message: 'You already reserved this book' });

     await Reservation.create({ bookId, userId: req.user!.id, adminId: req.user!.adminId, status: 'Pending' });
     res.json({ message: 'Reservation request sent successfully. Waiting for admin approval.' });
   } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/reservations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const filter: any = { adminId: req.user!.adminId, status: { $in: ['Pending', 'Active', 'Fulfilled'] } };
    if (req.user!.role === 'user') filter.userId = req.user!.id;
    const reservations = await Reservation.find(filter).populate('bookId').populate('userId').sort({ createdAt: -1 });
    res.json(reservations);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/reservations/:id/accept', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user!.adminId, status: 'Pending' },
      { status: 'Active' }
    );
    if (!reservation) return res.status(404).json({ message: 'Reservation not found or already active' });
    res.json({ message: 'Reservation accepted. Book will be automatically issued when available.' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/reservations/:id/reject', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const reservation = await Reservation.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user!.adminId, status: 'Pending' },
      { status: 'Cancelled' }
    );
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
    res.json({ message: 'Reservation rejected.' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Dashboard Analytics
router.get('/dashboard', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
   try {
     const adminId = req.user!.adminId;
     const totalBooks = await Book.countDocuments({ adminId });
     const totalUsers = await User.countDocuments({ adminId });
     const issuedBooks = await IssuedBook.countDocuments({ adminId, status: 'Issued' });
     const pendingRequests = await BorrowRequest.countDocuments({ adminId, status: 'Pending' });
     const reservations = await Reservation.countDocuments({ adminId, status: 'Active' });
     const returnedBooks = await ReturnedBook.countDocuments({ adminId });
     
     // Overdue books computation could be complex db query, let's just do a simple date check
     const overdueBooks = await IssuedBook.countDocuments({ adminId, status: 'Issued', dueDate: { $lt: new Date() } });

     const payments = await Payment.find({ adminId });
     const totalFineCollected = payments.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
     const pendingFeesCount = payments.filter(p => p.status === 'Pending' || p.status === 'Awaiting Verification').length;

     res.json({
       totalBooks, totalUsers, issuedBooks, pendingRequests, reservations, returnedBooks, overdueBooks, totalFineCollected, pendingFeesCount
     });
   } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

export default router;
