process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 

require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs'); 
const path = require('path'); 
const XLSX = require('xlsx');

const Student = require('./models/Student');
const Task = require('./models/Task'); 
const Tutor = require('./models/Tutor'); 
const Placement = require('./models/Placement');
const Scholarship = require('./models/Scholarship'); 
const BillingRecord = require('./models/BillingRecord'); 

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
// --- 🏙️ שליפת ערים ורחובות מקובץ אקסל (הגרסה החסינה) ---
// ==========================================

const EXCEL_FILE_NAME = 'cities.xlsx';

app.get('/api/geo/cities', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', EXCEL_FILE_NAME);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: "קובץ לא נמצא" });

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        const cities = [...new Set(data.map(row => {
            try {
                const firstColumnValue = Object.values(row)[0] || '';
                const line = String(firstColumnValue);
                
                if (line.includes(',')) {
                    const parts = line.split(',');
                    return parts[1] ? parts[1].replace('(יישוב)', '').trim() : null;
                }
                return row['שם_ישוב'] || row['City'] || null;
            } catch (e) { return null; }
        }))].filter(Boolean).sort();

        res.json(cities);
    } catch (err) {
        console.error("Error in Cities Route:", err);
        res.status(500).json({ error: "שגיאה פנימית בשרת" });
    }
});

app.get('/api/geo/streets', (req, res) => {
    const cityName = req.query.city;
    if (!cityName) return res.status(400).json({ error: "חסר שם עיר" });

    try {
        const filePath = path.join(__dirname, 'data', EXCEL_FILE_NAME);
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        const streets = data.map(row => {
            try {
                const firstColumnValue = Object.values(row)[0] || '';
                const line = String(firstColumnValue);
                
                let cityInRow = '';
                let streetName = '';

                if (line.includes(',')) {
                    const parts = line.split(',');
                    cityInRow = parts[1] ? parts[1].replace('(יישוב)', '').trim() : '';
                    streetName = parts[3] ? parts[3].trim() : '';
                } else {
                    cityInRow = (row['שם_ישוב'] || '').replace('(יישוב)', '').trim();
                    streetName = (row['שם_רחוב'] || '').trim();
                }
                
                return cityInRow === cityName ? streetName : null;
            } catch (e) { return null; }
        }).filter(Boolean).sort();

        res.json([...new Set(streets)]);
    } catch (err) {
        console.error("Error in Streets Route:", err);
        res.status(500).json({ error: "שגיאה פנימית" });
    }
});

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
    const students = await Student.find().lean(); 
    
    const Placement = require('./models/Placement');
    const activePlacements = await Placement.find({ status: 'פעיל' }).select('student');
    const activeStudentIds = activePlacements.map(p => p.student.toString());

    const studentsWithStatus = students.map(student => ({
      ...student,
      hasActivePlacement: activeStudentIds.includes(student._id.toString())
    }));

    res.status(200).json(studentsWithStatus);
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
    const student = await Student.findById(req.params.id).populate('payer'); 
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
    ).populate('payer');
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

    const autoTask = new Task({
      title: '🚨 שיבוץ חדש - ממתין להדרכה!',
      taskType: 'הדרכה',
      content: 'נוצר שיבוץ חדש במערכת. חובה לבצע שיחת הדרכה עם החונך ולסמן V בסטטוס השיבוץ.',
      urgency: 'דחוף', 
      placementId: newPlacement._id,
      studentId: newPlacement.student,
      tutorId: newPlacement.tutor,
      assignee: 'צוות רכזים',
      createdBy: 'מערכת אוטומטית'
    });
    await autoTask.save();

    const populatedPlacement = await Placement.findById(newPlacement._id).populate('student').populate('tutor');
    res.status(201).json({ message: '✅ השיבוץ נשמר בהצלחה ומשימת הדרכה הוקפצה!', placement: populatedPlacement });
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
    res.status(500).json({ message: 'שגיאת שרת בעדכון השיבוץ' });
  }
});

// ==========================================
// --- ניהול מלגות (Scholarships) ---
// ==========================================

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
    res.status(500).json({ error: 'שגיאה בשליפת המלגות' });
  }
});

