const xrpl = require('xrpl');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

const registerParent = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const xrplWallet = xrpl.Wallet.generate();

    const newUser = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'parent',
      xrplAddress: xrplWallet.address,
      xrplSeed: xrplWallet.seed
    });

    await Wallet.create({
      user: newUser._id,
      learning: 0,
      spending: 0,
      xpPoints: 0
    });

    return res.redirect(`/kids/dashboard?userId=${newUser._id}`);
  } catch (error) {
    console.error('registerParent error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      if (req.accepts('html')) {
        return res.status(400).render('login', { error: 'Email and password are required.' });
      }
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      if (req.accepts('html')) {
        return res.status(401).render('login', { error: 'Invalid email or password.' });
      }
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      if (req.accepts('html')) {
        return res.status(401).render('login', { error: 'Invalid email or password.' });
      }
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.redirect(`/kids/dashboard?userId=${user._id}`);
  } catch (error) {
    console.error('loginUser error:', error.message);
    if (req.accepts('html')) {
      return res.status(500).render('login', { error: 'Server error. Please try again.' });
    }
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  registerParent,
  loginUser
};
