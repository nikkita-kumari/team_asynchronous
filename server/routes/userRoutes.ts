import { Router } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Admin } from '../models/Admin.js';

const router = Router();

// Add user
router.put('/:id/debar', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { isDebarred } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user!.adminId },
      { isDebarred },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `User borrowing ${isDebarred ? 'debarred' : 'allowed'} successfully` });
  } catch (e: any) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const adminId = req.user!.adminId || req.user!.id;
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already registered' });
    const user = await User.create({ name, email, password, adminId });
    res.json({ message: 'User created successfully', user });
  } catch (e: any) { 
    console.error('User create error:', e);
    res.status(500).json({ message: e.message || 'Server error' }); 
  }
});

// Get users under admin
router.get('/', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const adminId = req.user!.adminId || req.user!.id;
    const users = await User.find({ adminId }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/debarred', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const adminId = req.user!.adminId;
    const users = await User.find({ adminId, isDebarred: true }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// Block/Unblock user
router.put('/:id/block', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { isBlocked } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user!.adminId },
      { isBlocked, blockedAt: isBlocked ? new Date() : null },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`, user });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.delete('/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, adminId: req.user!.adminId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User removed successfully' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

export default router;
