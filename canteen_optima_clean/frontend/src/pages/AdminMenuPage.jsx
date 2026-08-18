import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function AdminMenuPage() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Snacks');
  const [stock, setStock] = useState('');
  const [available, setAvailable] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Fetch Menu from API Gateway
  const fetchMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/menu');
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setMenu(data);
    } catch (err) {
      setError(`Failed to load menu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Reset form
  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory('Snacks');
    setStock('');
    setAvailable(true);
    setEditingId(null);
  };

  // Submit Add / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !stock) {
      alert('Please fill out all fields.');
      return;
    }

    const payload = {
      name,
      price: Number(price),
      category,
      stock: Number(stock),
      available: !!available
    };

    try {
      let res;
      if (editingId) {
        // Edit Menu Item
        res = await fetch(`http://localhost:8000/api/menu/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Add Menu Item
        res = await fetch('http://localhost:8000/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save menu item.');
      }

      resetForm();
      fetchMenu();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  // Trigger Edit mode
  const handleEditClick = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.price);
    setCategory(item.category || 'Snacks');
    setStock(item.stock);
    setAvailable(item.available);
  };

  // Delete Menu Item
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/menu/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed.');
      fetchMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <PageHeader 
        title="Admin Menu Management" 
        description="Add new dishes, modify pricing, adjust stock levels, or toggle availability." 
      />

      {error && (
        <div className="connection-error" style={{ marginBottom: '2rem' }}>
          <AlertTriangle size={20} />
          <div>
            <span style={{ fontWeight: 600 }}>Connection Notice:</span> {error}
            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }} onClick={fetchMenu}>
              <RefreshCw size={12} style={{ marginRight: '0.25rem' }} /> Retry Connection
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Card: Add / Edit Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', fontFamily: 'inherit' }}>
            {editingId ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Item Name</label>
              <input type="text" className="input-field" placeholder="e.g. Veg Sandwich" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Price (₹)</label>
                <input type="number" className="input-field" placeholder="40" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Initial Stock</label>
                <input type="number" className="input-field" placeholder="50" value={stock} onChange={e => setStock(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category</label>
              <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="Snacks">Snacks</option>
                <option value="Meals">Meals</option>
                <option value="Beverages">Beverages</option>
                <option value="Desserts">Desserts</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" id="available" checked={available} onChange={e => setAvailable(e.target.checked)} />
              <label htmlFor="available" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Available for ordering</label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {editingId ? 'Update Item' : 'Add Item'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        {/* Card: Current Menu Table */}
        <div className="card">
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', fontFamily: 'inherit' }}>Current Canteen Menu</h3>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem 0' }}>Item Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menu.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</td>
                      <td>{item.category || 'Snacks'}</td>
                      <td style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>₹{item.price}</td>
                      <td>{item.stock} units</td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#fff',
                          backgroundColor: item.available && item.stock > 0 ? '#38A169' : '#E53E3E'
                        }}>
                          {item.available && item.stock > 0 ? 'AVAILABLE' : 'UNAVAILABLE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => handleEditClick(item)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '0.25rem', borderRadius: '4px', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }} onClick={() => handleDelete(item.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {menu.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No items in menu. Use the form to add some.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
