const xrpl = require('xrpl');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { decryptSeed } = require('../utils/seedCrypto');

const XRPL_TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

const makeOnlinePurchase = async (req, res) => {
  try {
    if (req.user.role !== 'kid') {
      return res.status(403).json({ message: 'Kid access only.' });
    }

    const kid = await User.findById(req.user._id);
    if (!kid) {
      return res.status(404).json({ message: 'Kid not found.' });
    }

    if (kid.isCardFrozen) {
      return res.status(403).json({ message: 'Card is frozen.' });
    }

    if (kid.age < 10 || kid.age > 12) {
      return res.status(403).json({ message: 'Virtual card is available for ages 10-12 only.' });
    }

    const amount = Number(req.body.amount || 0);
    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount.' });
    }

    const wallet = await Wallet.findOne({ user: kid._id });
    if (!wallet || wallet.spending < amount) {
      return res.status(400).json({ message: 'Insufficient spending balance.' });
    }

    wallet.spending -= amount;
    await wallet.save();

    await Transaction.create({
      userId: kid._id,
      type: 'purchase',
      amount,
      status: 'completed'
    });

    return res.redirect(`/kids/dashboard?userId=${kid._id}#spending`);
  } catch (error) {
    console.error('makeOnlinePurchase error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const sendXrp = async (req, res) => {
  const client = new xrpl.Client(XRPL_TESTNET_URL);
  try {
    if (req.user.role !== 'kid') {
      return res.status(403).json({ message: 'Kid access only.' });
    }

    const kid = await User.findById(req.user._id);
    if (!kid) {
      return res.status(404).json({ message: 'Kid not found.' });
    }

    if (kid.isCardFrozen) {
      return res.status(403).json({ message: 'Card is frozen.' });
    }

    if (!kid.canUseCrypto || kid.age < 13) {
      return res.status(403).json({ message: 'Crypto transfers are available for age 13+ only.' });
    }

    const { toAddress, amount } = req.body;
    const amountNum = Number(amount || 0);
    if (!toAddress || Number.isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: 'Invalid destination or amount.' });
    }

    const wallet = await Wallet.findOne({ user: kid._id });
    if (!wallet || wallet.spending < amountNum) {
      return res.status(400).json({ message: 'Insufficient spending balance.' });
    }

    await client.connect();
    const kidWallet = xrpl.Wallet.fromSeed(decryptSeed(kid.xrplSeed));

    const paymentTx = {
      TransactionType: 'Payment',
      Account: kidWallet.address,
      Destination: toAddress,
      Amount: xrpl.xrpToDrops(amountNum)
    };

    const result = await client.submitAndWait(paymentTx, { wallet: kidWallet, autofill: true });
    const hash = result?.result?.hash;

    wallet.spending -= amountNum;
    await wallet.save();

    await Transaction.create({
      userId: kid._id,
      type: 'send',
      amount: amountNum,
      toAddress,
      status: 'completed',
      txHash: hash
    });

    return res.redirect(`/kids/dashboard?userId=${kid._id}#spending`);
  } catch (error) {
    console.error('sendXrp error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
    }
  }
};

module.exports = {
  makeOnlinePurchase,
  sendXrp
};