app.post('/api/scholarships/generate', async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(400).json({ error: 'חובה לציין חודש' });

    const existingRecords = await Scholarship.findOne({ month });
    if (existingRecords) {
      return res.status(400).json({ error: 'טבלת המלגות לחודש זה כבר נוצרה' });
    }

    const activePlacements = await Placement.find({ status: 'פעיל' });
    
    if (activePlacements.length === 0) {
      return res.status(200).json({ message: 'אין שיבוצים פעילים', count: 0 });
    }

    const groupedByTutor = {};
    for (const placement of activePlacements) {
      if (!placement.tutor) continue;

      const tutorId = placement.tutor.toString();
      if (!groupedByTutor[tutorId]) {
        groupedByTutor[tutorId] = { placements: [], totalBaseAmount: 0 };
      }
      
      groupedByTutor[tutorId].placements.push(placement._id);
      groupedByTutor[tutorId].totalBaseAmount += (placement.paymentAmount || 0);
    }

    const newScholarships = [];

    for (const tutorId in groupedByTutor) {
      const tutorData = groupedByTutor[tutorId];

      const pastUnpaid = await Scholarship.find({ tutor: tutorId, isPaid: false });
      let carriedBalance = 0;
      if (pastUnpaid.length > 0) {
        carriedBalance = pastUnpaid.reduce((sum, s) => sum + (s.tutorAmount || 0), 0);
      }

      let officeProfit = 200; 

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
    res.status(500).json({ error: 'שגיאה בתהליך החישוב של המלגות' });
  }
});

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

    res.status(200).json({ message: 'סטטוס תשלום עודכן בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בעדכון סטטוס התשלום' });
  }
});

app.put('/api/scholarships/:id', async (req, res) => {
  try {
    const scholarshipToUpdate = await Scholarship.findById(req.params.id);
    if (!scholarshipToUpdate) return res.status(404).json({ error: 'מלגה לא נמצאה' });

    const billingExists = await BillingRecord.findOne({ month: scholarshipToUpdate.month });
    if (billingExists) {
      return res.status(403).json({ 
        error: 'נעול: לא ניתן לשנות מלגה לחודש זה מכיוון שכבר נוצרה עבורו טבלת גבייה.' 
      });
    }

    const updatedScholarship = await Scholarship.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } 
    ).populate('tutor');
    
    res.status(200).json(updatedScholarship);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בעדכון המלגה' });
  }
});

// ==========================================
// --- ניהול חיובים וגבייה (Billing) ---
// ==========================================

app.get('/api/billing', async (req, res) => {
  try {
    const month = req.query.month;
    if (!month) return res.status(400).json({ error: 'חובה לציין חודש' });

    const records = await BillingRecord.find({ month })
      .populate('payer')
      .populate({
        path: 'includedPlacements',
        populate: [
          { path: 'student', select: 'firstName lastName' },
          { path: 'tutor', select: 'firstName lastName' }
        ]
      });

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת נתוני הגבייה' });
  }
});

