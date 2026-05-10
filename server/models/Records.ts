import mongoose from 'mongoose';

const borrowRequestSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
}, { timestamps: true });
export const BorrowRequest = (mongoose.models.BorrowRequest as any) || mongoose.model('BorrowRequest', borrowRequestSchema);

const issuedBookSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Issued', 'Returned'], default: 'Issued' },
  issueFee: { type: Number, default: 0 }
}, { timestamps: true });
export const IssuedBook = (mongoose.models.IssuedBook as any) || mongoose.model('IssuedBook', issuedBookSchema);

const returnedBookSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  issueDate: { type: Date, required: true },
  returnDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  fineAmount: { type: Number, default: 0 }
}, { timestamps: true });
export const ReturnedBook = (mongoose.models.ReturnedBook as any) || mongoose.model('ReturnedBook', returnedBookSchema);

const reservationSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  status: { type: String, enum: ['Pending', 'Active', 'Fulfilled', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });
export const Reservation = (mongoose.models.Reservation as any) || mongoose.model('Reservation', reservationSchema);

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Issue Fee', 'Fine'], required: true },
  status: { type: String, enum: ['Pending', 'Awaiting Verification', 'Paid', 'Rejected'], default: 'Pending' },
  relatedRecordId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });
export const Payment = (mongoose.models.Payment as any) || mongoose.model('Payment', paymentSchema);
