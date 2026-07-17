import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    console.log('MongoDB connected');
  } catch (error) {
    // This catch used to be a bare `process.exit(1)` with no logging — which is
    // what surfaced as nodemon "app crashed" with no stack trace, masking the
    // real cause (Atlas timeout, bad MONGO_URI, or an IP not allow-listed).
    // Always log the actual error. In production still exit, so the platform
    // restarts the instance; in local dev stay alive, so nodemon doesn't
    // crash-loop and the API keeps serving while the developer fixes the cause.
    console.error('MongoDB connection failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
