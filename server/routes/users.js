const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'סודמאובטח123';

// 1. שליפת כל המשתמשים
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
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

// 3. עדכון משתמש
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

// 5. התחברות — מחזיר token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });

    if (user.password !== password) return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      message: 'התחברת בהצלחה',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'שגיאת שרת בתהליך ההתחברות' });
  }
});

module.exports = router;