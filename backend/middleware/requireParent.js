const User = require('../models/User');

const requireParent = async (req, res, next) => {
  try {
    const userId =
      (req.user && req.user._id) ||
      req.headers['x-user-id'] ||
      req.query.parentId ||
      req.body.parentId;

    if (!userId) {
      return res.status(401).json({ message: 'Parent authentication required.' });
    }

    const parent = await User.findById(userId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({ message: 'Parent access only.' });
    }

    req.user = parent;
    return next();
  } catch (error) {
    console.error('requireParent error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = requireParent;
