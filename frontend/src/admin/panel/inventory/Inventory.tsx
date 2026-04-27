import { useEffect, useState } from "react";
import "./Inventory.css";
import Form from "../../components/form/Form";
import DeleteModal from "../../components/modals/deleteModal/DeleteModal";
import fetchInventory from "../../../config/inventoryConfig";
import { type Inventory } from "../../../root-layout/Root-layout";

const filterByStatus = (status: boolean, filter: string): boolean => {
  if (!filter || filter === "All") return true;
  if (filter === "In Stock") return status === true;
  if (filter === "Out of Stock") return status === false;
  return true;
};

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState(0);
  const [openEdit, setOpenEdit] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [sort, setSort] = useState<string>("Name (A-Z)");
  const [inventory, setInventory] = useState<Inventory[]>([]);

  const handleActive = (itemId: string) => {
    setActive((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchInventory();
      setInventory(data);
    };
    fetchData();
  }, []);

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <span>Inventory</span>
      </div>
      <div className="inventory-toolbar">
        <span className="inventory-file-count">{inventory.length} Items</span>
        <div className="inventory-toolbar-actions">
          <button
            className="inventory-add-btn"
            onClick={() => {
              setId(null);
              setEditName("");
              setEditQuantity(0);
              setOpenEdit(true);
            }}
          >
            Add Item
          </button>
        </div>
      </div>
      <div className="inventory-file-table">
        <table>
          <colgroup>
            <col className="col-checkbox" />
            <col className="col-id" />
            <col className="col-name" />
            <col className="col-quantity" />
            <col className="col-status" />
            <col className="col-actions" />
          </colgroup>
          <thead>
            <tr className="inventory-table-header-light">
              <th>
                <input
                  type="checkbox"
                  title="Select All"
                  checked={active.length === inventory.length}
                  onChange={() => {
                    if (active.length === inventory.length) {
                      setActive([]);
                    } else {
                      setActive(inventory.map((item) => item.id));
                    }
                  }}
                />
              </th>
              <th>ID</th>
              <th>Name</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory
              .filter((item) =>
                filterByStatus(
                  item.status === "In Stock" ? true : false,
                  filter,
                ),
              )
              .sort((a, b) => {
                if (sort === "Name (A-Z)") return a.name.localeCompare(b.name);
                if (sort === "Name (Z-A)") return b.name.localeCompare(a.name);
                if (sort === "Quantity (High-Low)")
                  return b.quantity - a.quantity;
                if (sort === "Quantity (Low-High)")
                  return a.quantity - b.quantity;
                return 0;
              })
              .map((item, idx) => (
                <tr
                  key={idx}
                  className={`inventory-table-row ${active.includes(item.id) ? "inventory-active" : ""}`}
                >
                  <td>
                    <input
                      className="checkbox"
                      type="checkbox"
                      title={`Select ${item.name}`}
                      checked={active.includes(item.id)}
                      onChange={() => handleActive(item.id)}
                    />
                  </td>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>
                    {item.quantity}/{item.max_quantity}
                  </td>
                  <td>
                    {item.status === "In Stock" ? "In Stock" : "Out of Stock"}
                  </td>
                  <td className="inventory-file-btn">
                    <div className="inventory-file-btn-inner">
                      <img
                        src="/bin.png"
                        alt="Delete"
                        onClick={() => {
                          setId(item.id);
                          setIsModalOpen(true);
                        }}
                      />
                      <img
                        src="/edit.png"
                        alt="Edit"
                        onClick={() => {
                          setId(item.id);
                          setEditName(item.name);
                          setEditQuantity(item.quantity);
                          setOpenEdit(true);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {openEdit && (
        <div className="inventory-form-position">
          <Form
            forType="inventory"
            id={id}
            initialTitle={editName}
            inventoryQuantity={editQuantity}
            setOpen={setOpenEdit}
          />
        </div>
      )}

      {isModalOpen && (
        <div className="inventory-modal-position">
          <DeleteModal
            isOpen={isModalOpen}
            source="inventory"
            id={id}
            onClose={() => setIsModalOpen(false)}
            onConfirm={() => {
              setInventory((prev) => prev.filter((item) => item.id !== id));
              setActive((prev) => prev.filter((itemId) => itemId !== id));
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Inventory;

{
  /*fix inventory form css and conditional rendering througout the panel*/
}
