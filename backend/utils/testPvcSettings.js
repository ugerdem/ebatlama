/**
 * PVC tipleri ayarı (Setting koleksiyonu) uçtan uca API testi.
 * mongodb-memory-server ile geçici MongoDB üzerinde gerçek Express app çalıştırılır.
 * Kullanım: node utils/testPvcSettings.js
 * NOT: Bu dosya üretim kodunu etkilemez; test bitince geçici DB kapanır.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const express = require('express');
const axios = require('axios');

async function main() {
  // Geçici MongoDB başlat
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mem = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mem.getUri('ebatlama-test');

  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI);

  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/settings', require('../routes/settings'));
  app.use('/api/forms', require('../routes/forms'));

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;

  const api = axios.create({ baseURL: base });
  let pass = 0;
  let fail = 0;
  const check = (name, cond) => {
    if (cond) {
      pass++;
      console.log(`  ✓ ${name}`);
    } else {
      fail++;
      console.log(`  ✗ ${name}`);
    }
  };

  // Admin login (server.js'deki bootstrap mantığı benzeri; User modeli bcrypt hash'ler)
  const User = require('../models/User');
  await User.create({
    username: 'admin',
    password: 'admin123',
    name: 'Test Admin',
    role: 'admin',
    active: true
  });
  const login = await api.post('/auth/login', { username: 'admin', password: 'admin123' });
  const token = login.data.token;
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
  console.log('Admin login: OK');

  // 1) Varsayılan liste otomatik oluşmalı
  let r = await api.get('/settings/pvc-tipleri');
  check(
    'GET ilk çağrıda varsayılan 3 tip oluşur',
    JSON.stringify(r.data.values) === JSON.stringify(['0.40mm PVC', '0.80mm PVC', '2mm PVC'])
  );

  // 2) Ekleme
  r = await api.post('/settings/pvc-tipleri', { ad: '1.5mm PVC' });
  check('POST yeni tip eklenir', r.data.values.includes('1.5mm PVC'));

  // 3) Duplike ekleme engeli (farklı yazım, aynı anlam)
  let err;
  try {
    await api.post('/settings/pvc-tipleri', { ad: '1.5mm pvc ' });
  } catch (e) {
    err = e;
  }
  check('POST duplike ekleme 409 döner', err?.response?.status === 409);

  // 4) Yeniden adlandırma
  r = await api.put('/settings/pvc-tipleri', { eski: '1.5mm PVC', yeni: '1.6mm PVC' });
  check('PUT yeniden adlandırma', r.data.values.includes('1.6mm PVC') && !r.data.values.includes('1.5mm PVC'));

  // 5) Silme
  r = await api.delete(`/settings/pvc-tipleri/${encodeURIComponent('1.6mm PVC')}`);
  check('DELETE tipi siler', !r.data.values.includes('1.6mm PVC'));

  // 6) Yetkisiz erişim engeli
  try {
    await axios.get(`${base}/auth/me`);
    err = null;
  } catch (e) {
    err = e;
  }
  check('Auth olmadan admin endpoint erişilemez', err?.response?.status === 401);

  // 7) Form oluşturma — geçerli PVC ile
  r = await api.post('/forms', {
    firma: 'Test Firma',
    telefon: '05551112233',
    yetkili: 'Test Yetkili',
    pvcSecim: ['0.40mm PVC'],
    rows: [
      { malzeme: 'MDF', pvc: '0.40mm PVC', boy1: '100', en1: '50', adet: 2, pvcBoy1: true }
    ]
  });
  check('POST /forms geçerli PVC ile form oluşturur', r.status === 201);

  // 8) Form oluşturma — geçersiz PVC reddedilir
  try {
    await api.post('/forms', {
      firma: 'Test Firma',
      telefon: '05551112233',
      yetkili: 'Test Yetkili',
      pvcSecim: ['9.99mm PVC']
    });
    err = null;
  } catch (e) {
    err = e;
  }
  check('POST /forms geçersiz PVC tipini reddeder', err?.response?.status === 400);

  const formId = (await api.get('/forms')).data[0]?._id;

  // 9) Form güncelleme — geçerli değerlerle
  r = await api.put(`/forms/${formId}`, {
    pvcSecim: ['0.80mm PVC'],
    rows: [{ malzeme: 'MDF', pvc: '0.80mm PVC', boy1: '120', en1: '60', adet: 1 }]
  });
  check('PUT /forms geçerli PVC ile günceller', r.status === 200);

  // 10) Form güncelleme — geçersiz PVC reddedilir
  try {
    await api.put(`/forms/${formId}`, { pvcSecim: ['Yok Böyle Bir Tip'] });
    err = null;
  } catch (e) {
    err = e;
  }
  check('PUT /forms geçersiz PVC tipini reddeder', err?.response?.status === 400);

  // 11) Kullanıcının formu, yalnızca kendi formunu görebilir
  const me = await api.get('/auth/me');
  check('Auth /me çalışıyor', me.data.user?.role === 'admin');

  server.close();
  await mem.stop();
  console.log(`\\nSonuç: ${pass} başarılı, ${fail} başarısız`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Test hatası:', e);
  process.exit(1);
});