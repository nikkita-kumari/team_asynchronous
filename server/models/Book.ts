import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  publisher: { type: String },
  isbn: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  description: { type: String },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }
}, { timestamps: true });

export const Book = (mongoose.models.Book as any) || mongoose.model('Book', bookSchema);
