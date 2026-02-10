const User = require('../models/User');

const toggleFreezeCard = async (req, res) => {
  try {
    const { kidId } = req.params;
    const { frozen } = req.body;

    const kid = await User.findById(kidId);
    if (!kid || kid.role !== 'kid' || String(kid.parentId) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Kid not found for this parent.' });
    }

    kid.isCardFrozen = String(frozen) === 'true';
    await kid.save();

    if (req.accepts('html')) {
      return res.redirect(`/kids/dashboard?userId=${req.user._id}#kids`);
    }

    return res.status(200).json({ message: 'Card status updated.', isCardFrozen: kid.isCardFrozen });
  } catch (error) {
    console.error('toggleFreezeCard error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  toggleFreezeCard
};
