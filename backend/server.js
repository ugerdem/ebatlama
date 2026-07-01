require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const formRoutes = require('./routes/forms');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Vercel'de API olarak çalışırkenmanuel mongoose bağlantısı yerine
// her istekte bağlantı kontrolü yapacağız
let isConnected = false;
let connectPromise = null;
let adminBootstrapPromise = null;

async function ensureBootstrapAdmin() {
  if (adminBootstrapPromise) return adminBootstrapPromise;

  adminBootstrapPromise = (async () => {
    const User = require('./models/User');
    const adminUsername = (process.env.SEED_ADMIN_USERNAME || 'admin').toLowerCase().trim();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.SEED_ADMIN_NAME || 'Sistem Yöneticisi';

    const existing = await User.findOne({ username: adminUsername });
    if (!existing) {
      await User.create({
        username: adminUsername,
        password: adminPassword,
        name: adminName,
        role: 'admin',
        active: true
      });
      console.log(`İlk admin oluşturuldu: ${adminUsername}`);
      return true;
    }

    let changed = false;
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      changed = true;
    }
    if (!existing.active) {
      existing.active = true;
      changed = true;
    }
    if (!existing.name) {
      existing.name = adminName;
      changed = true;
    }

    if (changed) {
      await existing.save();
      console.log(`Admin hesabı güncellendi: ${adminUsername}`);
    }

    return true;
  })()
    .catch((err) => {
      console.error('Admin bootstrap hatası:', err.message);
      return false;
    })
    .finally(() => {
      adminBootstrapPromise = null;
    });

  return adminBootstrapPromise;
}

async function dbConnect() {
  if (isConnected) return true;

  if (connectPromise) return connectPromise;

  const MONGO = process.env.MONGODB_URI;
  if (!MONGO) {
    console.error('MONGODB_URI environment variable is not set!');
    return false;
  }

  connectPromise = mongoose
    .connect(MONGO, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    })
    .then(() => {
      isConnected = true;
      console.log('MongoDB bağlantısı başarılı');
      return ensureBootstrapAdmin();
    })
    .then((adminReady) => {
      if (!adminReady) {
        throw new Error('Admin bootstrap completed with errors');
      }
      return true;
    })
    .catch((err) => {
      console.error('MongoDB bağlantı hatası:', err.message);
      isConnected = false;
      return false;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

// Her API isteğinden önce veritabanı bağlantısını kontrol et
app.use('/api', async (req, res, next) => {
  const connected = await dbConnect();
  if (!connected) {
    return res.status(503).json({
      error: 'Veritabanı bağlantısı kurulamadı',
      detail: 'MONGODB_URI erişimi veya Atlas ağ izinlerini kontrol edin'
    });
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'MEŞE TASARIM Ebatlama API',
    time: new Date().toISOString(),
    dbConnected: isConnected
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı', path: req.originalUrl });
});

// Genel hata yakalayıcı
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Sunucu hatası', detail: err.message });
});

// Vercel export
module.exports = app;

// Yerel geliştirme için sunucu başlat
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  const MONGO = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ebatlama';

  async function start() {
    try {
      await mongoose.connect(MONGO, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });
      isConnected = true;
      console.log('MongoDB bağlantısı başarılı:', MONGO);
      await ensureBootstrapAdmin();

      app.listen(PORT, () => {
        console.log(`API dinleniyor: http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error('Başlatma hatası:', err.message);
      process.exit(1);
    }
  }

  start();
}
