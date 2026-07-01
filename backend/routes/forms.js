const express = require('express');
const Form = require('../models/Form');
const { authRequired, requireRole } = require('../middleware/auth');
const { generateFormNo } = require('../utils/formNo');

const router = express.Router();

// Tüm route'lar auth ister
router.use(authRequired);

// GET /api/forms  — giriş yapan kullanıcının formları (admin hepsini görür)
router.get('/', async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
    const list = await Form.find(filter).sort({ createdAt: -1 });
    res.json(list.map((f) => f.toListJSON()));
  } catch (err) {
    res.status(500).json({ error: 'Listeleme hatası', detail: err.message });
  }
});

// GET /api/forms/query/:formNo  — herkes kendi formunu sorgulayabilir (formNo ile)
// Bu auth'sız da çalışabilir ama session varsa onun da görmesine izin veriyoruz
router.get('/query/:formNo', async (req, res) => {
  try {
    const form = await Form.findOne({ formNo: req.params.formNo });
    if (!form) return res.status(404).json({ error: 'Form bulunamadı' });

    // Kullanıcı kendi formunu veya admin tüm formları görebilir
    if (
      req.user.role !== 'admin' &&
      form.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Bu formu görme yetkiniz yok' });
    }

    res.json({
      formNo: form.formNo,
      firma: form.firma,
      yetkili: form.yetkili,
      telefon: form.telefon,
      durum: form.durum,
      formTarihi: form.formTarihi,
      durumGecmisi: form.durumGecmisi,
      createdAt: form.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Sorgu hatası', detail: err.message });
  }
});

// GET /api/forms/:id  — form detay
router.get('/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form bulunamadı' });

    if (
      req.user.role !== 'admin' &&
      form.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Bu formu görme yetkiniz yok' });
    }

    res.json(form);
  } catch (err) {
    res.status(500).json({ error: 'Detay hatası', detail: err.message });
  }
});

// POST /api/forms  — yeni form oluştur
router.post('/', async (req, res) => {
  try {
    const { firma, telefon, yetkili, adres, pvcSecim, rows, notlar, formTarihi } = req.body || {};
    if (!firma || !telefon || !yetkili) {
      return res.status(400).json({ error: 'Firma, telefon ve yetkili zorunlu' });
    }

    // rows dizisini 44 satıra tamamla
    const incomingRows = Array.isArray(rows) ? rows : [];
    const fullRows = Array.from({ length: 44 }, (_, i) => {
      const r = incomingRows[i] || {};
      return {
        malzeme: r.malzeme || '',
        pvc: r.pvc || '',
        boy1: r.boy1 != null ? String(r.boy1) : '',
        en1: r.en1 != null ? String(r.en1) : '',
        adet: Number(r.adet) || 0,
        boy2: r.boy2 != null ? String(r.boy2) : '',
        en2: r.en2 != null ? String(r.en2) : ''
      };
    });

    const formNo = await generateFormNo();

    const form = await Form.create({
      formNo,
      createdBy: req.user._id,
      firma,
      telefon,
      yetkili,
      adres: adres || '',
      pvcSecim: Array.isArray(pvcSecim) ? pvcSecim : [],
      rows: fullRows,
      notlar: notlar || '',
      formTarihi: formTarihi ? new Date(formTarihi) : new Date(),
      durum: 'ilk_girildi',
      durumGecmisi: [
        {
          durum: 'ilk_girildi',
          tarih: new Date(),
          aciklama: 'Form oluşturuldu',
          kullanici: req.user._id
        }
      ]
    });

    res.status(201).json({ message: 'Form oluşturuldu', formNo: form.formNo, id: form._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Form numarası çakıştı, tekrar deneyin' });
    }
    res.status(500).json({ error: 'Oluşturma hatası', detail: err.message });
  }
});

// PUT /api/forms/:id  — form güncelle (sadece kendi formu, ve durum henüz tamamlanmamış)
router.put('/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form bulunamadı' });

    if (
      req.user.role !== 'admin' &&
      form.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Bu formu düzenleme yetkiniz yok' });
    }
    if (form.durum === 'tamamlandi') {
      return res.status(400).json({ error: 'Tamamlanmış form düzenlenemez' });
    }

    const { firma, telefon, yetkili, adres, pvcSecim, rows, notlar } = req.body || {};
    if (firma !== undefined) form.firma = firma;
    if (telefon !== undefined) form.telefon = telefon;
    if (yetkili !== undefined) form.yetkili = yetkili;
    if (adres !== undefined) form.adres = adres;
    if (Array.isArray(pvcSecim)) form.pvcSecim = pvcSecim;
    if (Array.isArray(rows)) {
      const incomingRows = rows;
      form.rows = Array.from({ length: 44 }, (_, i) => {
        const r = incomingRows[i] || {};
        return {
          malzeme: r.malzeme || '',
          pvc: r.pvc || '',
          boy1: r.boy1 != null ? String(r.boy1) : '',
          en1: r.en1 != null ? String(r.en1) : '',
          adet: Number(r.adet) || 0,
          boy2: r.boy2 != null ? String(r.boy2) : '',
          en2: r.en2 != null ? String(r.en2) : ''
        };
      });
    }
    if (notlar !== undefined) form.notlar = notlar;

    await form.save();
    res.json({ message: 'Form güncellendi', form });
  } catch (err) {
    res.status(500).json({ error: 'Güncelleme hatası', detail: err.message });
  }
});

// PATCH /api/forms/:id/status  — durum güncelle
router.patch('/:id/status', async (req, res) => {
  try {
    const { durum, aciklama } = req.body || {};
    if (!['ilk_girildi', 'isleme_alindi', 'tamamlandi'].includes(durum)) {
      return res.status(400).json({ error: 'Geçersiz durum' });
    }

    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form bulunamadı' });

    // Yalnızca admin durum güncelleyebilir (form sahibi sadece kendi ilk_girildi → tekrar ilk_girildi yapabilir)
    const isOwner = form.createdBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
    if (req.user.role !== 'admin') {
      // Kullanıcı sadece 'isleme_alindi' veya 'tamamlandi' yapabilir mi? Hayır — bu admin işi.
      return res.status(403).json({ error: 'Durum değişikliği sadece admin tarafından yapılabilir' });
    }

    form.durum = durum;
    form.durumGecmisi.push({
      durum,
      aciklama: aciklama || '',
      kullanici: req.user._id
    });
    await form.save();

    res.json({ message: 'Durum güncellendi', form });
  } catch (err) {
    res.status(500).json({ error: 'Durum güncelleme hatası', detail: err.message });
  }
});

// DELETE /api/forms/:id — yalnızca admin
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await Form.findByIdAndDelete(req.params.id);
    res.json({ message: 'Form silindi' });
  } catch (err) {
    res.status(500).json({ error: 'Silme hatası', detail: err.message });
  }
});

module.exports = router;