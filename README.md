# MEŞE TASARIM — Ebatlama & Form Yönetim Sistemi

React.js + Node.js (Express) + MongoDB ile geliştirilmiş, fason işleme merkezi için
ebat/form girişi, durum takibi, PDF/Excel export yapılabilen login tabanlı bir uygulama.

## Özellikler

- **Kayıt yok** — Kullanıcı adı / şifre ile giriş (admin tarafından açılır)
- **Firma + Ebat tek formda** — 44 satırlık malzeme tablosu (boy, en, adet, PVC tipi)
- **Otomatik form numarası** — `MT-YYYYMMDD-XXXX` formatında günlük sıralı
- **Form listesi** — Firma, telefon, yetkili, giriş tarihi, durum kolonları
- **Durum yönetimi** — İlk Girildi → İşleme Alındı → Tamamlandı (admin kontrolünde)
- **Form sorgulama** — Form No ile durum görüntüleme
- **PDF çıktı** — Tarayıcı üzerinden A4 PDF yazdırma
- **Excel export** — Hem tek form hem de liste için `.xlsx` indirme
- **A4 form çıktısı** — MEŞE TASARIM başlıklı, logolu, iletişim bilgili baskı şablonu

## Proje Yapısı

```
Ebatlama/
├── backend/         # Express + Mongoose API
│   ├── server.js
│   ├── models/      # User, Form
│   ├── routes/      # auth, forms
│   ├── middleware/  # JWT doğrulama
│   └── utils/       # form numarası üretici
└── frontend/        # React (CRA) uygulaması
    ├── public/
    └── src/
        ├── components/   # Login, FormList, FormEntry, FormDetail, FormQuery, FormPrint
        ├── utils/        # api, excel, helpers
        └── styles/       # index.css
```

## Kurulum

### 1) MongoDB

Local MongoDB kurulumu:

```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Veya MongoDB Atlas bağlantı string'i kullanacaksanız `backend/.env` içindeki
`MONGODB_URI` değerini Atlas'tan aldığınız URI ile değiştirin.

### 2) Backend

```bash
cd backend
cp .env.example .env       # gerekirse düzenle
npm install
npm start
```

İlk çalıştırmada `.env` içinde tanımlı `admin / admin123` kullanıcısı otomatik
oluşturulur.

> API: `http://localhost:5000`

### 3) Frontend

```bash
cd frontend
npm install
npm start
```

> Web: `http://localhost:3000`

Frontend `package.json`'daki `proxy` ile backend'e otomatik yönlenir.

## İlk Kullanım

1. `http://localhost:3000/login` adresine gidin
2. `admin` / `admin123` ile giriş yapın
3. Sol menüden **Yeni Form** → Firma bilgilerini girip **Tabloyu Aç / Düzenle** ile
   44 satırlık ebat tablosunu doldurun
4. **Formu Kaydet** → Sistem otomatik Form No üretir (örn. `MT-20260701-0001`)
5. Listeden forma tıklayıp:
   - **Yazdır / PDF** → Tarayıcı print → "PDF olarak kaydet" (A4)
   - **Excel İndir** → `.xlsx`
   - Admin iseniz **Durum Güncelle** ile formu ilerletin
6. **Form Sorgula** sayfasından Form No ile durumu görüntüleyin

## Kullanıcı Yönetimi

Şu an tek bir admin seed kullanıcısı var. Yeni kullanıcı eklemek için MongoDB'ye
doğrudan bir kayıt ekleyebilir veya küçük bir kullanıcı yönetim ekranı eklenebilir
(admin için bir sonraki iterasyon).

MongoDB üzerinden hızlı kullanıcı eklemek için:

