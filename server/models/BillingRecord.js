const mongoose = require('mongoose');

const billingRecordSchema = new mongoose.Schema({
  // חודש ושנה בפורמט 'YYYY-MM'
  month: { type: String, required: true },

  // משלם - מזהה משלם (מרכז את כל החיובים לאותו הורה/מוסד)
  payer: { type: mongoose.Schema.Types.ObjectId, ref: 'Payer', required: true },

  // רשימת השיבוצים שנכללו בחשבון של המשלם לחודש זה
  includedPlacements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Placement' }],

  // סכום הבסיס של החודש הנוכחי (לפני חובות עבר)
  baseAmount: { type: Number, required: true },

  // יתרת חובה שנגררה מחודשים קודמים (אם לא שולם)
  carriedBalance: { type: Number, default: 0 },

  // הסכום הסופי לחיוב (בסיס + חובות עבר)
  totalAmount: { type: Number, required: true },

  // פירוט הסכום - מכיל JSON עם נתונים מאיפה הגענו לסכום הזה
  amountBreakdown: [{
    description: { type: String, required: true }, 
    amount: { type: Number, required: true },
    dateAdded: { type: Date, default: Date.now }
  }],

  // סטטוס - האם הסכום שולם במלואו
  isPaid: { type: Boolean, default: false },

  // מזהה עסקה למערכת סליקה (כמו נדרים פלוס)
  transactionId: { type: String }

}, { timestamps: true });

// אינדקס מעודכן: מונע כפילויות של אותו חיוב לאותו *משלם* באותו חודש
billingRecordSchema.index({ month: 1, payer: 1 }, { unique: true });

module.exports = mongoose.model('BillingRecord', billingRecordSchema);