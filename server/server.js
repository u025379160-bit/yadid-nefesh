process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 

require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Student = require('./models/Student');
const Task = require('./models/Task'); 
const Tutor = require('./models/Tutor'); 
const Placement = require('./models/Placement');
const Scholarship = require('./models/Scholarship'); 

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

const payersRouter = require('./routes/payers');
app.use('/api/payers', payersRouter);

const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

// ==========================================
// --- ניהול תלמידים ---
// ==========================================

app.post('/api/students', async (req, res) => {
  try {
    const newStudent = new Student(req.body); 
    await newStudent.save(); 
    res.status(201).json({ message: '✅ התלמיד נשמר בהצלחה!', student: newStudent });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשמירת התלמיד', details: err.message });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const allStudents = await Student.find(); 
    res.status(200).json(allStudents);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת הנתונים מהענן' });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id); 
    res.status(200).json({ message: '✅ התלמיד נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה במחיקת תלמיד' });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id); 
    if (!student) return res.status(404).json({ error: 'התלמיד לא נמצא' });
    res.status(200).json(student); 
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת התלמיד' });
  }
});

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

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בעדכון משימה' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = new Task(req.body);
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה ביצירת המשימה' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const allTasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(allTasks);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת המשימות' });
  }
});

app.get('/api/students/:studentId/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ studentId: req.params.studentId });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת משימות' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: '✅ המשימה נמחקה בהצלחה!' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה במחיקת משימה' });
  }
});

app.post('/api/tasks/:id/replies', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'המשימה לא נמצאה' });

    const newReply = {
      text: req.body.text,
      author: req.body.author || 'צוות ניהול', 
      createdAt: new Date()
    };

    task.replies.push(newReply);
    await task.save();

    res.status(201).json(task); 
  } catch (err) {
    console.error('שגיאה בהוספת תגובה:', err);
    res.status(500).json({ error: 'שגיאה בשמירת התגובה' });
  }
});

// ==========================================
// --- ניהול חונכים ---
// ==========================================

app.post('/api/tutors', async (req, res) => {
  try {
    const newTutor = new Tutor(req.body);
    await newTutor.save();
    res.status(201).json({ message: '✅ החונך נשמר בהצלחה!', tutor: newTutor });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשמירת החונך', details: err.message });
  }
});

app.get('/api/tutors', async (req, res) => {
  try {
    const allTutors = await Tutor.find();
    res.status(200).json(allTutors);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת חונכים' });
  }
});

app.get('/api/tutors/:id', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) return res.status(404).json({ error: 'החונך לא נמצא' });
    res.status(200).json(tutor);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת החונך' });
  }
});

app.put('/api/tutors/:id', async (req, res) => {
  try {
    const updatedTutor = await Tutor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTutor) return res.status(404).json({ error: 'החונך לא נמצא' });
    res.status(200).json(updatedTutor);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בעדכון החונך' });
  }
});

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

app.post('/api/placements', async (req, res) => {
  try {
    const placementData = { ...req.body };
    
    if (placementData.student && placementData.student._id) {
      placementData.student = placementData.student._id;
    }
    if (placementData.tutor && placementData.tutor._id) {
      placementData.tutor = placementData.tutor._id;
    }

    const newPlacement = new Placement(placementData);
    await newPlacement.save();

    const populatedPlacement = await Placement.findById(newPlacement._id).populate('student').populate('tutor');
    res.status(201).json({ message: '✅ השיבוץ נשמר בהצלחה!', placement: populatedPlacement });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה ביצירת השיבוץ', details: err.message });
  }
});

app.get('/api/placements', async (req, res) => {
  try {
    const allPlacements = await Placement.find().populate('student').populate('tutor');
    res.status(200).json(allPlacements);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת שיבוצים' });
  }
});

app.delete('/api/placements/:id', async (req, res) => {
  try {
    await Placement.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: '✅ השיבוץ נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה במחיקת שיבוץ' });
  }
});

