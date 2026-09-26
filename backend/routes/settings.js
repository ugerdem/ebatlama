const express = require('express');
const Setting = require('../models/Setting');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

const PVC_KEY = 'pvc_tipleri';

function cleanName(v) {
  return String(v == null ? '' : v).trim().replace(/\s+/g, ' ');
}

// GET /api/settings/pvc-tipleri — herkese açık
// (Form giriş ekranı login olmadan kullanıldığı için liste herkes tarafından okunabilir)
router.get('/pvc-tipleri', async (_req, res) => {
  try {
    const doc = await Setting.getWithDefault(PVC_KEY);
    res.json({ key: PVC_KEY, values: doc.values });
  } catch (err) {
    res.status(500).json({ error: 'PVC tipleri alınamadı', detail: err.message });
  }
});

// Aşağıdaki işlemler yalnızca admin
router.use('/pvc-tipleri', authRequired, requireRole('admin'));

// POST /api/settings/pvc-tipleri  { ad } — yeni PVC tipi ekle
router.post('/pvc-tipleri', async (req, res) => {
  try {
    const ad = cleanName(req.body?.ad);
    if (!ad) return res.status(400).json({ error: 'PVC tipi adı zorunlu' });
    if (ad.length > 50) {
      return res.status(400).json({ error: 'PVC tipi adı en fazla 50 karakter olabilir' });
    }

    const doc = await Setting.getWithDefault(PVC_KEY);
    const exists = doc.values.some((v) => v.toLowerCase() === ad.toLowerCase());
    if (exists) {
      return res.status(409).json({ error: 'Bu PVC tipi zaten mevcut' });
    }

    doc.values.push(ad);
    await doc.save();
    res.status(201).json({ message: 'PVC tipi eklendi', values: doc.values });
  } catch (err) {
    res.status(500).json({ error: 'PVC tipi eklenemedi', detail: err.message });
  }
});

// PUT /api/settings/pvc-tipleri  { eski, yeni } — PVC tipini yeniden adlandır
router.put('/pvc-tipleri', async (req, res) => {
  try {
    const eski = cleanName(req.body?.eski);
    const yeni = cleanName(req.body?.yeni);
    if (!eski || !yeni) {
      return res.status(400).json({ error: 'Eski ve yeni ad zorunlu' });
    }
    if (yeni.length > 50) {
      return res.status(400).json({ error: 'PVC tipi adı en fazla 50 karakter olabilir' });
    }

    const doc = await Setting.getWithDefault(PVC_KEY);
    const idx = doc.values.findIndex((v) => v === eski);
    if (idx === -1) {
      return res.status(404).json({ error: 'PVC tipi bulunamadı' });
    }
    const dup = doc.values.some((v, i) => i !== idx && v.toLowerCase() === yeni.toLowerCase());
    if (dup) {
      return res.status(409).json({ error: 'Bu adla başka bir PVC tipi mevcut' });
    }

    doc.values[idx] = yeni;
    await doc.save();

    res.json({
      message:
        'PVC tipi güncellendi. Not: Daha önce girilmiş formlarda eski ad korunur; yeni formlarda yeni ad kullanılır.',
      values: doc.values
    });
  } catch (err) {
    res.status(500).json({ error: 'PVC tipi güncellenemedi', detail: err.message });
  }
});

// DELETE /api/settings/pvc-tipleri/:ad — PVC tipini sil
router.delete('/pvc-tipleri/:ad', async (req, res) => {
  try {
    const ad = cleanName(decodeURIComponent(req.params.ad));
    if (!ad) return res.status(400).json({ error: 'Silinecek PVC tipi belirtilmedi' });

    const doc = await Setting.getWithDefault(PVC_KEY);
    const before = doc.values.length;
    doc.values = doc.values.filter((v) => v !== ad);
    if (doc.values.length === before) {
      return res.status(404).json({ error: 'PVC tipi bulunamadı' });
    }

    await doc.save();

    res.json({
      message:
        'PVC tipi silindi. Not: Bu tipi kullanan eski formlar etkilenmez, ancak yeni form girişlerinde artık seçilemez.',
      values: doc.values
    });
  } catch (err) {
    res.status(500).json({ error: 'PVC tipi silinemedi', detail: err.message });
  }
});

// forms.js gibi diğer route'ların doğrulama için kullanabileceği yardımcı
async function getPvcValues() {
  const doc = await Setting.getWithDefault(PVC_KEY);
  return doc.values;
}

module.exports = router;
module.exports.getPvcValues = getPvcValues;