import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';
import { User } from '../models/User.js';

const router = Router();

router.get('/admins', async (req, res) => {
  try {
    const admins = await Admin.find().select('name email libraryName _id');
    res.json(admins);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/admin/register', async (req, res) => {
  try {
    const { name, email, password, libraryName } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already registered' });
    const admin = await Admin.create({ name, email, password, libraryName });
    res.json({ message: 'Admin created successfully' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid email or password' });
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ id: admin._id, role: 'admin', adminId: admin._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' } });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/user/register', async (req, res) => {
  try {
    const { name, email, password, adminId } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already registered' });
    const user = await User.create({ name, email, password, adminId });
    res.json({ message: 'User created successfully under this admin' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.post('/user/login', async (req, res) => {
  try {
    const { email, password, adminId } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User is not registered' });
    if (user.adminId.toString() !== adminId) return res.status(400).json({ message: 'This user does not belong to the selected admin' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid email or password' });
    if (user.isBlocked) return res.status(403).json({ message: 'Your account has been blocked by the admin. Please contact your librarian.' });
    
    const token = jwt.sign({ id: user._id, role: 'user', adminId: user.adminId }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: 'user', adminId: user.adminId, isDebarred: user.isDebarred } });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

router.get('/me', async (req: any, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      return res.json({ user: { ...admin?.toObject(), role: 'admin' } });
    } else {
      const user = await User.findById(decoded.id).select('-password');
      return res.json({ user: { ...user?.toObject(), role: 'user' } });
    }
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
