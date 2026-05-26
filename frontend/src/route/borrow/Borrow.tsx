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
  const [equipFilter, setEquipFilter] = useState<"all" | "available" | "unavailable">("all");
  const [equipSearch, setEquipSearch] = useState("");

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

  const visibleInventory = inventory.filter((item) => {
    if (equipFilter === "available"   && !item.is_available) return false;
    if (equipFilter === "unavailable" && item.is_available)  return false;
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
          <div className="eq-filters">
            {(["all", "available", "unavailable"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`eq-pill${equipFilter === f ? " eq-pill-active" : ""}`}
                onClick={() => setEquipFilter(f)}
              >
                {f === "all" ? "All" : f === "available" ? "Available" : "Unavailable"}
              </button>
            ))}
          </div>
        </div>

        {loadingInventory && <p className="borrow-loading">Loading equipment...</p>}
        {inventoryError  && <p className="borrow-error">{inventoryError}</p>}

        {!loadingInventory && !inventoryError && (
          <div className="eq-grid">
            {visibleInventory.map((item) => (
              <div key={item.id} className="eq-card card">
                <span className={`eq-status ${item.is_available ? "eq-status-ok" : "eq-status-out"}`}>
                  ● {item.is_available ? "AVAILABLE" : "OUT"}
                </span>

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
                    {item.quantity} of {item.max_quantity} in stock
                  </div>
                  <button
                    className={`btn ${item.is_available && item.quantity > 0 ? "btn-primary" : ""} eq-req-btn`}
                    disabled={!item.is_available || item.quantity === 0}
                    onClick={() =>
                      item.is_available && item.quantity > 0 && navigate(`/borrow/${item.id}`)
                    }
                    style={
                      !item.is_available || item.quantity === 0
                        ? { background: "var(--color-border)", color: "var(--color-text-muted)", cursor: "not-allowed" }
                        : undefined
                    }
                  >
                    {item.is_available && item.quantity > 0 ? "Reserve Equipment" : "Out of Stock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
