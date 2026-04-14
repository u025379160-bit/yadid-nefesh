const mongoose = require('mongoose');

const payerSchema = new mongoose.Schema({
  // שם המשלם (יכול להיות שם של הורה או שם של ארגון/מוסד)
  name: {
    type: String,
    required: [true, 'שם משלם הוא שדה חובה'],
    trim: true
  },
  // מזהה: תעודת זהות (להורה) או ח.פ/ע.מ (לארגון)
  identifier: {
    type: String,
    required: [true, 'ח.פ / ע.מ / ת.ז הוא שדה חובה'],
    unique: true, // מוודא שלא נכניס בטעות את אותו משלם פעמיים
    trim: true
  },
  // סוג המשלם
  payerType: {
    type: String,
    enum: ['individual', 'organization'], // individual = אדם פרטי, organization = ארגון/עמותה
    default: 'individual'
  },
  // פרטי קשר
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  // אופן תשלום ברירת מחדל
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'cash', 'check', 'standing_order', 'other'],
    default: 'credit_card'
  },
  // הכנה לעתיד: כאן נשמור את האסימון (Token) של נדרים פלוס כדי לחייב אוטומטית בלי להקליד אשראי מחדש
  paymentToken: {
    type: String,
    default: null
  },
  // האם המשלם פעיל או מוקפא?
  isActive: {
    type: Boolean,
    default: true
  },
  // הערות כלליות על המשלם
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // יוסיף אוטומטית תאריך יצירה ותאריך עדכון אחרון
});

module.exports = mongoose.model('Payer', payerSchema);