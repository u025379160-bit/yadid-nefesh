const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // בהמשך נלמד להצפין אותה
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'secretary', 'coordinator', 'tutor'], 
    default: 'tutor' 
  },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);