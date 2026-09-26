const mongoose = require('mongoose');

// Genel ayar koleksiyonu: key/value mantığında çalışır.
// PVC tipleri gibi yönetim panelinden düzenlenecek listeler burada tutulur.
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    values: { type: [String], default: [] }
  },
  { timestamps: true }
);

// Anahtarlar için varsayılan değerler (koleksiyon boşsa otomatik oluşur)
settingSchema.statics.DEFAULTS = {
  pvc_tipleri: ['0.40mm PVC', '0.80mm PVC', '2mm PVC'],
  malzeme_tipleri: ['MDFLAM', 'SUNTALAM', 'Masif Panel']
};

// Anahtara göre ayarı getirir; kayıt yoksa varsayılan değerlerle oluşturur.
settingSchema.statics.getWithDefault = async function (key) {
  let doc = await this.findOne({ key });
  if (!doc) {
    doc = await this.findOneAndUpdate(
      { key },
      { $setOnInsert: { key, values: this.DEFAULTS[key] || [] } },
      { new: true, upsert: true }
    );
  }
  return doc;
};

module.exports = mongoose.model('Setting', settingSchema);