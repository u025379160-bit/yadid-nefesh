const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema({
  // קישור אמיתי למודל התלמיד שלנו
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  
  // קישור אמיתי למודל החונך שלנו
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  
  city: { type: String }, // שונה לטקסט
  yeshiva: { type: String }, // שונה לטקסט
  
  beinHazmanimDates: [{
    startDate: { type: Date },
    endDate: { type: Date }
  }],
  
  coordinator: { type: String }, // שונה לטקסט
  placementType: { type: String }, // שונה לטקסט
  
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  
  paymentMethod: { 
    type: String, 
    enum: ['גלובלי', 'שעתי', 'ישן'], 
    required: true 
  },
  
  paymentAmount: { type: Number },
  estimatedMonthlyMeetings: { type: Number },
  studyHours: { type: String },
  
  // משלמים - נשאיר כמערך פשוט של טקסט עד שנבנה טבלת משלמים
  payers: [{
    name: { type: String },
    idNumber: { type: String }
  }],
  
  lastCoordinatorCall: { type: Date },

  status: { type: String, default: 'פעיל', enum: ['פעיל', 'הסתיים'] },

  // 🔥 שדות חדשים למערך ההדרכות (שלב 1) 🔥
  guidanceStatus: { 
    type: String, 
    enum: ['ממתין להדרכה', 'קיבל הדרכה'], 
    default: 'ממתין להדרכה' 
  },
  requireMonthlyGuidance: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.model('Placement', placementSchema);