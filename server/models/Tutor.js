const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  birthDate: { type: Date, required: true },
  phone1: { type: String, required: true },
  phone2: { type: String }, 
  address: { type: String, required: true },
  city: { type: String, required: true }, // שונה לטקסט
  sector: { type: String }, // שונה לטקסט
  email: { type: String },
  idNumber: { type: String, required: true, unique: true }, 
  yeshiva: { type: String, required: true }, // שונה לטקסט
  interviewedBy: { type: String },
  languages: [{ type: String }], // שונה למערך של טקסטים
  recommendations: { type: String }, 
  notes: { type: String },
  bankAccount: { 
    bankName: { type: String },
    branch: { type: String },
    accountNumber: { type: String }
  }
}, { timestamps: true }); 

module.exports = mongoose.model('Tutor', tutorSchema);