const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  
  // שדות רגישים שמיועדים להצפנה - כולם מוגדרים כ-String
  birthDate: { type: String, required: true }, 
  
  // תאריך עברי (נוסף למקרה שנרצה לשמור את ההמרה ולא רק לחשב בתצוגה)
  hebrewBirthDate: { type: String }, 
  
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
  
  // מוסד לימודי (ישמש אותנו לסינון במסך הטבלה הראשי)
  institute: { type: String }, 
  
  // 🆕 מובנה מחדש: טבלת אנשי קשר (סוג, תפקיד, שם, טלפונים)
  contacts: [{
    contactType: { type: String }, // למשל: הורה, חירום, רווחה
    role: { type: String },        // תפקיד (למשל: עובדת סוציאלית)
    name: { type: String },
    phone1: { type: String },
    phone2: { type: String }
  }],
  
  payer: { type: mongoose.Schema.Types.ObjectId, ref: 'Payer' },
  
  // 🆕 מובנה מחדש: מסמכים مقושרים עם מערכת הרשאות/חסיון
  relatedDocuments: [{
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },         // נתיב הקובץ בענן/בשרת
    isConfidential: { type: Boolean, default: false }, // האם חסוי מצפייה של משתמשים מסוג 'רכז'
    uploadedAt: { type: Date, default: Date.now }
  }]
  
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);