app.put('/api/placements/:id', async (req, res) => {
  try {
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

// ==========================================
// --- ניהול מלגות (Scholarships) ---
// ==========================================

// 1. שליפת מלגות קיימות לחודש המבוקש
app.get('/api/scholarships', async (req, res) => {
  try {
    const month = req.query.month;
    if (!month) return res.status(400).json({ error: 'חובה לציין חודש' });

    const scholarships = await Scholarship.find({ month })
      .populate('tutor')
      .populate({
        path: 'includedPlacements',
        populate: [
          { path: 'student', select: 'firstName lastName' }
        ]
      });

    res.status(200).json(scholarships);
  } catch (err) {
    console.error('שגיאה בשליפת מלגות:', err);
    res.status(500).json({ error: 'שגיאה בשליפת המלגות' });
  }
});

// 2. יצירה יזומה של טבלת מלגות לחודש נבחר (לפי חונך + יתרות עבר)
app.post('/api/scholarships/generate', async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(400).json({ error: 'חובה לציין חודש' });

    // בודקים אם כבר יצרנו טבלה לחודש הזה כדי לא ליצור כפילויות
    const existingRecords = await Scholarship.findOne({ month });
    if (existingRecords) {
      return res.status(400).json({ error: 'טבלת המלגות לחודש זה כבר נוצרה' });
    }

    // שולפים את כל השיבוצים הפעילים
    const activePlacements = await Placement.find({ status: 'פעיל' });
    
    if (activePlacements.length === 0) {
      return res.status(200).json({ message: 'אין שיבוצים פעילים', count: 0 });
    }

    // מקבצים את השיבוצים לפי החונך
    const groupedByTutor = {};
    for (const placement of activePlacements) {
      if (!placement.tutor) continue;

      const tutorId = placement.tutor.toString();
      if (!groupedByTutor[tutorId]) {
        groupedByTutor[tutorId] = {
          placements: [],
          totalBaseAmount: 0
        };
      }
      
      groupedByTutor[tutorId].placements.push(placement._id);
      groupedByTutor[tutorId].totalBaseAmount += (placement.paymentAmount || 0);
    }

    const newScholarships = [];

    // עוברים על כל חונך, מחשבים יתרות ומייצרים רשומת מלגה אחת לחונך
    for (const tutorId in groupedByTutor) {
      const tutorData = groupedByTutor[tutorId];

      // משיכת חובות עבר: מחפשים מלגות קודמות של חונך זה שלא סומנו כ"שולם"
      const pastUnpaid = await Scholarship.find({ tutor: tutorId, isPaid: false });
      let carriedBalance = 0;
      if (pastUnpaid.length > 0) {
        carriedBalance = pastUnpaid.reduce((sum, s) => sum + (s.tutorAmount || 0), 0);
      }

      let officeProfit = 200; // רווח גלובלי למשרד כברירת מחדל

      // חישוב הסכומים: בסיס החודש + חובות עבר
      const totalFinalAmount = tutorData.totalBaseAmount + carriedBalance;
      let tutorAmount = totalFinalAmount - officeProfit;
      if (tutorAmount < 0) tutorAmount = 0;

      const newRecord = new Scholarship({
        month,
        tutor: tutorId,
        includedPlacements: tutorData.placements,
        baseAmount: tutorData.totalBaseAmount,
        carriedBalance: carriedBalance,
        finalAmount: totalFinalAmount,
        officeProfit: officeProfit,
        tutorAmount: tutorAmount,
        isPaid: false
      });

      await newRecord.save();
      newScholarships.push(newRecord);
    }

    res.status(201).json({ message: 'המלגות נוצרו בהצלחה', count: newScholarships.length });

  } catch (err) {
    console.error('שגיאה ביצירת מלגות:', err);
    res.status(500).json({ error: 'שגיאה בתהליך החישוב של המלגות' });
  }
});

// 3. פעולה קבוצתית - סימון כמה מלגות כ"שולם" במכה אחת
app.put('/api/scholarships/bulk-pay', async (req, res) => {
  try {
    const { ids, isPaid } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'רשימת מזהים חסרה' });
    }

    await Scholarship.updateMany(
      { _id: { $in: ids } },
      { $set: { isPaid: isPaid } }
    );

    res.status(200).json({ message: 'סטטוס תשלום עודכן בהצלחה לכל הרשומות המסומנות' });
  } catch (err) {
    console.error('שגיאה בעדכון קבוצתי:', err);
    res.status(500).json({ error: 'שגיאה בעדכון סטטוס התשלום' });
  }
});

// 4. עדכון מלגה בודדת (שינויים ידניים, או סטטוס שולם לשורה בודדת)
app.put('/api/scholarships/:id', async (req, res) => {
  try {
    const updatedScholarship = await Scholarship.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } 
    ).populate('tutor');
    
    if (!updatedScholarship) return res.status(404).json({ error: 'מלגה לא נמצאה' });
    res.status(200).json(updatedScholarship);
  } catch (err) {
    console.error('שגיאה בעדכון מלגה:', err);
    res.status(500).json({ error: 'שגיאה בעדכון המלגה' });
  }
});


