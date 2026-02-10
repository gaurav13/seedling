const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'parent' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    age: { type: Number },
    canUseCrypto: { type: Boolean, default: false },
    hasCard: { type: Boolean, default: false },
    isCardFrozen: { type: Boolean, default: false },
    xrplAddress: { type: String, required: true },
    xrplSeed: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema, 'users');
