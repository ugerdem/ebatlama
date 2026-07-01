const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const jwtSecret = process.env.JWT_SECRET?.trim();
    if (!jwtSecret) {
      return res.status(503).json({
        error: 'JWT secret yapılandırılmamış',
        detail: 'JWT_SECRET environment variable is not set'
      });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı veya pasif' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Hatalı şifre' });

    // Legacy düz metin şifreyi ilk başarılı girişte bcrypt'e yükselt
    if (typeof user.password === 'string' && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$') && !user.password.startsWith('$2y$')) {
      user.password = password;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası', detail: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

module.exports = router;