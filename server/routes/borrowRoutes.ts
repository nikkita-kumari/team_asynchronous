import { Router } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { Book } from '../models/Book.js';
import { BorrowRequest, IssuedBook, ReturnedBook, Payment, Reservation } from '../models/Records.js';
import { User } from '../models/User.js';
import { addDays, differenceInDays, subDays } from 'date-fns';

const router = Router();

router.post('/request', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const adminId = req.user!.adminId;
    const { bookId } = req.body;

    if (req.user!.role === 'admin') return res.status(403).json({ message: 'Admins cannot borrow books' });

    const user = await User.findById(userId);
    if (user?.isDebarred) {
      return res.status(403).json({ message: 'You have been debarred from borrowing books due to unpaid fines.' });
    }

    const oneWeekAgo = subDays(new Date(), 7);
    const weeklyRequests = await BorrowRequest.countDocuments({
      userId,
      createdAt: { $gte: oneWeekAgo }
    });
    
    if (weeklyRequests >= 5) {
      return res.status(400).json({ message: 'You cannot borrow more than 5 books in a week.' });
    }

    const activeRequests = await BorrowRequest.countDocuments({ userId, status: 'Pending' });
    const activeIssued = await IssuedBook.countDocuments({ userId, status: 'Issued' });
    if (activeRequests + activeIssued >= 5) {
      return res.status(400).json({ message: 'Borrow limit reached. You can borrow a maximum of 5 books at a time.' });
    }

    const existingRequest = await BorrowRequest.findOne({ userId, bookId, status: 'Pending' });
    if (existingRequest) return res.status(400).json({ message: 'Request already pending' });

    const existingIssued = await IssuedBook.findOne({ userId, bookId, status: 'Issued' });
    if (existingIssued) return res.status(400).json({ message: 'You already borrowed this book' });

    const book = await Book.findById(bookId);
    if (!book || book.quantity <= 0) return res.status(400).json({ message: 'Book not available' });

    const reqDoc = await BorrowRequest.create({ bookId, userId, adminId });
    res.json({ message: 'Borrow request sent successfully', request: reqDoc });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/requests', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const requests = await BorrowRequest.find({ adminId: req.user!.adminId, status: 'Pending' }).populate('bookId').populate('userId').sort({ createdAt: -1 });
    res.json(requests);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/my-requests', requireAuth, async (req: AuthRequest, res) => {
  try {
    const requests = await BorrowRequest.find({ userId: req.user!.id }).populate('bookId').sort({ createdAt: -1 });
    res.json(requests);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/requests/:id/accept', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const request = await BorrowRequest.findOneAndUpdate({ _id: req.params.id, adminId: req.user!.adminId, status: 'Pending' }, { status: 'Accepted' });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const book = await Book.findById(request.bookId);
    if (!book || book.quantity <= 0) {
      request.status = 'Pending';
      await request.save();
      return res.status(400).json({ message: 'Book out of stock' });
    }

    book.quantity -= 1;
    await book.save();

    const issued = await IssuedBook.create({
      bookId: request.bookId,
      userId: request.userId,
      adminId: request.adminId,
      dueDate: addDays(new Date(), 14),
      issueFee: 0
    });

    res.json({ message: 'Request accepted and book issued' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/requests/:id/reject', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const request = await BorrowRequest.findOneAndUpdate({ _id: req.params.id, adminId: req.user!.adminId, status: 'Pending' }, { status: 'Rejected' });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Request rejected' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/issued', requireAuth, async (req: AuthRequest, res) => {
  try {
    const filter: any = { adminId: req.user!.adminId, status: 'Issued' };
    if (req.user!.role === 'user') filter.userId = req.user!.id;
    const issued = await IssuedBook.find(filter).populate('bookId').populate('userId').sort({ createdAt: -1 });
    res.json(issued);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/returned', requireAuth, async (req: AuthRequest, res) => {
  try {
    const filter: any = { adminId: req.user!.adminId };
    if (req.user!.role === 'user') filter.userId = req.user!.id;
    const returned = await ReturnedBook.find(filter).populate('bookId').populate('userId').sort({ createdAt: -1 });
    res.json(returned);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/return/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const issued = await IssuedBook.findOne({ _id: req.params.id, status: 'Issued', adminId: req.user!.adminId });
    if (!issued) return res.status(404).json({ message: 'Issued record not found' });
    
    if (req.user!.role === 'user' && issued.userId.toString() !== req.user!.id) {
       return res.status(403).json({ message: 'Unauthorized' });
    }

    const book = await Book.findById(issued.bookId);
    if (book) {
      book.quantity += 1;

      // Auto-issue to first Active reservation
      const activeReservation = await Reservation.findOne({ bookId: book._id, status: 'Active', adminId: req.user!.adminId }).sort({ createdAt: 1 });
      
      if (activeReservation) {
        book.quantity -= 1;
        activeReservation.status = 'Fulfilled';
        await activeReservation.save();

        const newIssued = await IssuedBook.create({
          bookId: book._id,
          userId: activeReservation.userId,
          adminId: activeReservation.adminId,
          dueDate: addDays(new Date(), 14),
          issueFee: 0
        });
      }

      await book.save();
    }

    issued.status = 'Returned';
    await issued.save();

    const returnDate = new Date();
    let fineAmount = 0;
    if (returnDate > issued.dueDate) {
      const lateDays = differenceInDays(returnDate, issued.dueDate);
      fineAmount = lateDays * 5;
    }

    const returnedBook = await ReturnedBook.create({
      bookId: issued.bookId,
      userId: issued.userId,
      adminId: issued.adminId,
      issueDate: issued.issueDate,
      dueDate: issued.dueDate,
      returnDate,
      fineAmount
    });

    if (fineAmount > 0) {
      await Payment.create({
         userId: issued.userId,
         adminId: issued.adminId,
         amount: fineAmount,
         type: 'Fine',
         relatedRecordId: returnedBook._id
      });
    }

    res.json({ message: 'Book returned successfully', returnedBook });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

export default router;
