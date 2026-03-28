import { useState } from 'react';
import './Inventory.css'
import { inventoryConfig } from './inventoryData';

const filterByStatus = (status: boolean, filter: string): boolean => {
  if (!filter || filter === 'All') return true;
  if (filter === 'In Stock') return status === true;
  if (filter === 'Out of Stock') return status === false;
  return true;
};

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState(0);
  const [editStatus, setEditStatus] = useState(true);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [sort, setSort] = useState<string>('Name (A-Z)');

  const handleActive = (itemId: string) => {
    setActive((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };


  return (
    <div className='inventory-container'>
      <div className='inventory-header'>
        <span>Inventory</span>
      </div>

      <div className='inventory-toolbar'>
        <span className='inventory-file-count'>
          {inventoryConfig.length} Items
        </span>
        <div className='inventory-toolbar-actions'>
          <button
            className='inventory-add-btn'
            onClick={() => {
              setId(null);
              setEditName('');
              setEditQuantity(0);
              setEditStatus(true);
              setOpen(true);
            }}
          >
            Add Item
          </button>
        </div>
      </div>

      <div className='inventory-file-table'>
        <table>
          <colgroup>
            <col className='col-checkbox' />
            <col className='col-id' />
            <col className='col-name' />
            <col className='col-quantity' />
            <col className='col-status' />
            <col className='col-actions' />
          </colgroup>
          <thead>
            <tr className='inventory-table-header-light'>
              <th>
                <input
                  type='checkbox'
                  title='Select All'
                  checked={active.length === inventoryConfig.length}
                  onChange={() => {
                    if (active.length === inventoryConfig.length) {
                      setActive([]);
                    } else {
                      setActive(inventoryConfig.map((item) => item.id));
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
            {inventoryConfig
              .filter((item) => filterByStatus(item.status, filter))
              .sort((a, b) => {
                if (sort === 'Name (A-Z)') return a.name.localeCompare(b.name);
                if (sort === 'Name (Z-A)') return b.name.localeCompare(a.name);
                if (sort === 'Quantity (High-Low)') return b.quantity - a.quantity;
                if (sort === 'Quantity (Low-High)') return a.quantity - b.quantity;
                return 0;
              })
              .map((item, idx) => (
                <tr
                  key={idx}
                  className={`inventory-table-row ${active.includes(item.id) ? 'inventory-active' : ''}`}
                >
                  <td>
                    <input
                      className='checkbox'
                      type='checkbox'
                      title={`Select ${item.name}`}
                      checked={active.includes(item.id)}
                      onChange={() => handleActive(item.id)}
                    />
                  </td>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.status ? 'In Stock' : 'Out of Stock'}</td>
                  <td className='inventory-file-btn'>
                    <div className='inventory-file-btn-inner'>
                      <img
                        src='/bin.png'
                        alt='Delete'
                        onClick={() => {
                          setId(item.id);
                          setIsModalOpen(true);
                        }}
                      />
                      <img
                        src='/edit.png'
                        alt='Edit'
                        onClick={() => {
                          setId(item.id);
                          setEditName(item.name);
                          setEditQuantity(item.quantity);
                          setEditStatus(item.status);
                          setOpen(true);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

    
    </div>
  );
};

export default Inventory;