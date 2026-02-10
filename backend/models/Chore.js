const mongoose = require('mongoose');

const choreSchema = new mongoose.Schema(
  {
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kidId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    rewardAmount: { type: Number, required: true },
    status: { type: String, default: 'assigned', enum: ['assigned', 'pending', 'approved'] },
    escrowSequence: { type: Number },
    escrowCreateTxHash: { type: String },
    escrowFinishTxHash: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chore', choreSchema, 'chores');
