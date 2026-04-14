const express = require('express');
const router = express.Router();
const Payer = require('../models/Payer'); // מייבא את המודל שיצרנו

// שליפת כל המשלמים
router.get('/', async (req, res) => {
  try {
    const payers = await Payer.find().sort({ createdAt: -1 });
    res.json(payers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// יצירת משלם חדש
router.post('/', async (req, res) => {
  const payer = new Payer({
    name: req.body.name,
    identifier: req.body.identifier,
    payerType: req.body.payerType,
    phone: req.body.phone,
    email: req.body.email,
    paymentMethod: req.body.paymentMethod
  });

  try {
    const newPayer = await payer.save();
    res.status(201).json(newPayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// מחיקת משלם (רק אם הוא קיים)
router.delete('/:id', async (req, res) => {
  try {
    const payer = await Payer.findById(req.params.id);
    if (!payer) return res.status(404).json({ message: 'משלם לא נמצא' });
    
    await payer.deleteOne();
    res.json({ message: 'משלם נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;