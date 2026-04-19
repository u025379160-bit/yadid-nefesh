process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 

require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Student = require('./models/Student');
const Task = require('./models/Task'); 
const Tutor = require('./models/Tutor'); 
const Placement = require('./models/Placement');

const app = express();
app.use(cors());
app.use(express.json());

// התחברות למונגו
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟢 מחובר בהצלחה למסד הנתונים MongoDB בענן!'))
  .catch((err) => console.log('🔴 שגיאה בחיבור:', err));


// ==========================================
// --- חיבור הראוטרים החיצוניים ---
// ==========================================

// מחבר את הקובץ של המשלמים (שיושב בתיקיית routes) אל השרת הראשי
const payersRouter = require('./routes/payers');
app.use('/api/payers', payersRouter);
// חיבור מודול המשתמשים (הצוות)
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

// ==========================================
// --- ניהול תלמידים ---
// ==========================================

// הוספת תלמיד חדש
app.post('/api/students', async (req, res) => {
  try {
    const newStudent = new Student(req.body); 
    await newStudent.save(); 
    res.status(201).json({ message: '✅ התלמיד נשמר בהצלחה!', student: newStudent });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשמירת התלמיד', details: err.message });
  }
});

// שליפת כל התלמידים
app.get('/api/students', async (req, res) => {
  try {
    const allStudents = await Student.find(); 
    res.status(200).json(allStudents);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת הנתונים מהענן' });
  }
});

// מחיקת תלמיד
app.delete('/api/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id); 
    res.status(200).json({ message: '✅ התלמיד נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה במחיקת תלמיד' });
  }
});

// שליפת תלמיד אחד
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id); 
    if (!student) return res.status(404).json({ error: 'התלמיד לא נמצא' });
    res.status(200).json(student); 
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת התלמיד' });
  }
});

// עדכון תלמיד
app.put('/api/students/:id', async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } 
    );
    if (!updatedStudent) return res.status(404).json({ error: 'התלמיד לא נמצא' });
    res.status(200).json(updatedStudent);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בעדכון התלמיד' });
  }
});

// ==========================================
// --- ניהול משימות ---
// ==========================================

// עדכון משימה קיימת (לעריכה או לסימון כ"בוצע")
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בעדכון משימה' });
  }
});

// הוספת משימה לתלמיד
app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = new Task(req.body);
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה ביצירת המשימה' });
  }
});

// שליפת כל המשימות למסך הניהול הראשי
app.get('/api/tasks', async (req, res) => {
  try {
    const allTasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(allTasks);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת המשימות' });
  }
});

// שליפת משימות של תלמיד
app.get('/api/students/:studentId/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ studentId: req.params.studentId });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת משימות' });
  }
});

// מחיקת משימה
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: '✅ המשימה נמחקה בהצלחה!' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה במחיקת משימה' });
  }
});

// ==========================================
// --- ניהול חונכים ---
// ==========================================

// הוספת חונך חדש
app.post('/api/tutors', async (req, res) => {
  try {
    const newTutor = new Tutor(req.body);
    await newTutor.save();
    res.status(201).json({ message: '✅ החונך נשמר בהצלחה!', tutor: newTutor });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשמירת החונך', details: err.message });
  }
});

// שליפת כל החונכים
app.get('/api/tutors', async (req, res) => {
  try {
    const allTutors = await Tutor.find();
    res.status(200).json(allTutors);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת חונכים' });
  }
});

// שליפת חונך ספציפי
app.get('/api/tutors/:id', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) return res.status(404).json({ error: 'החונך לא נמצא' });
    res.status(200).json(tutor);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת החונך' });
  }
});

// עדכון חונך
app.put('/api/tutors/:id', async (req, res) => {
  try {
    const updatedTutor = await Tutor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTutor) return res.status(404).json({ error: 'החונך לא נמצא' });
    res.status(200).json(updatedTutor);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בעדכון החונך' });
  }
});

// מחיקת חונך
app.delete('/api/tutors/:id', async (req, res) => {
  try {
    await Tutor.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: '✅ החונך נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה במחיקת חונך' });
  }
});

// ==========================================
// --- ניהול שיבוצים ---
// ==========================================

// יצירת שיבוץ חדש
app.post('/api/placements', async (req, res) => {
  try {
    // 🔥 התיקון: מנקים את הנתונים שמגיעים מהאתר כדי לא לשמור בטעות את המשלם או התלמיד מחדש
    const placementData = { ...req.body };
    
    if (placementData.student && placementData.student._id) {
      placementData.student = placementData.student._id;
    }
    if (placementData.tutor && placementData.tutor._id) {
      placementData.tutor = placementData.tutor._id;
    }

    const newPlacement = new Placement(placementData);
    await newPlacement.save();

    // שואבים את הפרטים המלאים של החונך והתלמיד כדי להחזיר לאתר
    const populatedPlacement = await Placement.findById(newPlacement._id).populate('student').populate('tutor');
    res.status(201).json({ message: '✅ השיבוץ נשמר בהצלחה!', placement: populatedPlacement });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה ביצירת השיבוץ', details: err.message });
  }
});

// שליפת כל השיבוצים
app.get('/api/placements', async (req, res) => {
  try {
    // הפקודה populate מחליפה את ה-ID בשמות האמיתיים
    const allPlacements = await Placement.find().populate('student').populate('tutor');
    res.status(200).json(allPlacements);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת שיבוצים' });
  }
});

// מחיקת שיבוץ
app.delete('/api/placements/:id', async (req, res) => {
  try {
    await Placement.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: '✅ השיבוץ נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה במחיקת שיבוץ' });
  }
});

// עדכון שיבוץ
app.put('/api/placements/:id', async (req, res) => {
  try {
    // 🔥 התיקון: אותו פילטר גם כשאנחנו עורכים שיבוץ קיים!
    const placementData = { ...req.body };
    
    if (placementData.student && placementData.student._id) {
      placementData.student = placementData.student._id;
    }
    if (placementData.tutor && placementData.tutor._id) {
      placementData.tutor = placementData.tutor._id;
    }

    const updatedPlacement = await Placement.findByIdAndUpdate(
      req.params.id, 
      placementData, 
      { new: true } 
    )
    .populate('student')
    .populate('tutor');

    if (!updatedPlacement) {
      return res.status(404).json({ message: 'השיבוץ לא נמצא במסד הנתונים' });
    }
    
    res.json(updatedPlacement);
  } catch (error) {
    console.error('שגיאה בעדכון השיבוץ:', error);
    res.status(500).json({ message: 'שגיאת שרת בעדכון השיבוץ' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ השרת רץ על פורט ${PORT}`);
});