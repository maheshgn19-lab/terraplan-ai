const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['update', 'urgent', 'event', 'reminder'], default: 'update' },
  author: { type: String, required: true },
  date: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);