const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  idNumber: { type: String, required: true, unique: true },
  phone1: { type: String, required: true },
  phone2: { type: String },
  email: { type: String },
  status: { type: String, default: 'פעיל' },
  notes: { type: String },
  
  // השדות החדשים - מותאמים בדיוק לאפיון ול-React
  birthDate: { type: Date }, 
  city: { type: String },
  address: { type: String },
  institute: { type: String }, 
  sector: { type: String },
  languages: { type: String }, 
  interviewedBy: { type: String },
  
  // חשבון בנק מחולק ל-3 שדות נפרדים
  bankAccount: { 
    bankName: { type: String },
    branch: { type: String },
    accountNumber: { type: String }
  },
  
  recommendations: { type: String }
  
}, { timestamps: true });

module.exports = mongoose.model('Tutor', tutorSchema);