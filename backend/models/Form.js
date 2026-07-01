const mongoose = require('mongoose');

// Her satır için alt şema: NO, BOY, EN, ADET, BOY2, EN2 (formda iki taraf var)
const rowSchema = new mongoose.Schema(
  {
    malzeme: { type: String, default: '' },
    pvc: { type: String, default: '' }, // seçilen PVC tipi (0.40mm / 0.80mm / 2mm)
    boy1: { type: String, default: '' },
    en1: { type: String, default: '' },
    adet: { type: Number, default: 0 },
    boy2: { type: String, default: '' },
    en2: { type: String, default: '' }
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    formNo: { type: String, required: true, unique: true, index: true },

    // Giriş yapan kullanıcı
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Firma bilgileri (formun üst kısmı)
    firma: { type: String, required: true, trim: true },
    telefon: { type: String, required: true, trim: true },
    yetkili: { type: String, required: true, trim: true },
    adres: { type: String, default: '', trim: true },

    // Tarih (formda gösterilecek)
    formTarihi: { type: Date, default: Date.now },

    // Seçilen PVC tipleri (checkbox/dropdown; birden fazla olabilir)
    pvcSecim: {
      type: [String],
      enum: ['0.40mm PVC', '0.80mm PVC', '2mm PVC'],
      default: []
    },

    // 44 satır (1-22 sol tablo, 23-44 sağ tablo)
    rows: {
      type: [rowSchema],
      default: () => Array.from({ length: 44 }, () => ({}))
    },

    // Durum: ilk girildi -> işleme alındı -> tamamlandı
    durum: {
      type: String,
      enum: ['ilk_girildi', 'isleme_alindi', 'tamamlandi'],
      default: 'ilk_girildi',
      index: true
    },

    // Durum geçmişi
    durumGecmisi: [
      {
        durum: String,
        tarih: { type: Date, default: Date.now },
        aciklama: { type: String, default: '' },
        kullanici: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],

    // Notlar
    notlar: { type: String, default: '' }
  },
  { timestamps: true }
);

// Form listesi için ortak view
formSchema.methods.toListJSON = function () {
  return {
    _id: this._id,
    formNo: this.formNo,
    firma: this.firma,
    telefon: this.telefon,
    yetkili: this.yetkili,
    formTarihi: this.formTarihi,
    durum: this.durum,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Form', formSchema);