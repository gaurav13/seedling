const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { decryptSeed } = require('../utils/seedCrypto');

const getWalletSecret = async (req, res) => {
  try {
    const { userId } = req.params;
    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Allow if same user or parent of kid
    const requesterId = req.user && req.user._id ? String(req.user._id) : null;
    const isSelf = requesterId && requesterId === String(target._id);
    const isParent = requesterId && target.parentId && requesterId === String(target.parentId);

    if (!isSelf && !isParent) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const secret = decryptSeed(target.xrplSeed);
    return res.status(200).json({ secret });
  } catch (error) {
    console.error('getWalletSecret error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const unlockLearningWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const kid = await User.findById(userId);
    if (!kid || kid.role !== 'kid') {
      return res.status(404).json({ message: 'Kid not found.' });
    }

    const requesterId = req.user && req.user._id ? String(req.user._id) : null;
    if (!requesterId || String(kid.parentId) !== requesterId) {
      return res.status(403).json({ message: 'Parent access only.' });
    }

    const wallet = await Wallet.findOne({ user: kid._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found.' });
    }

    wallet.learningLocked = false;
    await wallet.save();

    return res.redirect(`/kids/dashboard?userId=${requesterId}#kids`);
  } catch (error) {
    console.error('unlockLearningWallet error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const moveLearningToSpending = async (req, res) => {
  try {
    const { userId } = req.params;
    const amount = Number(req.body.amount || 0);

    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount.' });
    }

    const kid = await User.findById(userId);
    if (!kid || kid.role !== 'kid') {
      return res.status(404).json({ message: 'Kid not found.' });
    }

    const requesterId = req.user && req.user._id ? String(req.user._id) : null;
    const isParent = requesterId && kid.parentId && requesterId === String(kid.parentId);
    const isSelf = requesterId && requesterId === String(kid._id);

    if (!isParent && !isSelf) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    if (isSelf && kid.age < 18) {
      return res.status(403).json({ message: 'Only 18+ can move learning funds.' });
    }

    const wallet = await Wallet.findOne({ user: kid._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found.' });
    }

    if (wallet.learningLocked !== false) {
      return res.status(403).json({ message: 'Learning wallet is locked.' });
    }

    if (wallet.learning < amount) {
      return res.status(400).json({ message: 'Insufficient learning balance.' });
    }

    wallet.learning -= amount;
    wallet.spending += amount;
    await wallet.save();

    const redirectId = isParent ? requesterId : kid._id;
    return res.redirect(`/kids/dashboard?userId=${redirectId}#spending`);
  } catch (error) {
    console.error('moveLearningToSpending error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getWalletSecret,
  unlockLearningWallet,
  moveLearningToSpending
};
