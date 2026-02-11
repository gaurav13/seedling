const xrpl = require('xrpl');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Chore = require('../models/Chore');
const Transaction = require('../models/Transaction');
const { encryptSeed } = require('../utils/seedCrypto');

const XRPL_TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';
const XRPL_EXPLORER_BASE = 'https://test.bithomp.com/explorer';

const getXrpBalanceSafe = async (client, address) => {
  try {
    const balance = await client.getXrpBalance(address);
    return Number(balance);
  } catch (error) {
    return 0;
  }
};

const createKidProfile = async (req, res) => {
  try {
    const { name, email, age, pin } = req.body;

    if (!name || !email || age === undefined || !pin) {
      return res.status(400).json({ message: 'Kid name, email, age, and PIN are required.' });
    }

    if (!/^[0-9]{4}$/.test(String(pin))) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits.' });
    }

    const kidAge = Number(age);
    if (Number.isNaN(kidAge) || kidAge < 0) {
      return res.status(400).json({ message: 'Please provide a valid age.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    let canUseCrypto = false;
    let hasCard = false;
    if (kidAge < 10) {
      canUseCrypto = false;
      hasCard = false;
    } else if (kidAge >= 10 && kidAge <= 12) {
      canUseCrypto = false;
      hasCard = true;
    } else if (kidAge >= 13) {
      canUseCrypto = true;
      hasCard = true;
    }

    const xrplWallet = xrpl.Wallet.generate();
    const client = new xrpl.Client(XRPL_TESTNET_URL);
    await client.connect();
    await client.fundWallet(xrplWallet);
    await client.disconnect();
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    const pinHash = await bcrypt.hash(String(pin), 10);

    const kid = await User.create({
      fullName: name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'kid',
      parentId: req.user._id,
      age: kidAge,
      canUseCrypto,
      hasCard,
      xrplAddress: xrplWallet.address,
      xrplSeed: encryptSeed(xrplWallet.seed),
      pinHash
    });

    await Wallet.create({
      user: kid._id,
      learning: 0,
      spending: 0,
      xpPoints: 0
    });

    if (req.accepts('html')) {
      return res.redirect(`/kids/dashboard?parentId=${req.user._id}`);
    }

    return res.status(201).json({
      message: 'Kid profile created successfully.',
      kidId: kid._id
    });
  } catch (error) {
    console.error('createKidProfile error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const renderDashboard = async (req, res) => {
  try {
    let kids = [];
    let pendingChores = [];
    let assignedChores = [];
    let approvedChores = [];
    let wallet = null;
    let ledgerActivity = [];
    let spendingTransactions = [];

    if (req.user.role === 'parent') {
      kids = await User.find({ parentId: req.user._id, role: 'kid' }).sort({ createdAt: -1 });
      assignedChores = await Chore.find({ parentId: req.user._id, status: 'assigned' })
        .populate('kidId', 'fullName')
        .sort({ createdAt: -1 });
      pendingChores = await Chore.find({ parentId: req.user._id, status: 'pending' })
        .populate('kidId', 'fullName')
        .sort({ createdAt: -1 });
      approvedChores = await Chore.find({ parentId: req.user._id, status: 'approved' })
        .populate('kidId', 'fullName')
        .sort({ createdAt: -1 });
      const client = new xrpl.Client(XRPL_TESTNET_URL);
      await client.connect();
      const parentBalance = await getXrpBalanceSafe(client, req.user.xrplAddress);
      let kidsBalanceTotal = 0;
      const kidsBalances = [];
      const kidIds = kids.map((kid) => kid._id);
      const walletDocs = kidIds.length
        ? await Wallet.find({ user: { $in: kidIds } })
        : [];
      const kidWallets = walletDocs.reduce((acc, w) => {
        acc[String(w.user)] = w;
        return acc;
      }, {});
      for (const kid of kids) {
        const balance = await getXrpBalanceSafe(client, kid.xrplAddress);
        kidsBalanceTotal += balance;
        kidsBalances.push({
          id: kid._id,
          name: kid.fullName,
          balance,
          explorer: `${XRPL_EXPLORER_BASE}/${kid.xrplAddress}`
        });
      }
      await client.disconnect();

      wallet = {
        parentBalance,
        kidsBalanceTotal,
        totalFamilyBalance: parentBalance + kidsBalanceTotal,
        totalPending: pendingChores.length,
        parentExplorer: `${XRPL_EXPLORER_BASE}/${req.user.xrplAddress}`,
        kidsExplorer: kids.length ? `${XRPL_EXPLORER_BASE}/${kids[0].xrplAddress}` : null,
        kidsBalances
      };
      ledgerActivity = approvedChores.slice(0, 6);
      wallet.kidWallets = kidWallets;
    } else if (req.user.role === 'kid') {
      assignedChores = await Chore.find({ kidId: req.user._id, status: 'assigned' })
        .populate('parentId', 'fullName')
        .sort({ createdAt: -1 });
      approvedChores = await Chore.find({ kidId: req.user._id, status: 'approved' })
        .populate('parentId', 'fullName')
        .sort({ createdAt: -1 });
      ledgerActivity = approvedChores.slice(0, 6);
      wallet = await Wallet.findOne({ user: req.user._id });
      if (wallet && typeof wallet.learningLocked === 'undefined') {
        wallet.learningLocked = true;
        await wallet.save();
      }
      if (wallet && req.user.age >= 18 && wallet.learningLocked) {
        wallet.learningLocked = false;
        await wallet.save();
      }
      spendingTransactions = await Transaction.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(8);
    }

    return res.render('dashboard', {
      user: req.user,
      kids,
      pendingChores,
      assignedChores,
      approvedChores,
      wallet,
      ledgerActivity,
      spendingTransactions,
      notice: req.query.notice || null
    });
  } catch (error) {
    console.error('renderDashboard error:', error.message);
    return res.status(500).send('Server error.');
  }
};

module.exports = {
  createKidProfile,
  renderDashboard
};
