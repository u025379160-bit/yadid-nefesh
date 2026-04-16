const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // ==========================================
  // --- שדות קיימים (לשמירה על נתונים ישנים) ---
  // ==========================================
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
    // הוסר ה-required כדי לאפשר משימות לחונכים/שיבוצים
  },
  title: { type: String },
  description: { type: String },
  urgency: { type: String, default: 'רגיל' },
  isCompleted: { type: Boolean, default: false },

  // ==========================================
  // --- שדות חדשים לפי האפיון החדש ---
  // ==========================================
  associatedToType: { 
    type: String, 
    enum: ['student', 'tutor', 'placement'],
    default: 'student' 
  },
  associatedToId: { 
    type: String 
  },
  taskType: { 
    type: String,
    default: 'תיעוד פעילות'
  },
  content: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['published', 'draft'],
    default: 'published' 
  },
  isEncrypted: { 
    type: Boolean, 
    default: false 
  },
  sendSystemAlert: { 
    type: Boolean, 
    default: false 
  },
  sendEmailAlert: { 
    type: Boolean, 
    default: false 
  },
  createdBy: { 
    type: String // שם המשתמש שיצר את המשימה
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Task', taskSchema);