import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchFilterBar from "../../components/search-filter-bar/SearchFilterBar";
import "./borrow.css";

const API_URL = import.meta.env.VITE_API_URL as string;

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  max_quantity: number;
  is_available: boolean;
  image?: string | null;
}

interface AvailabilityEntry {
  borrow_date: string;
  return_date: string;
  status: 'pending' | 'approved';
  quantity_requested: number;
}

const todayStr = () => new Date().toISOString().split('T')[0];

const maxDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

function formatCheckDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const FALLBACK_INVENTORY: InventoryItem[] = [
  { id: "9091ce6a-871d-4de2-9008-0cd84ae4fa54", name: "Basketball",               quantity: 1, max_quantity: 1, is_available: true },
  { id: "dfa76261-a0f4-4436-959a-41f337cc4ded", name: "HDMI Cable",               quantity: 1, max_quantity: 1, is_available: true },
  { id: "e6563dec-bfdb-446e-89d9-7f6f85ce2cee", name: "Iwata Fan",                quantity: 1, max_quantity: 1, is_available: true },
  { id: "49cfe9bc-3a74-4aa1-89fd-a9ee316e2f6e", name: "Long Table",               quantity: 2, max_quantity: 2, is_available: true },
  { id: "d97a2657-81d1-4b17-83c3-b0361f79e748", name: "Microphone",               quantity: 1, max_quantity: 1, is_available: true },
  { id: "44684f16-073d-4ab5-8ad2-8ef119f07fb4", name: "Mixer",                    quantity: 1, max_quantity: 1, is_available: true },
  { id: "1c49efaf-e579-40ab-ba8f-e489515761b3", name: "Orange Cones (training)",  quantity: 4, max_quantity: 4, is_available: true },
  { id: "15061230-b28f-49f1-873b-d3a84fd4aa41", name: "Projector",                quantity: 1, max_quantity: 1, is_available: true },
  { id: "78a6c8ba-00ad-48a3-8f73-6e41763c43f0", name: "Projector Screen",         quantity: 2, max_quantity: 2, is_available: true },
  { id: "ab83f5a8-9c30-46d8-9c88-8aae90e76928", name: "Soccer Ball",              quantity: 1, max_quantity: 1, is_available: true },
  { id: "90c3cb8c-9c0f-4898-8835-21a17c0632b8", name: "Speaker",                  quantity: 1, max_quantity: 1, is_available: true },
];

