// Form numarası üretici: MT-YYYYMMDD-XXXX (günlük sıralı)
// Örnek: MT-20260701-0001

const Counter = require('mongoose').model('Counter');

async function generateFormNo() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}${mm}${dd}`;
  const prefix = `MT-${dateKey}-`;

  const Counter =
    require('mongoose').models.Counter ||
    require('mongoose').model(
      'Counter',
      new require('mongoose').Schema({
        _id: String,
        seq: { type: Number, default: 0 }
      })
    );

  const result = await Counter.findByIdAndUpdate(
    dateKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seq = String(result.seq).padStart(4, '0');
  return `${prefix}${seq}`;
}

module.exports = { generateFormNo };