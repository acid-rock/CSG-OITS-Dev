import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { type AvailabilityEntry, computeDateStatus } from "./BorrowReservation";
import "./borrow.css";

const API_URL = import.meta.env.VITE_API_URL as string;
const CART_STORAGE_KEY = "csg-borrow-cart";

/* ── Interfaces ─────────────────────────────────────────────────────────────── */

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  max_quantity: number;
  is_available: boolean;
  image?: string | null;
}

export interface CartItem {
  item: InventoryItem;
  qty: number;
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

const FALLBACK_INVENTORY: InventoryItem[] = [
  { id: "9091ce6a-871d-4de2-9008-0cd84ae4fa54", name: "Basketball",              quantity: 1, max_quantity: 1, is_available: true },
  { id: "dfa76261-a0f4-4436-959a-41f337cc4ded", name: "HDMI Cable",              quantity: 1, max_quantity: 1, is_available: true },
  { id: "e6563dec-bfdb-446e-89d9-7f6f85ce2cee", name: "Iwata Fan",               quantity: 1, max_quantity: 1, is_available: true },
  { id: "49cfe9bc-3a74-4aa1-89fd-a9ee316e2f6e", name: "Long Table",              quantity: 2, max_quantity: 2, is_available: true },
  { id: "d97a2657-81d1-4b17-83c3-b0361f79e748", name: "Microphone",              quantity: 1, max_quantity: 1, is_available: true },
  { id: "44684f16-073d-4ab5-8ad2-8ef119f07fb4", name: "Mixer",                   quantity: 1, max_quantity: 1, is_available: true },
  { id: "1c49efaf-e579-40ab-ba8f-e489515761b3", name: "Orange Cones (training)", quantity: 4, max_quantity: 4, is_available: true },
  { id: "15061230-b28f-49f1-873b-d3a84fd4aa41", name: "Projector",               quantity: 1, max_quantity: 1, is_available: true },
  { id: "78a6c8ba-00ad-48a3-8f73-6e41763c43f0", name: "Projector Screen",        quantity: 2, max_quantity: 2, is_available: true },
  { id: "ab83f5a8-9c30-46d8-9c88-8aae90e76928", name: "Soccer Ball",             quantity: 1, max_quantity: 1, is_available: true },
  { id: "90c3cb8c-9c0f-4898-8835-21a17c0632b8", name: "Speaker",                 quantity: 1, max_quantity: 1, is_available: true },
];

const ITEM_GRADIENTS: [string, string][] = [
  ["#1e3a8a", "#4f6fd1"], ["#7c2d12", "#dc2626"], ["#0f766e", "#5eb5af"],
  ["#475569", "#94a3b8"], ["#92400e", "#a87c2d"], ["#3b5fbc", "#8aaae0"],
  ["#1e3a8a", "#3b5fbc"], ["#7c2d12", "#ea580c"],
];

function itemGradient(id: string): [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ITEM_GRADIENTS[Math.abs(h) % ITEM_GRADIENTS.length];
}

function get7Days(): { dateStr: string; name: string; num: number }[] {
  const result: { dateStr: string; name: string; num: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push({
      dateStr: d.toISOString().split("T")[0],
      name: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase().slice(0, 3),
      num: d.getDate(),
    });
  }
  return result;
}

/** Maps computeDateStatus return values to the CSS strip class names */
function stripStatus(
  entries: AvailabilityEntry[],
  dateStr: string,
  maxQty: number,
): "full" | "some" | "none" {
  const s = computeDateStatus(dateStr, entries, maxQty);
  if (s === "full")    return "none"; // fully booked → red
  if (s === "partial") return "some"; // partially    → amber
  return "full";                      // available    → green
}

/* ── Icons ───────────────────────────────────────────────────────────────────── */

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

/* ── Component ───────────────────────────────────────────────────────────────── */

export default function Borrow() {
  const navigate = useNavigate();

  const [inventory, setInventory]         = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoading]    = useState(true);
  const [equipSearch, setEquipSearch]     = useState("");

  // Raw availability entries per item (for 7-day strip)
  const [itemAvail, setItemAvail]         = useState<Map<string, AvailabilityEntry[]>>(new Map());
  const [availLoading, setAvailLoading]   = useState(false);

  // Cart: item id → { item, qty }
  const [cart, setCart]                   = useState<Map<string, CartItem>>(new Map());

  // Pre-compute today's 7-day dates once per render
  const days7 = useMemo(() => get7Days(), []);

  /* ── Inventory fetch ──────────────────────────────────────────────────────── */

  useEffect(() => {
    setLoading(true);
    axios.get<InventoryItem[]>(`${API_URL}/equipment/`)
      .then(({ data }) => setInventory(data))
      .catch(() => setInventory(FALLBACK_INVENTORY))
      .finally(() => setLoading(false));
  }, []);

  /* ── 7-day availability fetch (after inventory loads) ──────────────────────── */