// ==========================================
// --- ניהול חיובים וגבייה (Billing) ---
// ==========================================

const BillingRecord = require('./models/BillingRecord');

// שליפה ויצירה אוטומטית של טבלת גבייה חודשית
app.get('/api/billing', async (req, res) => {
  try {
    const month = req.query.month; // החודש המבוקש (למשל: "2026-04")
    if (!month) return res.status(400).json({ error: 'חובה לציין חודש' });

    // 1. בודקים אם כבר נוצרה טבלת גבייה לחודש הזה
    let records = await BillingRecord.find({ month })
      .populate({
        path: 'placement',
        populate: [
          { path: 'student', select: 'firstName lastName' },
          { path: 'tutor', select: 'firstName lastName' }
        ]
      })
      .populate('payer'); 

    // 2. אם כבר יש חיובים לחודש הזה, מחזירים אותם ל-React
    if (records.length > 0) {
      return res.status(200).json(records);
    }

    // 3. אם אין - הגיע הזמן לייצר אותם!
    // שולפים את כל השיבוצים הפעילים שיש להם משלם מוגדר
    const activePlacements = await Placement.find({ status: 'פעיל', payer: { $exists: true, $ne: null } });

    if (activePlacements.length === 0) {
      return res.status(200).json([]); // אין שיבוצים פעילים עם משלם
    }

    const newRecords = [];

    for (const placement of activePlacements) {
      // שואבים את סכום הבסיס של השיבוץ
      const baseAmount = placement.paymentAmount || 0;
      
      // כאן מכינים את פירוט החיוב (ה-JSON שהוגדר באפיון)
      const breakdown = [
        { description: `חיוב בסיס לחודש ${month}`, amount: baseAmount }
      ];

      // יוצרים את רשומת החיוב החדשה
      const newBilling = new BillingRecord({
        month,
        placement: placement._id,
        payer: placement.payer,
        totalAmount: baseAmount, // בשלב הבא נוכל להוסיף לכאן יתרות עבר
        amountBreakdown: breakdown,
        isPaid: false
      });

      await newBilling.save();
      newRecords.push(newBilling);
    }

    // 4. אחרי שיצרנו הכל, שולפים שוב עם כל השמות (Populate) ומחזירים למסך
    records = await BillingRecord.find({ month })
      .populate({
        path: 'placement',
        populate: [
          { path: 'student', select: 'firstName lastName' },
          { path: 'tutor', select: 'firstName lastName' }
        ]
      })
      .populate('payer');

    res.status(201).json(records);

  } catch (err) {
    console.error('שגיאה ביצירת תהליך הגבייה:', err);
    res.status(500).json({ error: 'שגיאה בתהליך יצירת החיובים' });
  }
});
const PORT = process.env.PORT || 5000;
// ==============================================================
// 📞 מערכת הטלפוניה (IVR - קול כשר) 📞
// ==============================================================

app.post('/api/ivr/auth', async (req, res) => {
  try {
    const { tutor_id } = req.body;
    
    const Tutor = require('./models/Tutor'); 
    const tutor = await Tutor.findOne({ idNumber: tutor_id, status: 'פעיל' });

    if (tutor) {
      return res.json({
        status: "success",
        message: "Authorized",
        tutor_name: `${tutor.firstName} ${tutor.lastName}`
      });
    } else {
      return res.json({
        status: "error",
        message: "Tutor not found"
      });
    }
  } catch (error) {
    console.error("IVR Auth Error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.post('/api/ivr/report-hours', async (req, res) => {
  try {
    const { tutor_id, date, start_time, end_time } = req.body;
    
    console.log(`התקבל דיווח שעות מחונך ${tutor_id}: מ-${start_time} עד ${end_time}`);

    return res.json({
      status: "success",
      message: "Hours saved successfully"
    });
  } catch (error) {
    console.error("IVR Report Error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.post('/api/ivr/scholarship-balance', async (req, res) => {
  try {
    const { tutor_id } = req.body;
    
    return res.json({
      status: "success",
      balance_to_say: "1500" 
    });
  } catch (error) {
    console.error("IVR Balance Error:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ השרת רץ על פורט ${PORT}`);
});