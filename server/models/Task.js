const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // השדה הכי חשוב: למי שייכת המשימה! שומר את ה-ID של התלמיד
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student', // אומר למונגו שזה ID שמצביע לתלמיד
    required: true
  },
  // כותרת המשימה (למשל: "שיחת מעקב")
  title: {
    type: String,
    required: true
  },
  // פירוט קצר
  description: {
    type: String
  },
  // רמת דחיפות (למשל: רגיל, דחוף, השבוע)
  urgency: {
    type: String,
    default: 'רגיל'
  },
  // האם המשימה בוצעה?
  isCompleted: {
    type: Boolean,
    default: false
  },
  // מתי יצרנו אותה?
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', taskSchema);