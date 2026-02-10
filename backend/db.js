const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://gauravmanu13:RKQU40HdII6auXHW@cluster0.kixmxpm.mongodb.net/kryptokidz_db';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
