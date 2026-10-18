import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- "database" mainan (jangan dipakai di produksi sungguhan) ---
const USERS = [
  { username: "demo", password: "demo123", plan: "free" },
  { username: "pro", password: "pro123", plan: "premium" },
];

const PRODUCTS = [
  { id: "kopi", nama: "Kopi Beans 1kg", harga: 150000 },
  { id: "teh", nama: "Teh Premium 500g", harga: 90000 },
  { id: "gula", nama: "Gula Aren 1kg", harga: 45000 },
];

// token sederhana (BUKAN JWT asli - hanya untuk demo)
function buatToken(user) {
  const payload = Buffer.from(
    JSON.stringify({ u: user.username, plan: user.plan, t: Date.now() })
  ).toString("base64");
  return "demo." + payload;
}

// POST /api/login  -> { token, plan }
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) {
    return res.status(401).json({ error: "Username atau password salah" });
  }
  res.json({ token: buatToken(user), plan: user.plan, username: user.username });
});

// GET /api/products -> daftar produk
app.get("/api/products", (req, res) => {
  res.json({ products: PRODUCTS });
});

// POST /api/checkout -> { ok, nomorOrder }
// server TIDAK memvalidasi ulang harga/diskon dari client.
app.post("/api/checkout", (req, res) => {
  const { items, total } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Keranjang kosong" });
  }
  const nomorOrder = "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  res.json({ ok: true, nomorOrder, totalDiterima: total });
});

app.listen(PORT, () => {
  console.log(`REA web demo jalan di http://127.0.0.1:${PORT}`);
});
