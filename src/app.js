// =============================================================
// Frontend source (ground truth) - demo REA
// Logika bisnis sengaja ditaruh di client supaya REA bisa
// "menemukannya" dari bundle.min.js saat demo.
// Pelajaran: JANGAN taruh aturan harga / cek hak akses di frontend.
// =============================================================

// ---- Logika diskon grosir (client-side) ----
const TIER_DISKON = [
  { minQty: 50, diskon: 0.25 },
  { minQty: 20, diskon: 0.15 },
  { minQty: 10, diskon: 0.10 },
  { minQty: 0, diskon: 0.0 },
];
const AMBANG_GRATIS_ONGKIR = 300000;
const ONGKIR_FLAT = 20000;

function cariDiskon(qty) {
  for (const tier of TIER_DISKON) {
    if (qty >= tier.minQty) return tier.diskon;
  }
  return 0;
}

function hitungTotal(harga, qty, kodePromo) {
  const subtotal = harga * qty;
  let potongan = subtotal * cariDiskon(qty);
  if (kodePromo === "HEMAT10" && subtotal > 100000) {
    potongan += 10000;
  }
  const setelahDiskon = subtotal - potongan;
  const ongkir = setelahDiskon >= AMBANG_GRATIS_ONGKIR ? 0 : ONGKIR_FLAT;
  return { subtotal, potongan, ongkir, total: setelahDiskon + ongkir };
}

// ---- Gate fitur "premium" (anti-pattern - cuma cek di client!) ----
function bolehAksesFiturPremium(plan) {
  return plan === "premium";
}

// ---- State sederhana ----
const state = {
  token: null,
  plan: "free",
  username: null,
  produkDipilih: null,
};

// ---- API calls ----
async function apiLogin(username, password) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login gagal");
  return res.json();
}

async function apiProducts() {
  const res = await fetch("/api/products");
  return res.json();
}

async function apiCheckout(items, total) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + (state.token || ""),
    },
    body: JSON.stringify({ items, total }),
  });
  return res.json();
}

// ---- UI helpers ----
function $(sel) {
  return document.querySelector(sel);
}
function rupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

async function tampilkanToko() {
  $("#login-view").style.display = "none";
  $("#toko-view").style.display = "block";
  $("#siapa").textContent = state.username + " (" + state.plan + ")";

  // tampilkan badge premium jika boleh akses
  $("#premium-badge").style.display = bolehAksesFiturPremium(state.plan)
    ? "inline-block"
    : "none";

  const { products } = await apiProducts();
  const sel = $("#produk");
  sel.innerHTML = "";
  products.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = JSON.stringify(p);
    opt.textContent = p.nama + " - " + rupiah(p.harga);
    sel.appendChild(opt);
  });
  hitungUlang();
}

function hitungUlang() {
  const p = JSON.parse($("#produk").value);
  const qty = parseInt($("#qty").value, 10) || 0;
  const promo = $("#promo").value.trim();
  const r = hitungTotal(p.harga, qty, promo);
  $("#ringkasan").innerHTML =
    "Subtotal: " + rupiah(r.subtotal) + "<br>" +
    "Potongan: -" + rupiah(r.potongan) + "<br>" +
    "Ongkir: " + rupiah(r.ongkir) + "<br>" +
    "<b>Total: " + rupiah(r.total) + "</b>";
  state._total = r.total;
  state._produk = p;
  state._qty = qty;
}

// ---- Event wiring ----
window.addEventListener("DOMContentLoaded", () => {
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#login-error").textContent = "";
    try {
      const data = await apiLogin($("#username").value, $("#password").value);
      state.token = data.token;
      state.plan = data.plan;
      state.username = data.username;
      await tampilkanToko();
    } catch (err) {
      $("#login-error").textContent = "Username atau password salah";
    }
  });

  $("#produk").addEventListener("change", hitungUlang);
  $("#qty").addEventListener("input", hitungUlang);
  $("#promo").addEventListener("input", hitungUlang);

  $("#checkout").addEventListener("click", async () => {
    const r = await apiCheckout(
      [{ id: state._produk.id, qty: state._qty }],
      state._total
    );
    $("#hasil").textContent = r.ok
      ? "Order berhasil: " + r.nomorOrder + " (total " + rupiah(r.totalDiterima) + ")"
      : "Checkout gagal";
  });
});