app.post('/api/billing/generate', async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(400).json({ error: 'חובה לציין חודש' });

    const existingRecords = await BillingRecord.findOne({ month });
    if (existingRecords) {
      return res.status(400).json({ error: 'טבלת הגבייה לחודש זה כבר נוצרה' });
    }

    const activePlacements = await Placement.find({ status: 'פעיל', payer: { $exists: true, $ne: null } });
    if (activePlacements.length === 0) {
      return res.status(200).json({ message: 'אין שיבוצים פעילים עם משלם', count: 0 });
    }

    const groupedByPayer = {};
    for (const placement of activePlacements) {
      const payerId = placement.payer.toString();
      if (!groupedByPayer[payerId]) {
        groupedByPayer[payerId] = { placements: [], totalBaseAmount: 0 };
      }
      
      groupedByPayer[payerId].placements.push(placement._id);
      groupedByPayer[payerId].totalBaseAmount += (placement.paymentAmount || 0);
    }

    const newRecords = [];

    for (const payerId in groupedByPayer) {
      const payerData = groupedByPayer[payerId];

      const pastUnpaid = await BillingRecord.find({ payer: payerId, isPaid: false });
      let carriedBalance = 0;
      if (pastUnpaid.length > 0) {
        carriedBalance = pastUnpaid.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      }

      const totalAmount = payerData.totalBaseAmount + carriedBalance;

      const breakdown = [
        { description: `חיוב בסיס לחודש ${month}`, amount: payerData.totalBaseAmount }
      ];
      if (carriedBalance > 0) {
        breakdown.push({ description: 'יתרת חוב מחודשים קודמים', amount: carriedBalance });
      }

      const newBilling = new BillingRecord({
        month,
        payer: payerId,
        includedPlacements: payerData.placements,
        baseAmount: payerData.totalBaseAmount,
        carriedBalance: carriedBalance,
        totalAmount: totalAmount,
        amountBreakdown: breakdown,
        isPaid: false
      });

      await newBilling.save();
      newRecords.push(newBilling);
    }

    res.status(201).json({ message: 'טבלת הגבייה נוצרה בהצלחה', count: newRecords.length });

  } catch (err) {
    res.status(500).json({ error: 'שגיאה בתהליך יצירת החיובים' });
  }
});

app.put('/api/billing/bulk-pay', async (req, res) => {
  try {
    const { ids, isPaid } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'רשימת מזהים חסרה' });
    }

    await BillingRecord.updateMany(
      { _id: { $in: ids } },
      { $set: { isPaid: isPaid } }
    );

    res.status(200).json({ message: 'סטטוס גבייה עודכן בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בעדכון סטטוס הגבייה' });
  }
});

app.put('/api/billing/:id', async (req, res) => {
  try {
    const updatedBilling = await BillingRecord.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } 
    ).populate('payer');
    
    if (!updatedBilling) return res.status(404).json({ error: 'רשומת חיוב לא נמצאה' });
    res.status(200).json(updatedBilling);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בעדכון החיוב' });
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
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.post('/api/ivr/report-hours', async (req, res) => {
  try {
    const { tutor_id, date, start_time, end_time } = req.body;
    return res.json({
      status: "success",
      message: "Hours saved successfully"
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.post('/api/ivr/scholarship-balance', async (req, res) => {
  try {
    return res.json({
      status: "success",
      balance_to_say: "1500" 
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Server error" });
  }
});
// ==========================================
// --- ניהול הגדרות מערכת ו-Cron Jobs ---
// ==========================================
const Settings = require('./models/Settings');
const cron = require('node-cron');

// שליפת הגדרות
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ guidanceAlertDates: [] });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת הגדרות' });
  }
});

// עדכון הגדרות
app.put('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      settings.guidanceAlertDates = req.body.guidanceAlertDates;
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בעדכון הגדרות' });
  }
});

// 🔥 משימה מתוזמנת: רצה כל יום ב-08:00 בבוקר 🔥
cron.schedule('0 8 * * *', async () => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.guidanceAlertDates || settings.guidanceAlertDates.length === 0) return;

    const today = new Date().toISOString().split('T')[0];

    if (settings.guidanceAlertDates.includes(today)) {
      const activePlacements = await Placement.find({ 
        status: 'פעיל', 
        requireMonthlyGuidance: true 
      });

      for (const placement of activePlacements) {
        placement.guidanceStatus = 'ממתין להדרכה';
        await placement.save();

        const autoTask = new Task({
          title: '🚨 תזכורת חודשית - שיבוץ ממתין להדרכה!',
          taskType: 'הדרכה',
          content: 'חובה לבצע שיחת הדרכה עם החונך ולסמן V בסטטוס השיבוץ.',
          urgency: 'דחוף',
          placementId: placement._id,
          studentId: placement.student,
          tutorId: placement.tutor,
          assignee: 'צוות רכזים',
          createdBy: 'מערכת אוטומטית'
        });
        await autoTask.save();
      }
    }
  } catch (err) {
    console.error('שגיאה ב-Cron Job:', err);
  }
});

app.listen(PORT, () => {
  console.log(`✅ השרת רץ על פורט ${PORT}`);
});