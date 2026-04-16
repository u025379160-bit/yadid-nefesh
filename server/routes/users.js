const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 1. שליפת כל המשתמשים (לצורך ניהול)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // מחזיר הכל חוץ מהסיסמה
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשליפת משתמשים' });
  }
});

// 2. הוספת משתמש חדש
router.post('/', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'האימייל כבר קיים במערכת' });
    res.status(500).json({ message: 'שגיאה ביצירת משתמש' });
  }
});

// 3. עדכון תפקיד או פרטי משתמש
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בעדכון המשתמש' });
  }
});

// 4. מחיקת משתמש
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'המשתמש נמחק' });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה במחיקה' });
  }
});

// ==========================================
// 🔥 5. פונקציית ההתחברות שהייתה חסרה לנו! 🔥
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // מחפשים את המשתמש במסד הנתונים לפי האימייל
    const user = await User.findOne({ email });

    // אם המשתמש לא קיים
    if (!user) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    // בודקים אם הסיסמה תואמת
    if (user.password !== password) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }

    // הכל תקין! מחזירים אישור ואת התפקיד שלו למערכת
    res.json({
      message: 'התחברת בהצלחה',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role // זה המפתח שיפתח לנו את הדלתות באתר!
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'שגיאת שרת בתהליך ההתחברות' });
  }
});

module.exports = router;