const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // ==========================================
  // --- שדות קיימים (לשמירה על נתונים ישנים) ---
  // ==========================================
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  title: { type: String },
  description: { type: String },
  urgency: { type: String, default: 'רגיל' },
  isCompleted: { type: Boolean, default: false },

  // ==========================================
  // --- שדות חדשים לפי האפיון ---
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
  
  // 🔥 השדות שהוספנו עכשיו בשביל שיבוצים ומשימות אוטומטיות 🔥
  isConfidential: { 
    type: Boolean, 
    default: false 
  },
  tutorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tutor' 
  },
  placementId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Placement' 
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
    type: String 
  },
  assignedTo: { 
    type: String, 
    default: '' // שומר למי המשימה מיועדת לטיפול
  },
  assignee: { 
    type: String // נוסף כדי לתמוך בשם הנמען (למשל "צוות רכזים")
  },

  // ==========================================
  // --- מערך תגובות (שרשור הודעות / "השב") ---
  // ==========================================
  replies: [{
    text: { type: String, required: true },
    author: { type: String, default: 'צוות ניהול' },
    createdAt: { type: Date, default: Date.now }
  }],

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true }); // שומר אוטומטית שדות של תאריך יצירה ותאריך עדכון אחרון

module.exports = mongoose.model('Task', taskSchema);