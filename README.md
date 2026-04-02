# ⛳ Carya Golf Kulübü — PWA Kurulum Rehberi

## Süper Admin Giriş Bilgileri
- **E-posta:** superadmin@caryagolf.com
- **Şifre:** Carya2024!

---

## 📁 Proje Yapısı
```
carya-golf/
├── public/
│   ├── favicon.ico        ← Boş bırakabilirsin
│   ├── icon-192.png       ← Uygulama ikonu (192x192)
│   ├── icon-512.png       ← Uygulama ikonu (512x512)
│   └── apple-touch-icon.png ← iPhone ikonu (180x180)
├── src/
│   ├── App.jsx            ← Ana uygulama kodu
│   └── main.jsx           ← Giriş noktası
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 ADIM ADIM KURULUM

### ADIM 1 — Node.js kur (bir kez yapılır)
1. https://nodejs.org adresine git
2. "LTS" sürümünü indir ve kur
3. Kurulumu tamamla

### ADIM 2 — Projeyi çalıştır (test için)
1. Bu klasörü bir yere kaydet (örn: Masaüstü/carya-golf)
2. Klasörün içinde sağ tıkla → "Terminal'de Aç" (Mac) veya "Komut İstemi" (Windows)
3. Şu komutları sırayla yaz:

```bash
npm install
npm run dev
```

4. Tarayıcıda http://localhost:5173 açılacak — uygulama çalışıyor!

### ADIM 3 — GitHub'a yükle
1. https://github.com adresine git, hesap aç (ücretsiz)
2. Sağ üstte "+" → "New repository"
3. Repository name: `carya-golf`
4. "Public" seç → "Create repository"
5. Sonraki sayfada "uploading an existing file" linkine tıkla
6. Tüm proje dosyalarını sürükle-bırak
7. "Commit changes" butonuna bas

### ADIM 4 — Vercel'e deploy et
1. https://vercel.com adresine git
2. "Sign up with GitHub" ile giriş yap
3. "Add New Project" → carya-golf reposunu seç
4. Ayarları değiştirme, direkt "Deploy" bas
5. 2 dakika bekle → Uygulama canlıya alındı! 🎉

Vercel sana şöyle bir link verecek:
`https://carya-golf-xxxx.vercel.app`

---

## 📱 Telefona Yükleme

### iPhone (iOS):
1. Safari'de uygulamanın linkini aç
2. Alt ortadaki "Paylaş" ikonuna bas (kare içinde ok)
3. "Ana Ekrana Ekle" seç
4. "Ekle" bas → Artık uygulama gibi açılıyor!

### Android:
1. Chrome'da uygulamanın linkini aç
2. Sağ üstte 3 nokta menüsüne bas
3. "Ana ekrana ekle" seç
4. "Ekle" bas → Uygulama ana ekranda!

---

## 🖼️ İkon Ekleme (Opsiyonel)
`public/` klasörüne şu PNG dosyalarını koy:
- `icon-192.png` → 192x192 piksel golf ikonu
- `icon-512.png` → 512x512 piksel golf ikonu  
- `apple-touch-icon.png` → 180x180 piksel iPhone ikonu

Canva.com'da ücretsiz tasarlayabilirsin.

---

## ❓ Sorun Çıkarsa
- `npm install` hata verirse: Node.js'i yeniden kur
- Vercel deploy olmazsa: Framework preset olarak "Vite" seç
