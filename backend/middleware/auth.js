const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password -otp -otpExpiry');
    if (!req.user) return res.status(401).json({ message: 'User not found' });

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

module.exports = { protect };
