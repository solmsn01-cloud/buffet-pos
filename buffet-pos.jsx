import { useState, useMemo, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, push, onValue, update } from "firebase/database";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
// 👇 Reemplazá estos valores con los de tu proyecto Firebase
// Ver instrucciones al pie del archivo
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyABHLEJ3rThW7F1qE1EWT__WyL6YQ-rbGU",
  authDomain:        "buffet-3ed5f.firebaseapp.com",
  databaseURL:       "https://buffet-3ed5f-default-rtdb.firebaseio.com",
  projectId:         "buffet-3ed5f",
  storageBucket:     "buffet-3ed5f.firebasestorage.app",
  messagingSenderId: "164379904167",
  appId:             "1:164379904167:web:56bda102473aba894df382",
  measurementId:     "G-VBRCYRT3KG",
};

// ─── DATOS ────────────────────────────────────────────────────────────────────
const CATEGORIAS = {
  Comidas: {
    icon: "🍔", color: "#E07A5F",
    items: [
      { id: "c1", nombre: "Pizza",           precio: 2500 },
      { id: "c2", nombre: "Hamburguesa",     precio: 4000 },
      { id: "c3", nombre: "Super Pancho",    precio: 3500 },
    ],
  },
  Bebidas: {
    icon: "🥤", color: "#3D6B9E",
    items: [
      { id: "b1", nombre: "Cuba 800",        precio: 4000 },
      { id: "b2", nombre: "Agua Grande",     precio: 2000 },
      { id: "b3", nombre: "Agua Saborizada", precio: 2500 },
    ],
  },
  Dulces: {
    icon: "🍰", color: "#C77DBA",
    items: [
      { id: "d1", nombre: "Porción de Torta", precio: 1500 },
    ],
  },
  Varios: {
    icon: "🛍️", color: "#5C9E78",
    items: [
      { id: "v1", nombre: "Agua Caliente", precio: 500 },
    ],
  },
};

const MEDIOS_PAGO = [
  { id: "efectivo",         label: "Efectivo",       icon: "💵" },
  { id: "transferencia",    label: "Transferencia",  icon: "📲" },
  { id: "cuenta_corriente", label: "Cta. Corriente", icon: "📋" },
];

const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
const fmtFecha = (d) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtHora = (d) =>
  new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
const hoy = () => new Date().toISOString().slice(0, 10);

