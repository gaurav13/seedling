const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    toAddress: { type: String },
    status: { type: String, default: 'completed' },
    txHash: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema, 'transactions');
