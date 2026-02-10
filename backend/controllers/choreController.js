const xrpl = require('xrpl');
const Chore = require('../models/Chore');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

const XRPL_TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

const getRippleTimeSeconds = (minutesFromNow = 1) => {
  const finishAfter = new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
  return xrpl.isoTimeToRippleTime(finishAfter);
};

const ensureFundedAccount = async (client, wallet) => {
  try {
    await client.request({
      command: 'account_info',
      account: wallet.address,
      ledger_index: 'validated'
    });
  } catch (error) {
    if (error?.data?.error === 'actNotFound') {
      await client.fundWallet(wallet);
    } else {
      throw error;
    }
  }
};

const createChore = async (req, res) => {
  const client = new xrpl.Client(XRPL_TESTNET_URL);
  try {
    const { kidId, title, rewardAmount } = req.body;

    if (!kidId || !title || rewardAmount === undefined) {
      return res.status(400).json({ message: 'Kid, title, and reward amount are required.' });
    }

    const amount = Number(rewardAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Reward amount must be a positive number.' });
    }

    const kid = await User.findById(kidId);
    if (!kid || kid.role !== 'kid' || String(kid.parentId) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Kid not found for this parent.' });
    }

    await client.connect();
    const parentWallet = xrpl.Wallet.fromSeed(req.user.xrplSeed);
    await ensureFundedAccount(client, parentWallet);

    const escrowTx = {
      TransactionType: 'EscrowCreate',
      Account: parentWallet.address,
      Destination: kid.xrplAddress,
      Amount: xrpl.xrpToDrops(amount),
      FinishAfter: getRippleTimeSeconds(1)
    };

    const escrowResult = await client.submitAndWait(escrowTx, {
      wallet: parentWallet,
      autofill: true
    });

    const escrowSequence = escrowResult?.result?.tx_json?.Sequence;
    const escrowHash = escrowResult?.result?.hash;

    const chore = await Chore.create({
      parentId: req.user._id,
      kidId: kid._id,
      title,
      rewardAmount: amount,
      status: 'assigned',
      escrowSequence,
      escrowCreateTxHash: escrowHash
    });

    if (req.accepts('html')) {
      return res.redirect(`/kids/dashboard?userId=${req.user._id}`);
    }

    return res.status(201).json({
      message: 'Chore created and escrow funded.',
      choreId: chore._id,
      escrowSequence,
      escrowHash
    });
  } catch (error) {
    console.error('createChore error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
    }
  }
};

const submitChore = async (req, res) => {
  try {
    if (req.user.role !== 'kid') {
      return res.status(403).json({ message: 'Kid access only.' });
    }

    const { choreId } = req.params;
    const chore = await Chore.findById(choreId);
    if (!chore || String(chore.kidId) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Chore not found.' });
    }

    if (chore.status !== 'assigned') {
      return res.status(400).json({ message: 'Chore is not in assignable state.' });
    }

    chore.status = 'pending';
    await chore.save();

    if (req.accepts('html')) {
      return res.redirect(`/kids/dashboard?userId=${req.user._id}`);
    }

    return res.status(200).json({ message: 'Chore submitted for approval.' });
  } catch (error) {
    console.error('submitChore error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

const approveChore = async (req, res) => {
  const client = new xrpl.Client(XRPL_TESTNET_URL);
  try {
    const { choreId } = req.params;
    const chore = await Chore.findById(choreId);
    if (!chore || String(chore.parentId) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Chore not found.' });
    }

    if (!['pending', 'assigned'].includes(chore.status)) {
      return res.status(400).json({ message: 'Chore is not eligible for approval.' });
    }

    const kid = await User.findById(chore.kidId);
    if (kid && kid.isCardFrozen) {
      return res.status(403).json({ message: 'Card is frozen. Unfreeze to release funds.' });
    }

    await client.connect();
    const parentWallet = xrpl.Wallet.fromSeed(req.user.xrplSeed);

    const finishTx = {
      TransactionType: 'EscrowFinish',
      Account: parentWallet.address,
      Owner: parentWallet.address,
      OfferSequence: chore.escrowSequence
    };

    const finishResult = await client.submitAndWait(finishTx, {
      wallet: parentWallet,
      autofill: true
    });

    const finishHash = finishResult?.result?.hash;

    chore.status = 'approved';
    chore.escrowFinishTxHash = finishHash;
    await chore.save();

    const kidWallet = await Wallet.findOne({ user: chore.kidId });
    if (kidWallet) {
      kidWallet.xpPoints += 10;
      if (kidWallet.xpPoints > 50 && kidWallet.level < 2) {
        kidWallet.level = 2;
      }
      await kidWallet.save();
    }

    if (req.accepts('html')) {
      return res.redirect(`/kids/dashboard?userId=${req.user._id}`);
    }

    return res.status(200).json({
      message: 'Chore approved and escrow released.',
      finishHash
    });
  } catch (error) {
    console.error('approveChore error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
    }
  }
};

module.exports = {
  createChore,
  submitChore,
  approveChore
};
