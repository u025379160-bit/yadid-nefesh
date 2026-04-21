const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  
  // שדות רגישים שמיועדים להצפנה - כולם מוגדרים כ-String
  birthDate: { type: String, required: true }, 
  idNumber: { type: String, required: true, unique: true }, 
  phone1: { type: String, required: true }, 
  phone2: { type: String }, 
  phone3: { type: String }, 
  email: { type: String }, 
  
  // פרטי משפחה ומגורים
  fatherName: { type: String },
  motherName: { type: String },
  address: { type: String },
  city: { type: String }, 
  zipCode: { type: String }, 
  
  // נתונים נוספים
  contacts: { type: mongoose.Schema.Types.Mixed }, // אידיאלי למערך ה-JSON שבנינו ב-React
  institute: { type: String }, // הותאם לשדה institute ב-React
  payer: { type: mongoose.Schema.Types.ObjectId, ref: 'Payer' },
  relatedDocuments: [{ type: String }] 
  
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);