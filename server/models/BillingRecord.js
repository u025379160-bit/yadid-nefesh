const mongoose = require('mongoose');

const billingRecordSchema = new mongoose.Schema({
  // תאריך - שדה תאריך לשמירת חודש ושנה (נשמור בפורמט 'YYYY-MM')
  month: { type: String, required: true },

  // שיבוץ - מזהה השיבוץ
  placement: { type: mongoose.Schema.Types.ObjectId, ref: 'Placement', required: true },

  // משלם - מזהה משלם
  payer: { type: mongoose.Schema.Types.ObjectId, ref: 'Payer', required: true },

  // סכום - נשאב מטבלת מלגות של אותו חודש + יתרה/חוסר מחודש קודם
  totalAmount: { type: Number, required: true },

  // פירוט הסכום - מכיל JSON עם נתונים מאיפה הגענו לסכום הזה
  amountBreakdown: [{
    description: { type: String, required: true }, // למשל: "חיוב בסיס חודש 04", "חוב עבר", "קיזוז"
    amount: { type: Number, required: true },
    dateAdded: { type: Date, default: Date.now }
  }],

  // סטטוס - האם הסכום שולם
  isPaid: { type: Boolean, default: false }

}, { timestamps: true });

// אינדקס כדי למנוע כפילויות של אותו חיוב לאותו שיבוץ באותו חודש
billingRecordSchema.index({ month: 1, placement: 1 }, { unique: true });

module.exports = mongoose.model('BillingRecord', billingRecordSchema);