  useEffect(() => {
    if (inventory.length === 0) return;
    let cancelled = false;
    setAvailLoading(true);
    Promise.all(
      inventory.map(async (item) => {
        try {
          const { data } = await axios.get<AvailabilityEntry[]>(
            `${API_URL}/borrowing/availability/${item.id}`
          );
          return [item.id, data] as [string, AvailabilityEntry[]];
        } catch {
          return [item.id, []] as [string, AvailabilityEntry[]];
        }
      })
    ).then((results) => {
      if (!cancelled) {
        setItemAvail(new Map(results));
        setAvailLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [inventory]);

  /* ── LocalStorage cart persistence ──────────────────────────────────────────── */

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        if (Array.isArray(parsed)) {
          setCart(new Map(parsed.map((c) => [c.item.id, c])));
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([...cart.values()]));
    } catch { /* ignore */ }
  }, [cart]);

  /* ── Cart helpers ─────────────────────────────────────────────────────────── */

  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const next = new Map(prev);
      if (!next.has(item.id)) next.set(item.id, { item, qty: 1 });
      return next;
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => { const next = new Map(prev); next.delete(id); return next; });
  };

  const setCartQty = (id: string, qty: number, max: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (existing) next.set(id, { ...existing, qty: Math.max(1, Math.min(qty, max)) });
      return next;
    });
  };

  /* ── Derived ──────────────────────────────────────────────────────────────── */

  const visibleInventory = inventory.filter((item) =>
    !equipSearch.trim() || item.name.toLowerCase().includes(equipSearch.toLowerCase())
  );

  const today = days7[0]?.dateStr ?? "";

  const availableTodayCount = useMemo(() => {
    if (itemAvail.size === 0) return inventory.filter((i) => i.is_available && i.max_quantity > 0).length;
    return inventory.filter((item) => {
      if (!item.is_available || item.max_quantity === 0) return false;
      const entries = itemAvail.get(item.id) ?? [];
      return stripStatus(entries, today, item.max_quantity) !== "none";
    }).length;
  }, [inventory, itemAvail, today]);

  const cartItems    = [...cart.values()];
  const cartCount    = cartItems.length;
  const cartTotalQty = cartItems.reduce((s, c) => s + c.qty, 0);

  /* ── Render ───────────────────────────────────────────────────────────────── */

  return (
    <div className="eq-root">
      {/* ── Hero ── */}
      <section className="eq-hero">
        <div className="eq-hero-bg" />
        <div className="eq-hero-inner">
          <div className="eq-hero-text">
            <h1>Borrow <em>equipment</em></h1>
            <p>
              Reserve items for events and activities. Browse the catalogue, check the 7-day
              availability strips, then build your request and submit — we'll confirm within 24 hours.
            </p>
          </div>
          <div className="eq-hero-stats">
            <div className="eq-hero-stat">
              <span className="eq-hero-stat-num">{loadingInventory ? "—" : inventory.length}</span>
              <span className="eq-hero-stat-lbl">Items in catalog</span>
            </div>
            <div className="eq-hero-stat">
              <span className="eq-hero-stat-num">{availLoading ? "—" : availableTodayCount}</span>
              <span className="eq-hero-stat-lbl">Available today</span>
            </div>
            <div className="eq-hero-stat">
              <span className="eq-hero-stat-num">7d</span>
              <span className="eq-hero-stat-lbl">Booking window</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Catalog ── */}
      <div className="eq-page">
        {/* Controls */}
        <div className="eq-controls">
          <div className="eq-search">
            <SearchIcon />
            <input
              value={equipSearch}
              onChange={(e) => setEquipSearch(e.target.value)}
              placeholder="Search equipment by name…"
            />
          </div>
          <span className="eq-result-count">
            Showing <strong>{visibleInventory.length}</strong>{" "}
            item{visibleInventory.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Section head */}
        <div className="eq-section-head">
          <div>
            <h2>Catalog <em>at a glance</em></h2>
            <p>Each card shows the next 7 days of availability — pick a window before you build your request.</p>
          </div>
          <div className="eq-legend">
            <span><i style={{ background: "var(--color-success-bg)" }} />Free</span>
            <span><i style={{ background: "#fef3c7" }} />Partial</span>
            <span><i style={{ background: "var(--color-danger-bg)" }} />Booked</span>
          </div>
        </div>

        {/* Grid */}
        {loadingInventory ? (
          <div className="eq-loading-state">Loading equipment…</div>
        ) : (
          <div className="eq-grid">
            {visibleInventory.map((item) => {
              const stockOut   = !item.is_available || item.max_quantity === 0;
              const cartEntry  = cart.get(item.id);
              const entries    = itemAvail.get(item.id) ?? [];
              const todayStrip = stripStatus(entries, today, item.max_quantity);
              const isLow      = !stockOut && item.quantity === 1;
              const [g1, g2]   = itemGradient(item.id);
              // Max qty the user can request = today's available quantity
              const todayAvail = (() => {
                if (stockOut) return 0;
                const reserved = entries
                  .filter((e) =>
                    (e.status === "pending" || e.status === "approved") &&
                    e.borrow_date <= today && e.return_date >= today
                  )
                  .reduce((s, e) => s + (e.quantity_requested ?? 1), 0);
                return Math.max(0, item.max_quantity - reserved);
              })();
              const canAdd = !stockOut && todayAvail > 0;

              return (
                <article
                  key={item.id}
                  className={[
                    "eq-card",
                    cartEntry ? "is-added" : "",
                    stockOut  ? "is-out"   : "",
                  ].filter(Boolean).join(" ")}
                >
                  {/* Added flag */}
                  {cartEntry && (
                    <span className="eq-added-flag">Added · {cartEntry.qty}</span>
                  )}

                  {/* Image / placeholder */}
                  <div className="eq-card-img">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="eq-card-img-real"
                        onError={(e) => {
                          const el = e.currentTarget as HTMLImageElement;
                          el.style.display = "none";
                          const next = el.nextElementSibling as HTMLElement | null;
                          if (next) next.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="eq-card-img-fallback"
                      style={{
                        background: `linear-gradient(135deg, ${g1}, ${g2})`,
                        display: item.image ? "none" : "flex",
                      }}
                    >
                      <img src="/CSG_logo.svg" alt="CSG" />
                    </div>
                  </div>

                  {/* Stock pill */}
                  <span className={`eq-stock-pill${stockOut ? " is-out" : isLow ? " is-low" : ""}`}>
                    {stockOut
                      ? "Out of stock"
                      : availLoading
                        ? `${item.quantity} available`
                        : todayStrip === "none"
                          ? "Fully booked today"
                          : `${item.quantity} available`}
                  </span>

                  {/* Card body */}
                  <div className="eq-card-body">
                    <h3 className="eq-card-name">{item.name}</h3>
                    <div className="eq-card-meta">
                      <span>{item.max_quantity} in stock total</span>
                    </div>

                    {/* 7-day availability strip */}
                    {!stockOut && (
                      <div className="eq-avail-strip" title="Availability over the next 7 days">
                        {days7.map((day, i) => {
                          const s = availLoading ? "full" : stripStatus(entries, day.dateStr, item.max_quantity);
                          return (
                            <div
                              key={day.dateStr}
                              className={`eq-avail-day is-${s}${i === 0 ? " is-today" : ""}`}
                            >
                              <span className="eq-avail-day-name">{day.name}</span>
                              <span className="eq-avail-day-num">{day.num}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Card action */}
                    <div className="eq-card-action" style={{ marginTop: 12 }}>
                      {cartEntry ? (
                        <div className="eq-qty">
                          <button
                            type="button"
                            className="eq-qty-btn"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              cartEntry.qty <= 1
                                ? removeFromCart(item.id)
                                : setCartQty(item.id, cartEntry.qty - 1, todayAvail || item.max_quantity)
                            }
                          >−</button>
                          <div className="eq-qty-center">
                            <span className="eq-qty-val">{cartEntry.qty}</span>
                            <span className="eq-qty-val-lbl">In request</span>
                          </div>
                          <button
                            type="button"
                            className="eq-qty-btn"
                            aria-label="Increase quantity"
                            disabled={cartEntry.qty >= (todayAvail || item.max_quantity)}
                            onClick={() =>
                              setCartQty(item.id, cartEntry.qty + 1, todayAvail || item.max_quantity)
                            }
                          >+</button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="eq-btn-add"
                          disabled={!canAdd}
                          onClick={() => canAdd && addToCart(item)}
                        >
                          <PlusIcon />
                          {stockOut ? "Unavailable" : todayStrip === "none" ? "Fully booked" : "Add to request"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="eq-sticky-spacer" />
      </div>

      {/* ── Sticky cart bar ── */}
      {cartCount > 0 && (
        <div className="eq-sticky-bar">
          <div className="eq-sticky-bar-inner">
            <div className="eq-sticky-bar-text">
              <span className="eq-sticky-bar-count">{cartTotalQty}</span>
              <div className="eq-sticky-bar-meta">
                <span className="eq-sticky-bar-lbl">In your request</span>
                <span className="eq-sticky-bar-val">
                  {cartItems.map((c) => `${c.qty}× ${c.item.name}`).join(" · ")}
                </span>
              </div>
            </div>
            <div className="eq-sticky-bar-actions">
              <button
                type="button"
                className="eq-sticky-bar-clear"
                onClick={() => setCart(new Map())}
              >
                Clear all
              </button>
              <button
                type="button"
                className="eq-sticky-bar-cta"
                onClick={() =>
                  navigate("/borrow/checkout", { state: { cartItems } })
                }
              >
                Review request <ArrowIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
