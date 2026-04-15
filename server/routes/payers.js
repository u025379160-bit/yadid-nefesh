const express = require('express');
const router = express.Router();
const Payer = require('../models/Payer'); // חיבור למודל המשלם

// ==========================================
// --- ראוטר ניהול משלמים ---
// ==========================================

// 1. שליפת כל המשלמים
router.get('/', async (req, res) => {
  try {
    const payers = await Payer.find();
    res.json(payers);
  } catch (error) {
    console.error('שגיאה בשליפת משלמים:', error);
    res.status(500).json({ message: 'שגיאה בשליפת משלמים מהמסד' });
  }
});

// 2. שליפת משלם בודד לפי ID
router.get('/:id', async (req, res) => {
  try {
    const payer = await Payer.findById(req.params.id);
    if (!payer) {
      return res.status(404).json({ message: 'משלם לא נמצא' });
    }
    res.json(payer);
  } catch (error) {
    console.error('שגיאה בשליפת משלם בודד:', error);
    res.status(500).json({ message: 'שגיאה בשליפת המשלם' });
  }
});

// 3. יצירת משלם חדש
router.post('/', async (req, res) => {
  try {
    const newPayer = new Payer(req.body);
    const savedPayer = await newPayer.save();
    res.status(201).json(savedPayer);
  } catch (error) {
    console.error('שגיאה ביצירת משלם:', error);
    res.status(400).json({ message: 'שגיאה ביצירת המשלם', details: error.message });
  }
});

// 4. עדכון משלם קיים (הדלת החדשה שפתחנו!)
router.put('/:id', async (req, res) => {
  try {
    const updatedPayer = await Payer.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } // מחזיר את המשלם המעודכן אחרי השמירה
    );
    
    if (!updatedPayer) {
      return res.status(404).json({ message: 'משלם לא נמצא לעדכון' });
    }
    
    res.json(updatedPayer);
  } catch (error) {
    console.error('שגיאה בעדכון משלם:', error);
    res.status(500).json({ message: 'שגיאת שרת בעדכון המשלם' });
  }
});

// 5. מחיקת משלם
router.delete('/:id', async (req, res) => {
  try {
    const deletedPayer = await Payer.findByIdAndDelete(req.params.id);
    if (!deletedPayer) {
      return res.status(404).json({ message: 'משלם לא נמצא למחיקה' });
    }
    res.json({ message: 'המשלם נמחק בהצלחה' });
  } catch (error) {
    console.error('שגיאה במחיקת משלם:', error);
    res.status(500).json({ message: 'שגיאה במחיקת המשלם' });
  }
});

module.exports = router;