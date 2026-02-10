const User = require('../models/User');

const requireUser = async (req, res, next) => {
  try {
    const userId =
      (req.user && req.user._id) ||
      req.headers['x-user-id'] ||
      req.query.userId ||
      req.query.parentId ||
      req.query.kidId ||
      req.body.userId ||
      req.body.parentId ||
      req.body.kidId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid user.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error('requireUser error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = requireUser;
