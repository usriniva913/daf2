const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sport: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  skillRange: { type: String, default: '3.0-4.0' },
  maxParticipants: { type: Number, default: 6 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['upcoming', 'in_progress', 'completed'], default: 'completed' },
  // Kept for backwards compatibility with existing seeded records.  Rating is
  // tracked per participant in `ratedBy`, rather than once for the whole
  // session, so every player gets an opportunity to submit ratings.
  rated: { type: Boolean, default: false },
  ratedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

sessionSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Session', sessionSchema);
