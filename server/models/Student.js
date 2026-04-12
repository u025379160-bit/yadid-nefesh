const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  birthDate: { type: Date, required: true }, // בהמשך נוסיף פה את ההצפנה שביקשת
  idNumber: { type: String, required: true, unique: true }, 
  phone1: { type: String, required: true }, 
  phone2: { type: String }, 
  phone3: { type: String }, 
  email: { type: String }, 
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  zipCode: { type: Number },
  contacts: { type: mongoose.Schema.Types.Mixed }, // שמירת אנשי קשר כ-JSON גמיש
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Yeshiva' },
  relatedDocuments: [{ type: String }] // קישורים לקבצים
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);