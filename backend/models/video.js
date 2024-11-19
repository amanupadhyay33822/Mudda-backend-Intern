const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  originalUrl: { type: String },
  compressedUrl: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Video', videoSchema);
