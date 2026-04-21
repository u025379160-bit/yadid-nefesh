const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  // שיוך לחודש ושנה (פורמט מומלץ לשמירה: 'YYYY-MM' כדי שיהיה קל לסנן)
  month: { type: String, required: true }, 
  
  // 🔥 שינוי: המלגה עכשיו משויכת לחונך אחד, ולא משנה כמה שיבוצים יש לו
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  
  // 🔥 תוספת: נשמור פה את רשימת השיבוצים המדויקת שנכללה בחודש הזה (למען התיעוד)
  includedPlacements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Placement' }],

  // סכום הבסיס (המחושב אוטומטית לפני שינויים ידניים)
  // בשעתי: שעות * תעריף | בגלובלי: תעריף קבוע
  baseAmount: { type: Number, required: true },

  // 🔥 תוספת: יתרה נגררת מחודשים קודמים (אם לא לחצו לו על "בוצע" חודש שעבר)
  carriedBalance: { type: Number, default: 0 },

  // שינויים ידניים - נשמר כמערך אובייקטים (JSON) כדי לשמור היסטוריה מלאה
  manualChanges: [{
    amount: { type: Number, required: true }, // סכום השינוי (יכול להיות שלילי עבור הפחתה)
    reason: { type: String, required: true }, // סיבת השינוי (למשל: "היעדרות", "בונוס")
    date: { type: Date, default: Date.now },  // מתי בוצע השינוי
    updatedBy: { type: String }               // מי איש הצוות שביצע את השינוי
  }],

  // סכום סופי לאחר כל השינויים הידניים (מתעדכן אוטומטית בכל פעם שמוסיפים שינוי)
  finalAmount: { type: Number, required: true },

  // רווח למשרד (מחושב לפי האפיון: 20 ש"ח לשעה או 200 ש"ח גלובלי)
  officeProfit: { type: Number, required: true, default: 0 },

  // הסכום נטו שמועבר לחונך (בדרך כלל finalAmount פחות officeProfit)
  tutorAmount: { type: Number, required: true },

  // סטטוס תשלום - האם המלגה שולמה בפועל לחונך
  isPaid: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('Scholarship', scholarshipSchema);