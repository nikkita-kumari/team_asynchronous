import { Router } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { Book } from '../models/Book.js';
import { BorrowRequest, Reservation, IssuedBook, ReturnedBook } from '../models/Records.js';

const router = Router();

router.get('/recommendations', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== 'user') return res.json([]);

    const [issuedBooks, returnedBooks] = await Promise.all([
      IssuedBook.find({ userId: req.user!.id, adminId: req.user!.adminId }).populate('bookId').lean(),
      ReturnedBook.find({ userId: req.user!.id, adminId: req.user!.adminId }).populate('bookId').lean(),
    ]);

    const previousBooksSet = new Set<string>();
    const history = [];

    for (const item of [...issuedBooks, ...returnedBooks]) {
      const book = item.bookId as any;
      if (book && !previousBooksSet.has(book._id.toString())) {
        previousBooksSet.add(book._id.toString());
        history.push({ title: book.title, category: book.category, author: book.author });
      }
    }

    if (history.length === 0) return res.json([]);

    const allBooks = await Book.find({ adminId: req.user!.adminId }).lean();
    const availableBooks = allBooks.filter(b => !previousBooksSet.has(b._id.toString()));

    if (availableBooks.length === 0) return res.json([]);

    const catalog = availableBooks.map(b => ({
      id: b._id.toString(),
      title: b.title,
      category: b.category,
      author: b.author
    }));

    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are a library recommendation system.
Analyze the user's reading history and the available catalog.
Recommend up to 4 books from the catalog that match the user's interests.

STRICT RULES:
1. ALWAYS prioritize books that match the "category" of books in the reading history. (E.g., if history has "Civil Engineering" books, recommend other "Civil Engineering" books).
2. Give secondary priority to books from the same "author".
3. ONLY select IDs that exist in the Catalog.

Reading History:
${JSON.stringify(history, null, 2)}

Catalog:
${JSON.stringify(catalog, null, 2)}`,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    let responseText = response.text?.trim() || '[]';
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    const recommendedIds = JSON.parse(responseText);
    
    // Fetch the full book objects for those ids
    const recommendedBooks = allBooks.filter(b => recommendedIds.includes(b._id.toString()));
    
    // Add user metrics exactly like the GET / endpoint
    const bookIds = recommendedBooks.map(b => b._id);
    const [requests, reservations, issued] = await Promise.all([
      BorrowRequest.find({ userId: req.user!.id, bookId: { $in: bookIds }, status: 'Pending' }).lean(),
      Reservation.find({ userId: req.user!.id, bookId: { $in: bookIds }, status: { $in: ['Pending', 'Active'] } }).lean(),
      IssuedBook.find({ userId: req.user!.id, bookId: { $in: bookIds }, status: 'Issued' }).lean(),
    ]);

    const requestMap = new Set(requests.map(r => r.bookId.toString()));
    const reservationMap = new Set(reservations.map(r => r.bookId.toString()));
    const issuedMap = new Set(issued.map(r => r.bookId.toString()));

    const enrichedRecommendations = recommendedBooks.map(book => ({
      ...book,
      userRequested: requestMap.has(book._id.toString()),
      userReserved: reservationMap.has(book._id.toString()),
      userIssued: issuedMap.has(book._id.toString()),
    }));

    res.json(enrichedRecommendations);
  } catch (e) {
    console.error('Error generating recommendations:', e);
    res.status(500).json({ message: 'Failed to generate recommendations' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Both admin and user see books for their admin isolated environment
    const books = await Book.find({ adminId: req.user!.adminId }).lean().sort({ createdAt: -1 });

    if (req.user!.role === 'user') {
      const bookIds = books.map(b => b._id);
      
      const [requests, reservations, issued] = await Promise.all([
        BorrowRequest.find({ userId: req.user!.id, bookId: { $in: bookIds }, status: 'Pending' }).lean(),
        Reservation.find({ userId: req.user!.id, bookId: { $in: bookIds }, status: { $in: ['Pending', 'Active'] } }).lean(),
        IssuedBook.find({ userId: req.user!.id, bookId: { $in: bookIds }, status: 'Issued' }).lean(),
      ]);

      const requestMap = new Set(requests.map(r => r.bookId.toString()));
      const reservationMap = new Set(reservations.map(r => r.bookId.toString()));
      const issuedMap = new Set(issued.map(r => r.bookId.toString()));

      const enrichedBooks = books.map(book => ({
        ...book,
        userRequested: requestMap.has(book._id.toString()),
        userReserved: reservationMap.has(book._id.toString()),
        userIssued: issuedMap.has(book._id.toString()),
      }));
      return res.json(enrichedBooks);
    }
    
    res.json(books);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const adminId = req.user!.adminId || req.user!.id;
    const book = await Book.create({ ...req.body, adminId });
    res.json({ message: 'Book added successfully', book });
  } catch (e: any) {
    console.error('Book create error:', e);
    res.status(500).json({ message: e.message || 'Server error' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user!.adminId },
      req.body,
      { new: true }
    );
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book updated successfully', book });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, adminId: req.user!.adminId });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

export default router;
