# Toko Demo REA — target web untuk sharing session

Web app kecil (login + toko + API) yang sengaja dibuat untuk **didemo
reverse engineering** dengan REA. Logika bisnis ditaruh di sisi client
supaya ada yang bisa "ditemukan" — sekaligus jadi contoh anti-pattern.

> Pakai HANYA sebagai target milik sendiri. Ini memang dibuat untuk dibongkar.

## Yang bisa "ditemukan" REA saat demo
1. **Aturan diskon grosir** ada di client (`bundle.min.js`): tier 10/20/50,
   promo `HEMAT10`, gratis ongkir di atas Rp 300.000.
2. **Gate fitur premium** dicek di client (`plan === "premium"`) — bisa
   dibypass tanpa menyentuh server. Pelajaran: jangan cek hak akses di frontend.
3. **Endpoint API**: `/api/login`, `/api/products`, `/api/checkout` — terlihat
   jelas dari bundle & network.
4. **Token** hasil login cuma base64 yang bisa di-decode (bukan JWT bertanda
   tangan). Bahan diskusi: jangan taruh info sensitif di situ.
5. **Server tidak memvalidasi ulang harga** saat checkout (sengaja) — contoh
   kenapa total tidak boleh dipercaya dari client.

Akun demo: `demo / demo123` (free) &middot; `pro / pro123` (premium)

## Struktur
```
rea-web-demo/
├── server.js            # Express: serve static + API
├── package.json
├── src/app.js           # SOURCE frontend (ground truth) - buat dibandingkan
└── public/
    ├── index.html       # UI login + toko
    └── bundle.min.js    # hasil build (yang di-serve & dibaca REA)
```

## Jalankan lokal
```bash
npm install      # sekali saja
npm run build    # bundle src/app.js -> public/bundle.min.js (minified)
npm start        # jalan di http://127.0.0.1:3000
```
Ubah port: `PORT=8080 npm start`

Setiap kali mengubah `src/app.js`, jalankan `npm run build` lagi
(atau `npm run dev` = build + start sekaligus).

## Deploy ke server

### Opsi A — langsung Node (VPS sendiri)
```bash
# di server
git clone <repo-mu> && cd rea-web-demo   # atau upload foldernya
npm install
npm run build
PORT=3000 npm start
```
Supaya tetap hidup, pakai process manager:
```bash
npm install -g pm2
pm2 start server.js --name rea-demo
pm2 save
```
Lalu taruh di belakang Nginx/Caddy sebagai reverse proxy ke `localhost:3000`
kalau mau pakai domain + HTTPS.

### Opsi B — platform (Railway / Render / Fly / dsb.)
- Build command: `npm install && npm run build`
- Start command: `npm start`
- App mendengarkan di `process.env.PORT` (sudah ditangani di server.js).

### Catatan
- `public/bundle.min.js` ikut di-commit atau di-build saat deploy — pastikan
  `npm run build` dijalankan sebelum start, kalau tidak halaman tampil tanpa JS.
- Ini aplikasi demo: "database" hanya array di memori, tidak ada penyimpanan
  nyata, dan sengaja tidak di-hardening. Jangan taruh data asli di sini.

## Alur demo dengan REA
1. Pastikan app jalan (lokal `http://127.0.0.1:3000` atau URL server-mu).
2. Buka Chrome dengan remote debugging (lihat `chrome-rea-demo.bat`),
   arahkan ke URL app.
3. Attach REA:
   ```
   rea list-browser-targets http://127.0.0.1:9222 --json
   rea inspect-web-page http://127.0.0.1:9222 TARGET_ID --include-script-sources --json
   rea analyze-web-bundle http://127.0.0.1:9222 TARGET_ID --json
   ```
4. Minta REA jelaskan endpoint, aturan diskon, dan gate premium.
   Bandingkan dengan `src/app.js` → momen aha.
