const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).populate('unit');
    console.log(user);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken({ sub: user._id.toString(), role: user.role });
    const u = user.toObject();
    delete u.password;
    res.json({
      token,
      user: {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        unit: u.unit,
        isActive: u.isActive,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  const u = req.user.toObject();
  delete u.password;
  res.json(u);
};