export default function Borrow() {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [equipSearch, setEquipSearch] = useState("");

  // Date-availability overlay — defaults to today, capped at +7 days
  const [checkDate, setCheckDate] = useState<string>(todayStr);
  const [dateAvailability, setDateAvailability] = useState<Map<string, number>>(new Map());
  const [dateLoading, setDateLoading] = useState(false);

  const fetchInventory = async () => {
    setLoadingInventory(true);
    setInventoryError(null);
    try {
      const { data } = await axios.get(`${API_URL}/equipment/`);
      setInventory(data);
    } catch {
      setInventory(FALLBACK_INVENTORY);
      setInventoryError(null);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  // When the date or inventory changes, fetch availability for every item in parallel
  useEffect(() => {
    if (inventory.length === 0) {
      setDateAvailability(new Map());
      return;
    }
    let cancelled = false;
    setDateLoading(true);
    Promise.all(
      inventory.map(async (item) => {
        try {
          const { data } = await axios.get<AvailabilityEntry[]>(
            `${API_URL}/borrowing/availability/${item.id}`
          );
          // Sum up quantity already reserved that overlaps checkDate
          const reserved = data
            .filter(
              (e) =>
                (e.status === "pending" || e.status === "approved") &&
                e.borrow_date <= checkDate &&
                e.return_date >= checkDate
            )
            .reduce((sum, e) => sum + (e.quantity_requested ?? 1), 0);
          return [item.id, Math.max(0, item.max_quantity - reserved)] as [string, number];
        } catch {
          // Fallback: assume full quantity available
          return [item.id, item.quantity] as [string, number];
        }
      })
    ).then((results) => {
      if (!cancelled) {
        setDateAvailability(new Map(results));
        setDateLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [checkDate, inventory]);

  // Effective available qty for a given item on the selected date
  const effectiveQty = (item: InventoryItem): number =>
    dateAvailability.get(item.id) ?? item.quantity;

  const visibleInventory = inventory.filter((item) => {
    if (equipSearch.trim() && !item.name.toLowerCase().includes(equipSearch.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="eq-page">
      {/* Hero */}
      <div className="eq-hero">
        <div className="eq-hero-inner">
          <span
            className="section-label"
            style={{ display: "block", textAlign: "center", marginBottom: "var(--space-3)" }}
          >
            CSG Resources
          </span>
          <h1 className="eq-hero-heading">
            <em className="italic-accent">Reserve</em> equipment
          </h1>
          <p className="eq-hero-sub">
            Reserve CSG-managed equipment for your org events, classes, or campus activities.
            Pick a date on the availability calendar and submit your request — we'll confirm
            within 24 hours.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="bl-toolbar-wrap">
        <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", padding: "0 var(--section-padding-x)" }}>
          <SearchFilterBar
            searchValue={equipSearch}
            onSearchChange={setEquipSearch}
            showTermFilter={false}
            searchPlaceholder="Search equipment..."
          />
        </div>
      </div>

      {/* Inventory */}
      <div className="eq-content">
        <div className="eq-inventory-header">
          <h2 className="eq-inventory-title">Equipment inventory</h2>
          <div className="eq-date-filter">
            <CalendarIcon />
            <input
              type="date"
              className="eq-date-input"
              value={checkDate}
              min={todayStr()}
              max={maxDateStr()}
              onChange={(e) => setCheckDate(e.target.value)}
              aria-label="Check availability for date"
            />
            {dateLoading && <span className="eq-date-checking">Checking…</span>}
          </div>
        </div>

        {!dateLoading && (
          <p className="eq-date-caption">
            Showing availability for <strong>{formatCheckDate(checkDate)}</strong>
            <span className="eq-date-limit"> · Reservations open up to 7 days in advance</span>
          </p>
        )}

        {loadingInventory && <p className="borrow-loading">Loading equipment...</p>}
        {inventoryError  && <p className="borrow-error">{inventoryError}</p>}

        {!loadingInventory && !inventoryError && (
          <div className="eq-grid">
            {visibleInventory.map((item) => {
              const qty          = effectiveQty(item);
              const stockOut     = !item.is_available || item.max_quantity === 0;
              const dateBooked   = checkDate && qty === 0;
              const datePartial  = checkDate && qty > 0 && qty < item.max_quantity;
              const canReserve   = !stockOut && !dateBooked;

              return (
                <div
                  key={item.id}
                  className={`eq-card card${dateBooked ? " eq-card--booked" : ""}`}
                >
                  {/* Date-aware status badge (only shown when date is selected) */}
                  {checkDate && !stockOut && (
                    <span
                      className={`eq-status ${
                        dateBooked   ? "eq-status-booked"  :
                        datePartial  ? "eq-status-partial" :
                        "eq-status-ok"
                      }`}
                    >
                      {dateBooked
                        ? "● FULLY BOOKED"
                        : datePartial
                          ? `● ${qty} of ${item.max_quantity} free`
                          : `● ${qty} available`}
                    </span>
                  )}
                  {/* Stock-out badge (always shown when item is flagged unavailable) */}
                  {stockOut && (
                    <span className="eq-status eq-status-out">● OUT OF STOCK</span>
                  )}

                  <div className="eq-thumb">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="eq-thumb-img"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                          (e.currentTarget.nextSibling as HTMLElement | null)?.removeAttribute("style");
                        }}
                      />
                    ) : null}
                    <img
                      src="/CSG_logo.svg"
                      alt="CSG"
                      className="eq-thumb-logo"
                      style={item.image ? { display: "none" } : undefined}
                    />
                  </div>

                  <div className="eq-card-body">
                    <div className="eq-item-name">{item.name}</div>
                    <div className="eq-item-stock">
                      {item.max_quantity} in stock
                    </div>
                    <button
                      className={`btn ${canReserve ? "btn-primary" : ""} eq-req-btn`}
                      disabled={!canReserve}
                      onClick={() => canReserve && navigate(`/borrow/${item.id}`)}
                      style={
                        !canReserve
                          ? { background: "var(--color-border)", color: "var(--color-text-muted)", cursor: "not-allowed" }
                          : undefined
                      }
                    >
                      {stockOut
                        ? "Out of Stock"
                        : dateBooked
                          ? "Fully Booked"
                          : "Reserve Equipment"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