```bash
mongosh ebatlama
db.users.insertOne({
  username: "kullanici1",
  // bcrypt hash: aşağıdaki komutu node ile üretin
  password: "<bcrypt-hash>",
  name: "Ahmet Yılmaz",
  role: "user",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Bcrypt hash üretmek için backend klasöründe:

```bash
node -e "console.log(require('bcryptjs').hashSync('sifre123', 10))"
```

## API Özeti

| Method | Path | Açıklama |
| --- | --- | --- |
| POST | /api/auth/login | Giriş |
| GET  | /api/auth/me | Oturum bilgisi |
| GET  | /api/forms | Formları listele |
| POST | /api/forms | Yeni form |
| GET  | /api/forms/:id | Form detayı |
| PUT  | /api/forms/:id | Form güncelle |
| PATCH| /api/forms/:id/status | Durum güncelle (admin) |
| GET  | /api/forms/query/:formNo | Form No ile sorgula |
| DELETE | /api/forms/:id | Form sil (admin) |

Tüm endpoint'ler `Authorization: Bearer <jwt>` header'ı ister (`/login` hariç).

## Teknik Notlar

- **Frontend**: React 18, react-router-dom v6, axios, xlsx
- **Backend**: Express 4, Mongoose 8, JWT auth, bcrypt
- **PDF**: Tarayıcı print API (A4 boyut, özelleştirilmiş CSS print media query)
- **Excel**: SheetJS (xlsx) — istemci tarafında üretim
- **Form No**: Günlük artan sayaç (Counter collection)

## Yazdırma İpuçları

Tarayıcı print dialog'unda:
- **Hedef**: PDF olarak kaydet
- **Kenar boşluğu**: Yok / Özel
- **Ölçek**: %100
- **Arka plan grafikleri**: Açık (logo renkleri için gerekli)

Chrome: Ayarlar → Yazdırma → "Arka plan grafiklerini yazdır" seçeneğini açın.

---

## Vercel Deploy

### 1) MongoDB Atlas Kurulumu

Vercel'de deploy etmek için MongoDB veritabanınızın bulut olması gerekir. MongoDB Atlas'tan ücretsiz hesap oluşturun:

1. https://www.mongodb.com/atlas adresinden kayıt olun
2. Free Tier (M0) cluster oluşturun
3. Database Access'ten kullanıcı oluşturun (kullanıcı adı ve şifre belirleyin)
4. Network Access'ten IP adresinizi ekleyin (tüm IP'ler için `0.0.0.0/0` da ekleyebilirsiniz)
5. Connect Your Application'dan connection string'i kopyalayın:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ebatlama?retryWrites=true&w=majority
   ```

### 2) Vercel Project Oluşturma

```bash
# Vercel CLI kurulumu (opsiyonel)
npm i -g vercel

# Projeyi Vercel'e bağlayın
vercel link
```

Veya https://vercel.com adresinden GitHub repo'nuzu bağlayabilirsiniz.

### 3) Environment Variables

Vercel Dashboard → Settings → Environment Variables:

| Değişken | Değer |
|----------|-------|
| MONGODB_URI | `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ebatlama?retryWrites=true&w=majority` |
| JWT_SECRET | Rastgele bir güvenli anahtar (örn: `jwt-secret-key-ebatlama-2024`) |
| SEED_ADMIN_USERNAME | admin |
| SEED_ADMIN_PASSWORD | admin123 |
| SEED_ADMIN_NAME | Sistem Yöneticisi |

Frontend aynı Vercel projesinde deploy edildiğinde API adresi için ekstra env gerekmez; uygulama `/api` üzerinden backend'e gider. Ayrı bir frontend domain'i kullanacaksanız `REACT_APP_API_URL` değerini tam API adresiyle değiştirin.

İsterseniz kökteki `vercel.env.example`, backend'deki `backend/.env.example` ve frontend'deki `frontend/.env.example` dosyalarını temel alıp aynı değişkenleri kopyalayabilirsiniz.

### 4) Deploy

```bash
# Vercel ile deploy
vercel --prod
```

veya GitHub'a push ettiğinizde Vercel otomatik deploy eder.

### 5) İlk Kullanım

Deploy sonrası:
1. Vercel'den verilen URL'ye gidin (örn: `https://ebatlama.vercel.app`)
2. `/login` sayfasından giriş yapın
3. Admin bilgileri: `admin` / `admin123`

---

## Yerel Geliştirme

```bash
# Tüm bağımlılıkları yükle
npm run install:all

# Backend ve frontend'i birlikte çalıştır
npm run dev
```

veya

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm start
```
