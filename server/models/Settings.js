const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // כאן נשמור את כל התאריכים (הלועזיים) שבהם צריך להקפיץ התראות הדרכה
  guidanceAlertDates: [{ type: String }], // שומרים כמחרוזת בפורמט YYYY-MM-DD
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);