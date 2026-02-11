const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    learning: { type: Number, default: 0 },
    spending: { type: Number, default: 0 },
    xpPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    learningLocked: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema, 'wallets');