// ─── PALETA ───────────────────────────────────────────────────────────────────
const G = {
  bg: "#0F1117", surface: "#1A1D27", surfaceHigh: "#22263A",
  border: "#2E3350", text: "#E8EAF0", textMuted: "#7A7F9A",
  accent: "#FFB830", danger: "#E05757", success: "#4CAF82",
};

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const s = {
  app: { background: G.bg, minHeight: "100vh", fontFamily: "'Nunito', sans-serif", color: G.text, maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  headerTitle: { fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", color: G.accent, margin: 0 },
  tabBar: { display: "flex", background: G.surface, borderBottom: `1px solid ${G.border}`, position: "sticky", top: 53, zIndex: 99 },
  tab: (a) => ({ flex: 1, padding: "10px 4px", border: "none", background: "transparent", color: a ? G.accent : G.textMuted, fontFamily: "'Nunito', sans-serif", fontWeight: a ? 800 : 600, fontSize: 12, cursor: "pointer", borderBottom: `3px solid ${a ? G.accent : "transparent"}`, transition: "all 0.2s" }),
  catScroll: { display: "flex", gap: 8, padding: "10px 16px", overflowX: "auto", scrollbarWidth: "none", borderBottom: `1px solid ${G.border}`, position: "sticky", top: 93, zIndex: 98, background: G.bg },
  catChip: (a, c) => ({ flexShrink: 0, padding: "5px 12px", borderRadius: 20, border: `2px solid ${a ? c : G.border}`, background: a ? c + "22" : "transparent", color: a ? c : G.textMuted, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }),
  catSection: { padding: "0 16px 8px" },
  catSectionHeader: (c) => ({ display: "flex", alignItems: "center", gap: 8, padding: "14px 0 8px", fontSize: 15, fontWeight: 900, color: c, borderBottom: `2px solid ${c}33`, marginBottom: 10 }),
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 },
  itemCard: (c, q) => ({ background: q > 0 ? c + "18" : G.surface, border: `2px solid ${q > 0 ? c : G.border}`, borderRadius: 12, padding: "12px 10px", cursor: "pointer", position: "relative", transition: "all 0.15s" }),
  itemName: { fontSize: 13, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 },
  itemPrice: (c) => ({ fontSize: 14, fontWeight: 800, color: c }),
  qtyBadge: (c) => ({ position: "absolute", top: 6, right: 8, background: c, color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }),
  cart: { background: G.surface, borderTop: `2px solid ${G.border}`, position: "sticky", bottom: 0 },
  cartHeader: { padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" },
  cartTotal: { fontSize: 20, fontWeight: 900, color: G.accent },
  cartItems: { padding: "0 16px 8px", maxHeight: 180, overflowY: "auto" },
  cartRow: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: `1px solid ${G.border}` },
  cartRowName: { flex: 1, fontSize: 13 },
  cartRowPrice: { fontSize: 13, fontWeight: 700, color: G.accent, minWidth: 70, textAlign: "right" },
  qtyControl: { display: "flex", alignItems: "center", gap: 4 },
  qtyBtn: (c) => ({ width: 24, height: 24, borderRadius: 6, border: `1px solid ${c}`, background: "transparent", color: c, fontWeight: 900, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, fontFamily: "'Nunito', sans-serif" }),
  qtyNum: { fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: "center" },
  payBtn: { margin: "8px 16px 16px", width: "calc(100% - 32px)", padding: "14px", background: G.accent, color: "#0F1117", border: "none", borderRadius: 12, fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 16, cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "flex-end", maxWidth: 480, margin: "0 auto", left: "50%", transform: "translateX(-50%)", width: "100%" },
  sheet: { background: G.surface, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", borderTop: `3px solid ${G.accent}` },
  sheetTitle: { fontSize: 18, fontWeight: 900, marginBottom: 16, textAlign: "center" },
  payOptions: { display: "flex", gap: 10, marginBottom: 20 },
  payOption: (a) => ({ flex: 1, padding: "14px 8px", borderRadius: 12, border: `2px solid ${a ? G.accent : G.border}`, background: a ? G.accent + "15" : "transparent", color: a ? G.accent : G.textMuted, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }),
  confirmBtn: (d) => ({ width: "100%", padding: 14, background: d ? G.surfaceHigh : G.success, color: d ? G.textMuted : "#fff", border: "none", borderRadius: 12, fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 16, cursor: d ? "not-allowed" : "pointer" }),
  ccField: { width: "100%", padding: "10px 12px", background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, color: G.text, fontFamily: "'Nunito', sans-serif", fontSize: 14, marginBottom: 12, boxSizing: "border-box" },
  reportSection: { padding: "16px" },
  reportTitle: { fontSize: 16, fontWeight: 900, marginBottom: 12, color: G.accent },
  reportCard: { background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, marginBottom: 12, overflow: "hidden" },
  reportCardHeader: { padding: "10px 14px", background: G.surfaceHigh, fontWeight: 800, fontSize: 14, display: "flex", justifyContent: "space-between" },
  reportRow: { display: "flex", justifyContent: "space-between", padding: "8px 14px", borderTop: `1px solid ${G.border}`, fontSize: 13 },
  ccCard: { background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 10 },
  ccRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  ccName: { fontWeight: 800, fontSize: 15 },
  ccAmt: { fontWeight: 800, fontSize: 15, color: G.accent },
  ccDate: { fontSize: 12, color: G.textMuted },
  cobrarBtn: { padding: "6px 14px", background: G.success, color: "#fff", border: "none", borderRadius: 8, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  dateInput: { background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, color: G.text, fontFamily: "'Nunito', sans-serif", fontSize: 13, padding: "6px 10px", flex: 1 },
  exportBtn: { width: "100%", padding: "11px 16px", background: "#1A5C2A", color: "#fff", border: `1px solid #2E8B42`, borderRadius: 10, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  statusDot: (ok) => ({ width: 8, height: 8, borderRadius: "50%", background: ok ? G.success : G.danger, display: "inline-block", marginRight: 5 }),
  manualBtns: { display: "flex", gap: 10, padding: "10px 16px 4px" },
  manualBtn: (color) => ({ flex: 1, padding: "10px 8px", background: "transparent", border: `2px solid ${color}`, borderRadius: 10, color: color, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }),
  manualInput: { width: "100%", padding: "10px 12px", background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, color: G.text, fontFamily: "'Nunito', sans-serif", fontSize: 14, marginBottom: 10, boxSizing: "border-box" },
};

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
function exportCSV(ventas, desde, hasta) {
  const d0 = new Date(desde + "T00:00:00");
  const d1 = new Date(hasta + "T23:59:59");
  const filtradas = ventas.filter((v) => !v.esCobro && new Date(v.fecha) >= d0 && new Date(v.fecha) <= d1);
  const manuales = filtradas.filter((v) => v.esManual);
  const ventasNormales = filtradas.filter((v) => !v.esManual);

  const toCSV = (rows) => rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  // Detalle
  const rows1 = [["Fecha", "Hora", "Artículo", "Rubro", "Cantidad", "Precio Unit.", "Subtotal", "Medio de pago"]];
  for (const v of ventasNormales) {
    const medioEfectivo = (v.medio === "cuenta_corriente" && v.medioCobro) ? v.medioCobro : v.medio;
    const mp = MEDIOS_PAGO.find((m) => m.id === medioEfectivo)?.label || medioEfectivo;
    for (const it of v.items)
      rows1.push([fmtFecha(v.fecha), fmtHora(v.fecha), it.nombre, it.cat, it.qty, it.precio, it.precio * it.qty, mp]);
  }

  // Por artículo
  const artMap = {};
  for (const v of ventasNormales)
    for (const it of v.items) {
      if (!artMap[it.nombre]) artMap[it.nombre] = { cat: it.cat, qty: 0, monto: 0 };
      artMap[it.nombre].qty += it.qty;
      artMap[it.nombre].monto += it.precio * it.qty;
    }
  const rows2 = [["Artículo", "Rubro", "Unidades", "Total"]];
  Object.entries(artMap).sort((a, b) => b[1].monto - a[1].monto)
    .forEach(([n, d]) => rows2.push([n, d.cat, d.qty, d.monto]));

  // Por medio de pago
  const mpMap = {};
  for (const v of ventasNormales) {
    const me = (v.medio === "cuenta_corriente" && v.medioCobro) ? v.medioCobro : v.medio;
    mpMap[me] = (mpMap[me] || 0) + v.total;
  }
  const rows4 = [["Ingresos y egresos manuales"], ["Fecha", "Hora", "Detalle", "Tipo", "Importe"]];
  for (const v of manuales)
    rows4.push([fmtFecha(v.fecha), fmtHora(v.fecha), v.items[0].nombre, v.tipoManual === "ingreso" ? "Ingreso" : "Egreso", v.tipoManual === "ingreso" ? v.total : -v.total]);
  rows4.push(["", "", "", "Saldo manuales",
    manuales.reduce((a, v) => a + (v.tipoManual === "ingreso" ? v.total : -v.total), 0)]);
  const rows3 = [["Medio de pago", "Total"]];
  MEDIOS_PAGO.forEach((mp) => rows3.push([mp.label, mpMap[mp.id] || 0]));
  rows3.push(["TOTAL GENERAL", filtradas.reduce((a, v) => a + v.total, 0)]);

  const csv =
    `BUFFET POS — Período ${desde} al ${hasta}\n\n` +
    "DETALLE DE VENTAS\n" + toCSV(rows1) +
    "\n\nRESUMEN POR ARTÍCULO\n" + toCSV(rows2) +
    "\n\nRESUMEN POR MEDIO DE PAGO\n" + toCSV(rows3) +
    (manuales.length ? "\n\n" + toCSV(rows4) : "");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `buffet_${desde}_al_${hasta}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── FIREBASE HOOK ────────────────────────────────────────────────────────────
function useFirebase() {
  const [db, setDb]           = useState(null);
  const [fbReady, setFbReady] = useState(false);
  const [fbError, setFbError] = useState(null);

  useEffect(() => {
    try {
      if (FIREBASE_CONFIG.apiKey === "TU_API_KEY") {
        setFbError("Firebase no configurado");
        return;
      }
      const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      setDb({ database: getDatabase(app), ref, push, onValue, update });
      setFbReady(true);
    } catch (e) {
      setFbError("Error al conectar con Firebase");
    }
  }, []);

  return { db, fbReady, fbError };
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function BuffetPOS() {
  const { db, fbReady, fbError } = useFirebase();

  const [vista, setVista]       = useState("venta");
  const [activeCat, setActiveCat] = useState(null);
  const [carrito, setCarrito]   = useState({});
  const [showPago, setShowPago] = useState(false);
  const [medioPago, setMedioPago] = useState(null);
  const [ventas, setVentas]     = useState([]);
  const [cuentasCorrientes, setCuentasCorrientes] = useState([]);
  const [cartOpen, setCartOpen] = useState(true);
  const [showCCForm, setShowCCForm] = useState(false);
  const [ccNombre, setCCNombre] = useState("");
  const [showCobrarModal, setShowCobrarModal] = useState(null);
  const [cobreMedio, setCobreMedio] = useState(null);
  const [toast, setToast]       = useState(null);
  const [cargando, setCargando] = useState(false);
  const [rDesde, setRDesde]     = useState(hoy());
  const [showManual, setShowManual] = useState(null); // 'ingreso' | 'egreso' | null
  const [manualDetalle, setManualDetalle] = useState("");
  const [manualImporte, setManualImporte] = useState("");
  const [rHasta, setRHasta]     = useState(hoy());

  // Suscripción Firebase
  useEffect(() => {
    if (!db || !fbReady) return;
    const { database, ref, onValue } = db;
    const u1 = onValue(ref(database, "ventas"), (snap) => {
      const data = snap.val() || {};
      setVentas(Object.entries(data).map(([k, v]) => ({ ...v, _key: k }))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    });
    const u2 = onValue(ref(database, "cuentas_corrientes"), (snap) => {
      const data = snap.val() || {};
      setCuentasCorrientes(Object.entries(data).map(([k, v]) => ({ ...v, _key: k }))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    });
    return () => { u1(); u2(); };
  }, [db, fbReady]);

  const showToast = (msg, color = G.success) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  const itemsCarrito = useMemo(() =>
    Object.entries(carrito).filter(([, q]) => q > 0).map(([id, qty]) => {
      for (const [cat, data] of Object.entries(CATEGORIAS)) {
        const it = data.items.find((i) => i.id === id);
        if (it) return { ...it, qty, cat, color: data.color };
      }
      return null;
    }).filter(Boolean), [carrito]);

  const total = itemsCarrito.reduce((s, i) => s + i.precio * i.qty, 0);
  const addItem = (id) => setCarrito((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeItem = (id) => setCarrito((c) => {
    const n = { ...c, [id]: (c[id] || 0) - 1 };
    if (n[id] <= 0) delete n[id];
    return n;
  });

  const confirmarVenta = async () => {
    if (!medioPago || !itemsCarrito.length) return;
    if (medioPago === "cuenta_corriente" && !ccNombre.trim()) return;
    setCargando(true);
    try {
      const venta = {
        fecha: new Date().toISOString(),
        items: itemsCarrito.map(({ id, nombre, precio, qty, cat }) => ({ id, nombre, precio, qty, cat })),
        total, medio: medioPago, cobrado: medioPago !== "cuenta_corriente", esCobro: false,
      };
      if (fbReady && db) {
        const { database, ref, push } = db;
        const nRef = await push(ref(database, "ventas"), venta);
        if (medioPago === "cuenta_corriente")
          await push(ref(database, "cuentas_corrientes"), {
            nombre: ccNombre.trim(), monto: total, ventaId: nRef.key,
            fecha: new Date().toISOString(), cobrado: false,
          });
      } else {
        const ventaKey = String(Date.now());
        const v = { ...venta, _key: ventaKey };
        setVentas((p) => [v, ...p]);
        if (medioPago === "cuenta_corriente")
          setCuentasCorrientes((p) => [{ _key: String(Date.now()+1), nombre: ccNombre.trim(), monto: total, fecha: new Date().toISOString(), cobrado: false, ventaId: ventaKey }, ...p]);
      }
      setCarrito({}); setMedioPago(null); setShowPago(false); setCCNombre(""); setShowCCForm(false);
      showToast(`Venta de ${fmt(total)} registrada ✓`);
    } catch { showToast("Error al guardar", G.danger); }
    setCargando(false);
  };

  const cobrarCC = async () => {
    if (!cobreMedio || !showCobrarModal) return;
    const cc = cuentasCorrientes.find((c) => c._key === showCobrarModal);
    if (!cc) return;
    setCargando(true);
    try {
      const cobro = {
        fecha: new Date().toISOString(),
        items: [{ id: "cc_cobro", nombre: `Cobro cta. cte. — ${cc.nombre}`, precio: cc.monto, qty: 1, cat: "Varios" }],
        total: cc.monto, medio: cobreMedio, cobrado: true, esCobro: true,
      };
      if (fbReady && db) {
        const { database, ref, push, update } = db;
        await push(ref(database, "ventas"), cobro);
        await update(ref(database, `cuentas_corrientes/${cc._key}`), { cobrado: true, medioCobro: cobreMedio });
        if (cc.ventaId)
          await update(ref(database, `ventas/${cc.ventaId}`), { medioCobro: cobreMedio });
      } else {
        setVentas((p) => [
          { ...cobro, _key: String(Date.now()) },
          ...p.map((v) => v._key === cc.ventaId ? { ...v, medioCobro: cobreMedio } : v)
        ]);
        setCuentasCorrientes((p) => p.map((c) => c._key === showCobrarModal ? { ...c, cobrado: true, medioCobro: cobreMedio } : c));
      }
      setShowCobrarModal(null); setCobreMedio(null);
      showToast(`Cobro de ${fmt(cc.monto)} registrado ✓`);
    } catch { showToast("Error al registrar cobro", G.danger); }
    setCargando(false);
  };

  const guardarManual = async () => {
    const importe = parseFloat(manualImporte.replace(",", "."));
    if (!manualDetalle.trim() || !importe || importe <= 0) return;
    setCargando(true);
    try {
      const mov = {
        fecha: new Date().toISOString(),
        items: [{ id: "manual", nombre: manualDetalle.trim(), precio: importe, qty: 1, cat: showManual === "ingreso" ? "Ingreso" : "Egreso" }],
        total: importe,
        medio: "efectivo",
        cobrado: true,
        esCobro: false,
        esManual: true,
        tipoManual: showManual, // 'ingreso' | 'egreso'
      };
      if (fbReady && db) {
        const { database, ref, push } = db;
        await push(ref(database, "ventas"), mov);
      } else {
        setVentas((p) => [{ ...mov, _key: String(Date.now()) }, ...p]);
      }
      setShowManual(null); setManualDetalle(""); setManualImporte("");
      showToast(`${showManual === "ingreso" ? "Ingreso" : "Egreso"} de ${fmt(importe)} registrado ✓`,
        showManual === "ingreso" ? G.success : G.danger);
    } catch { showToast("Error al guardar", G.danger); }
    setCargando(false);
  };

  const reporte = useMemo(() => {
    const d0 = new Date(rDesde + "T00:00:00"), d1 = new Date(rHasta + "T23:59:59");
    const filtradas = ventas.filter((v) => !v.esCobro && new Date(v.fecha) >= d0 && new Date(v.fecha) <= d1);

    // Ventas CC cobradas: imputar al medio de cobro real (medioCobro se guarda en la venta)
    const porMedio = { efectivo: 0, transferencia: 0, cuenta_corriente: 0 };
    const porArticulo = {}, porCategoria = {};
    let totalIngresos = 0, totalEgresos = 0;
    const movManuales = [];

    for (const v of filtradas) {
      if (v.esManual) {
        const it = v.items[0];
        if (v.tipoManual === "ingreso") totalIngresos += v.total;
        else totalEgresos += v.total;
        movManuales.push({ nombre: it.nombre, tipo: v.tipoManual, monto: v.total });
        continue;
      }
      const medioEfectivo = (v.medio === "cuenta_corriente" && v.medioCobro)
        ? v.medioCobro
        : v.medio;
      porMedio[medioEfectivo] = (porMedio[medioEfectivo] || 0) + v.total;
      for (const it of v.items) {
        if (!porArticulo[it.nombre]) porArticulo[it.nombre] = { nombre: it.nombre, cat: it.cat, cantidad: 0, monto: 0 };
        porArticulo[it.nombre].cantidad += it.qty;
        porArticulo[it.nombre].monto += it.precio * it.qty;
        porCategoria[it.cat] = (porCategoria[it.cat] || 0) + it.precio * it.qty;
      }
    }
    return { porMedio, arts: Object.values(porArticulo).sort((a, b) => b.monto - a.monto), porCategoria, totalIngresos, totalEgresos, movManuales };
  }, [ventas, rDesde, rHasta]);

  const totalVendido = Object.values(reporte.porMedio).reduce((a, b) => a + b, 0);
  const saldoNeto = totalVendido + (reporte.totalIngresos || 0) - (reporte.totalEgresos || 0);
  const ccPendientes = cuentasCorrientes.filter((c) => !c.cobrado);
  const ccCobradas   = cuentasCorrientes.filter((c) => c.cobrado);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={s.app}>

        {/* HEADER */}
        <div style={s.header}>
          <h1 style={s.headerTitle}>⚡ BUFFET POS</h1>
          <div style={{ fontSize: 11, color: G.textMuted, display: "flex", alignItems: "center" }}>
            <span style={s.statusDot(fbReady && !fbError)} />
            {fbError ? "Modo local" : fbReady ? "Sincronizado" : "Conectando…"}
          </div>
        </div>

        {/* TABS */}
        <div style={s.tabBar}>
          {[
            { id: "venta",    label: "🛒 Venta" },
            { id: "cc",       label: `📋 Cta. Cte.${ccPendientes.length > 0 ? ` (${ccPendientes.length})` : ""}` },
            { id: "reportes", label: "📊 Reportes" },
          ].map((t) => (
            <button key={t.id} style={s.tab(vista === t.id)} onClick={() => setVista(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* ── VENTA ── */}
        {vista === "venta" && (<>
          <div style={s.manualBtns}>
            <button style={s.manualBtn(G.success)} onClick={() => { setShowManual("ingreso"); setManualDetalle(""); setManualImporte(""); }}>
              ＋ Ingreso manual
            </button>
            <button style={s.manualBtn(G.danger)} onClick={() => { setShowManual("egreso"); setManualDetalle(""); setManualImporte(""); }}>
              － Egreso manual
            </button>
          </div>

          <div style={s.catScroll}>
            {Object.entries(CATEGORIAS).map(([cat, data]) => (
              <button key={cat} style={s.catChip(activeCat === cat, data.color)}
                onClick={() => { setActiveCat(cat); document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                {data.icon} {cat}
              </button>
            ))}
          </div>
          <div style={s.catSection}>
            {Object.entries(CATEGORIAS).map(([cat, data]) => (
              <div key={cat} id={`cat-${cat}`}>
                <div style={s.catSectionHeader(data.color)}><span>{data.icon}</span><span>{cat}</span></div>
                <div style={s.grid}>
                  {data.items.map((item) => {
                    const qty = carrito[item.id] || 0;
                    return (
                      <div key={item.id} style={s.itemCard(data.color, qty)} onClick={() => addItem(item.id)}>
                        {qty > 0 && <div style={s.qtyBadge(data.color)}>{qty}</div>}
                        <div style={s.itemName}>{item.nombre}</div>
                        <div style={s.itemPrice(data.color)}>{fmt(item.precio)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ height: 8 }} />
          </div>
          {/* CARRITO */}
          <div style={s.cart}>
            <div style={s.cartHeader} onClick={() => setCartOpen((o) => !o)}>
              <span style={{ fontSize: 13, fontWeight: 700, color: G.textMuted }}>
                {itemsCarrito.length === 0 ? "Carrito vacío" : `${itemsCarrito.reduce((a, i) => a + i.qty, 0)} artículo(s)`}
                {" "}<span style={{ fontSize: 11 }}>{cartOpen ? "▲" : "▼"}</span>
              </span>
              <span style={s.cartTotal}>{total > 0 ? fmt(total) : ""}</span>
            </div>
            {cartOpen && itemsCarrito.length > 0 && (
              <div style={s.cartItems}>
                {itemsCarrito.map((it) => (
                  <div key={it.id} style={s.cartRow}>
                    <span style={s.cartRowName}>{it.nombre}</span>
                    <div style={s.qtyControl}>
                      <button style={s.qtyBtn(G.danger)} onClick={() => removeItem(it.id)}>−</button>
                      <span style={s.qtyNum}>{it.qty}</span>
                      <button style={s.qtyBtn(it.color)} onClick={() => addItem(it.id)}>+</button>
                    </div>
                    <span style={s.cartRowPrice}>{fmt(it.precio * it.qty)}</span>
                  </div>
                ))}
              </div>
            )}
            {itemsCarrito.length > 0 && (
              <button style={s.payBtn} onClick={() => setShowPago(true)}>Cobrar {fmt(total)}</button>
            )}
          </div>
        </>)}

        {/* ── CUENTAS CORRIENTES ── */}
        {vista === "cc" && (
          <div style={s.reportSection}>
            <div style={{ ...s.reportTitle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Cuentas Corrientes</span>
              <span style={{ fontSize: 13, color: G.textMuted }}>Pendiente: {fmt(ccPendientes.reduce((a, c) => a + c.monto, 0))}</span>
            </div>
            {ccPendientes.length === 0 && <div style={{ color: G.textMuted, fontSize: 14, textAlign: "center", padding: 32 }}>Sin cuentas pendientes</div>}
            {ccPendientes.map((cc) => (
              <div key={cc._key} style={s.ccCard}>
                <div style={s.ccRow}><span style={s.ccName}>{cc.nombre}</span><span style={s.ccAmt}>{fmt(cc.monto)}</span></div>
                <div style={{ ...s.ccRow, marginBottom: 0 }}>
                  <span style={s.ccDate}>{fmtFecha(cc.fecha)} {fmtHora(cc.fecha)}</span>
                  <button style={s.cobrarBtn} onClick={() => { setShowCobrarModal(cc._key); setCobreMedio(null); }}>Cobrar</button>
                </div>
              </div>
            ))}
            {ccCobradas.length > 0 && (<>
              <div style={{ ...s.reportTitle, marginTop: 24, color: G.success }}>Cobradas</div>
              {ccCobradas.map((cc) => (
                <div key={cc._key} style={{ ...s.ccCard, opacity: 0.6 }}>
                  <div style={s.ccRow}><span style={s.ccName}>{cc.nombre}</span><span style={{ ...s.ccAmt, color: G.success }}>✓ {fmt(cc.monto)}</span></div>
                  <div style={s.ccDate}>{MEDIOS_PAGO.find(m => m.id === cc.medioCobro)?.label || cc.medioCobro}</div>
                </div>
              ))}
            </>)}
          </div>
        )}

        {/* ── REPORTES ── */}
        {vista === "reportes" && (
          <div style={s.reportSection}>

            {/* Filtro fechas + exportar */}
            <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: G.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>📅 Período</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <input type="date" style={s.dateInput} value={rDesde} max={rHasta} onChange={(e) => setRDesde(e.target.value)} />
                <span style={{ color: G.textMuted }}>→</span>
                <input type="date" style={s.dateInput} value={rHasta} min={rDesde} onChange={(e) => setRHasta(e.target.value)} />
              </div>
              <button style={s.exportBtn} onClick={() => exportCSV(ventas, rDesde, rHasta)}>
                <span style={{ fontSize: 16 }}>📥</span> Exportar CSV → Google Sheets
              </button>
            </div>



            {/* Ingresos y egresos manuales */}
            {(reporte.movManuales?.length > 0) && (
              <div style={s.reportCard}>
                <div style={s.reportCardHeader}>
                  <span>Ingresos y egresos manuales</span>
                  <span style={{ color: reporte.totalIngresos - reporte.totalEgresos >= 0 ? G.success : G.danger }}>
                    {reporte.totalIngresos - reporte.totalEgresos >= 0 ? "+" : ""}{fmt(reporte.totalIngresos - reporte.totalEgresos)}
                  </span>
                </div>
                {reporte.movManuales.map((m, i) => (
                  <div key={i} style={s.reportRow}>
                    <span style={{ flex: 1 }}>{m.nombre}</span>
                    <span style={{ fontWeight: 700, color: m.tipo === "ingreso" ? G.success : G.danger }}>
                      {m.tipo === "ingreso" ? "+" : "−"}{fmt(m.monto)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ ...s.reportCard, marginBottom: 16 }}>
              <div style={{ ...s.reportCardHeader, background: "transparent", borderBottom: `1px solid ${G.border}` }}>
                <span style={{ color: G.textMuted }}>Ventas del período</span><span>{fmt(totalVendido)}</span>
              </div>
              {reporte.totalIngresos > 0 && <div style={s.reportRow}><span style={{ color: G.success }}>＋ Ingresos manuales</span><span style={{ fontWeight: 700, color: G.success }}>{fmt(reporte.totalIngresos)}</span></div>}
              {reporte.totalEgresos > 0 && <div style={s.reportRow}><span style={{ color: G.danger }}>－ Egresos manuales</span><span style={{ fontWeight: 700, color: G.danger }}>{fmt(reporte.totalEgresos)}</span></div>}
              <div style={{ ...s.reportRow, fontWeight: 900, fontSize: 15 }}><span>Saldo neto</span><span style={{ color: saldoNeto >= 0 ? G.success : G.danger }}>{fmt(saldoNeto)}</span></div>
            </div>

            <div style={s.reportCard}>
              <div style={s.reportCardHeader}><span>Por medio de pago</span><span>{fmt(totalVendido)}</span></div>
              {MEDIOS_PAGO.map((mp) => (
                <div key={mp.id} style={s.reportRow}>
                  <span>{mp.icon} {mp.label}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(reporte.porMedio[mp.id] || 0)}</span>
                </div>
              ))}
            </div>

            <div style={s.reportCard}>
              <div style={s.reportCardHeader}><span>Por categoría</span></div>
              {Object.entries(reporte.porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, monto]) => (
                <div key={cat} style={s.reportRow}>
                  <span>{CATEGORIAS[cat]?.icon} {cat}</span>
                  <span style={{ fontWeight: 700, color: CATEGORIAS[cat]?.color }}>{fmt(monto)}</span>
                </div>
              ))}
              {!Object.keys(reporte.porCategoria).length && <div style={{ padding: "12px 14px", fontSize: 13, color: G.textMuted }}>Sin ventas en este período</div>}
            </div>

            <div style={s.reportCard}>
              <div style={s.reportCardHeader}><span>Por artículo</span><span style={{ fontSize: 12, color: G.textMuted }}>unid / monto</span></div>
              {reporte.arts.map((a) => (
                <div key={a.nombre} style={s.reportRow}>
                  <span style={{ flex: 1 }}>{a.nombre}</span>
                  <span style={{ color: G.textMuted, marginRight: 8, fontSize: 12 }}>x{a.cantidad}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(a.monto)}</span>
                </div>
              ))}
              {!reporte.arts.length && <div style={{ padding: "12px 14px", fontSize: 13, color: G.textMuted }}>Sin ventas en este período</div>}
            </div>
          </div>
        )}

        {/* ── MODAL INGRESO / EGRESO MANUAL ── */}
        {showManual && (
          <div style={s.overlay} onClick={() => setShowManual(null)}>
            <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
              <div style={s.sheetTitle}>
                {showManual === "ingreso" ? "＋ Ingreso manual" : "－ Egreso manual"}
              </div>
              <input
                style={s.manualInput}
                placeholder="Detalle (ej: donación, compra de hielo…)"
                value={manualDetalle}
                onChange={(e) => setManualDetalle(e.target.value)}
                autoFocus
              />
              <input
                style={s.manualInput}
                placeholder="Importe"
                type="number"
                inputMode="decimal"
                value={manualImporte}
                onChange={(e) => setManualImporte(e.target.value)}
              />
              {manualImporte && parseFloat(manualImporte) > 0 && (
                <div style={{ fontSize: 22, fontWeight: 900, color: showManual === "ingreso" ? G.success : G.danger, textAlign: "center", marginBottom: 16 }}>
                  {showManual === "ingreso" ? "+" : "−"}{fmt(parseFloat(manualImporte))}
                </div>
              )}
              <button
                style={s.confirmBtn(cargando || !manualDetalle.trim() || !manualImporte || parseFloat(manualImporte) <= 0)}
                onClick={guardarManual}
              >
                {cargando ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        )}

        {/* ── MODAL PAGO ── */}
        {showPago && (
          <div style={s.overlay} onClick={() => setShowPago(false)}>
            <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
              <div style={s.sheetTitle}>Elegí medio de pago</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: G.accent, textAlign: "center", marginBottom: 16 }}>{fmt(total)}</div>
              <div style={s.payOptions}>
                {MEDIOS_PAGO.map((mp) => (
                  <button key={mp.id} style={s.payOption(medioPago === mp.id)}
                    onClick={() => { setMedioPago(mp.id); setShowCCForm(mp.id === "cuenta_corriente"); }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{mp.icon}</div>
                    <div>{mp.label}</div>
                  </button>
                ))}
              </div>
              {showCCForm && medioPago === "cuenta_corriente" && (
                <input style={s.ccField} placeholder="Nombre del cliente" value={ccNombre} onChange={(e) => setCCNombre(e.target.value)} />
              )}
              <button style={s.confirmBtn(cargando || !medioPago || (medioPago === "cuenta_corriente" && !ccNombre.trim()))} onClick={confirmarVenta}>
                {cargando ? "Guardando…" : "Confirmar venta"}
              </button>
            </div>
          </div>
        )}

        {/* ── MODAL COBRAR CC ── */}
        {showCobrarModal && (
          <div style={s.overlay} onClick={() => setShowCobrarModal(null)}>
            <div style={s.sheet} onClick={(e) => e.stopPropagation()}>
              <div style={s.sheetTitle}>Cobrar cuenta corriente</div>
              {(() => {
                const cc = cuentasCorrientes.find((c) => c._key === showCobrarModal);
                return (<>
                  <div style={{ textAlign: "center", marginBottom: 8, fontWeight: 700 }}>{cc?.nombre}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: G.accent, textAlign: "center", marginBottom: 16 }}>{fmt(cc?.monto)}</div>
                </>);
              })()}
              <div style={{ ...s.payOptions, marginBottom: 20 }}>
                {MEDIOS_PAGO.filter((m) => m.id !== "cuenta_corriente").map((mp) => (
                  <button key={mp.id} style={s.payOption(cobreMedio === mp.id)} onClick={() => setCobreMedio(mp.id)}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{mp.icon}</div>
                    <div>{mp.label}</div>
                  </button>
                ))}
              </div>
              <button style={s.confirmBtn(cargando || !cobreMedio)} onClick={cobrarCC}>
                {cargando ? "Guardando…" : "Confirmar cobro"}
              </button>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast && (
          <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: toast.color, color: "#fff", padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
            {toast.msg}
          </div>
        )}

        {/* BANNER SIN FIREBASE */}
        {fbError && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: "#5C2A0A", color: "#FFD699", padding: "9px 16px", fontSize: 12, textAlign: "center", zIndex: 150 }}>
            ⚠️ Modo local — configurá Firebase para sincronizar entre dispositivos
          </div>
        )}
      </div>
    </>
  );
}

/*
╔══════════════════════════════════════════════════════════════╗
║           GUÍA DE CONFIGURACIÓN — LEER ANTES DE USAR        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  PASO 1 — CREAR BASE DE DATOS EN FIREBASE (gratis)          ║
║  ─────────────────────────────────────────────────────────  ║
║  1. Ir a https://console.firebase.google.com                 ║
║  2. "Crear proyecto" → nombre ej: "buffet-club"             ║
║  3. Build → Realtime Database → Create database              ║
║     → Elegir región → "Start in test mode"                   ║
║  4. Project Settings (⚙️) → General → "Add app" (web)       ║
║  5. Copiar el objeto firebaseConfig                          ║
║  6. Pegarlo en FIREBASE_CONFIG al inicio de este archivo     ║
║                                                              ║
║  PASO 2 — REGLAS DE SEGURIDAD (básicas)                     ║
║  ─────────────────────────────────────────────────────────  ║
║  En Realtime Database → Rules, pegar:                        ║
║  {                                                           ║
║    "rules": { ".read": true, ".write": true }               ║
║  }                                                           ║
║                                                              ║
║  PASO 3 — PUBLICAR COMO APP WEB (PWA)                       ║
║  ─────────────────────────────────────────────────────────  ║
║  1. Crear cuenta en https://vercel.com (gratis, con Google)  ║
║  2. Subir el proyecto a GitHub                               ║
║  3. En Vercel: New Project → importar repo → Deploy          ║
║  4. Compartir la URL con todos en el club                    ║
║                                                              ║
║  PASO 4 — INSTALAR EN EL CELULAR                            ║
║  ─────────────────────────────────────────────────────────  ║
║  iPhone (Safari):                                            ║
║    Botón Compartir → "Agregar a pantalla de inicio"          ║
║  Android (Chrome):                                           ║
║    Menú ⋮ → "Instalar app" o "Agregar a inicio"              ║
║                                                              ║
║  PASO 5 — USAR EL CSV EN GOOGLE SHEETS                      ║
║  ─────────────────────────────────────────────────────────  ║
║  1. En Reportes, elegir rango de fechas                      ║
║  2. Tocar "Exportar CSV"                                     ║
║  3. En Google Sheets: Archivo → Importar → subir el .csv    ║
║     → "Reemplazar hoja de cálculo"                           ║
║  El archivo incluye 3 secciones: detalle, por artículo       ║
║  y por medio de pago.                                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
*/
