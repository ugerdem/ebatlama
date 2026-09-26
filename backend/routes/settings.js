const express = require('express');
const Setting = require('../models/Setting');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

const PVC_KEY = 'pvc_tipleri';
const MALZEME_KEY = 'malzeme_tipleri';

function cleanName(v) {
  return String(v == null ? '' : v).trim().replace(/\s+/g, ' ');
}

function registerListRoutes({ key, slug, label }) {
  // GET /api/settings/:slug — herkese açık
  // (Form giriş ekranı login olmadan kullanıldığı için liste herkes tarafından okunabilir)
  router.get(`/${slug}`, async (_req, res) => {
    try {
      const doc = await Setting.getWithDefault(key);
      res.json({ key, values: doc.values });
    } catch (err) {
      res.status(500).json({ error: `${label} alınamadı`, detail: err.message });
    }
  });

  // Aşağıdaki işlemler yalnızca admin
  router.use(`/${slug}`, authRequired, requireRole('admin'));

  router.post(`/${slug}`, async (req, res) => {
    try {
      const ad = cleanName(req.body?.ad);
      if (!ad) return res.status(400).json({ error: `${label} adı zorunlu` });
      if (ad.length > 50) {
        return res.status(400).json({ error: `${label} adı en fazla 50 karakter olabilir` });
      }

      const doc = await Setting.getWithDefault(key);
      const exists = doc.values.some((v) => v.toLowerCase() === ad.toLowerCase());
      if (exists) {
        return res.status(409).json({ error: `Bu ${label.toLowerCase()} zaten mevcut` });
      }

      doc.values.push(ad);
      await doc.save();
      res.status(201).json({ message: `${label} eklendi`, values: doc.values });
    } catch (err) {
      res.status(500).json({ error: `${label} eklenemedi`, detail: err.message });
    }
  });

  router.put(`/${slug}`, async (req, res) => {
    try {
      const eski = cleanName(req.body?.eski);
      const yeni = cleanName(req.body?.yeni);
      if (!eski || !yeni) {
        return res.status(400).json({ error: 'Eski ve yeni ad zorunlu' });
      }
      if (yeni.length > 50) {
        return res.status(400).json({ error: `${label} adı en fazla 50 karakter olabilir` });
      }

      const doc = await Setting.getWithDefault(key);
      const idx = doc.values.findIndex((v) => v === eski);
      if (idx === -1) {
        return res.status(404).json({ error: `${label} bulunamadı` });
      }
      const dup = doc.values.some((v, i) => i !== idx && v.toLowerCase() === yeni.toLowerCase());
      if (dup) {
        return res.status(409).json({ error: `Bu adla başka bir ${label.toLowerCase()} mevcut` });
      }

      doc.values[idx] = yeni;
      await doc.save();

      res.json({
        message: `${label} güncellendi. Not: Daha önce girilmiş formlarda eski ad korunur; yeni formlarda yeni ad kullanılır.`,
        values: doc.values
      });
    } catch (err) {
      res.status(500).json({ error: `${label} güncellenemedi`, detail: err.message });
    }
  });

  router.delete(`/${slug}/:ad`, async (req, res) => {
    try {
      const ad = cleanName(decodeURIComponent(req.params.ad));
      if (!ad) return res.status(400).json({ error: `Silinecek ${label.toLowerCase()} belirtilmedi` });

      const doc = await Setting.getWithDefault(key);
      const before = doc.values.length;
      doc.values = doc.values.filter((v) => v !== ad);
      if (doc.values.length === before) {
        return res.status(404).json({ error: `${label} bulunamadı` });
      }

      await doc.save();

      res.json({
        message: `${label} silindi. Not: Bu tipi kullanan eski formlar etkilenmez, ancak yeni form girişlerinde artık seçilemez.`,
        values: doc.values
      });
    } catch (err) {
      res.status(500).json({ error: `${label} silinemedi`, detail: err.message });
    }
  });
}

registerListRoutes({ key: PVC_KEY, slug: 'pvc-tipleri', label: 'PVC tipi' });
registerListRoutes({ key: MALZEME_KEY, slug: 'malzeme-tipleri', label: 'Malzeme tipi' });

// forms.js gibi diğer route'ların doğrulama için kullanabileceği yardımcı
async function getPvcValues() {
  const doc = await Setting.getWithDefault(PVC_KEY);
  return doc.values;
}

async function getMalzemeValues() {
  const doc = await Setting.getWithDefault(MALZEME_KEY);
  return doc.values;
}

module.exports = router;
module.exports.getPvcValues = getPvcValues;
module.exports.getMalzemeValues = getMalzemeValues;