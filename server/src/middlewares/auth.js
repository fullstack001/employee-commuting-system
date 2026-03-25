const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const token = header.slice(7);
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub).populate('unit');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { auth };
