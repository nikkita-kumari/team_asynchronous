import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: { id: string; role: 'admin' | 'user'; adminId: string };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    // Fallback for older tokens that don't have adminId
    if (decoded.role === 'admin' && !decoded.adminId) {
      decoded.adminId = decoded.id;
    }
    req.user = decoded;

    if (decoded.role === 'user') {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ message: 'User not found' });
      if (user.isBlocked) return res.status(403).json({ message: 'Your account has been blocked by the admin. Please contact your librarian.', isBlocked: true });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};
