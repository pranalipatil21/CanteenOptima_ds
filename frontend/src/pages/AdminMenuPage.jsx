import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, RefreshCw, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function AdminMenuPage() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    calories: '',
    weight: ''
  });

  // Editing State
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});

  const fetchMenu = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/menu');
      if (!res.ok) throw new Error('Failed to load menu');
      const data = await res.json();
      setMenu(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) {
      alert('Name and price are required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create item');
      }

      setNewItem({ name: '', price: '', category: '', stock: '', calories: '', weight: '' });
      fetchMenu();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditFields({
      price: item.price,
      stock: item.stock,
      category: item.category || 'General'
    });
  };

  const handleUpdate = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFields)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update item');
      }

      setEditingId(null);
      fetchMenu();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/menu/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete item');
      fetchMenu();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '4rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
      
      <div>
        <PageHeader 
          title="Menu Inventory Manager" 
          description="Update canteen items, replenish stock, modify pricing, and delete items from the Menu Service." 
        />

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <AlertTriangle size={16} />
            <span>Connection Warning: {error}. Check if Menu Service is running.</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {menu.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem' }}>
              {editingId === item.id ? (
                // Editing Layout
                <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span className="text-xs text-muted">Price (₹):</span>
                    <input type="number" className="input-field" style={{ width: '80px', padding: '0.25rem' }} value={editFields.price} onChange={e => setEditFields(prev => ({ ...prev, price: e.target.value }))} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span className="text-xs text-muted">Stock:</span>
                    <input type="number" className="input-field" style={{ width: '80px', padding: '0.25rem' }} value={editFields.stock} onChange={e => setEditFields(prev => ({ ...prev, stock: e.target.value }))} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span className="text-xs text-muted">Category:</span>
                    <input type="text" className="input-field" style={{ width: '100px', padding: '0.25rem' }} value={editFields.category} onChange={e => setEditFields(prev => ({ ...prev, category: e.target.value }))} />
                  </div>
                </div>
              ) : (
                // View Layout
                <div style={{ display: 'flex', gap: '2rem', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 600, minWidth: '150px' }}>{item.name}</div>
                  <div style={{ fontSize: '0.85rem' }}>Price: <strong style={{ color: 'var(--accent-red)' }}>₹{item.price}</strong></div>
                  <div style={{ fontSize: '0.85rem' }}>Stock: <strong style={{ color: item.stock <= 0 ? 'var(--accent-red)' : 'var(--state-checking)' }}>{item.stock} left</strong></div>
                  <div style={{ fontSize: '0.85rem' }} className="text-muted">Category: {item.category || 'General'}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                {editingId === item.id ? (
                  <>
                    <button className="btn btn-primary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleUpdate(item.id)}>
                      <Save size={14} />
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setEditingId(null)}>
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={() => startEdit(item)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }} onClick={() => handleDelete(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Item Panel */}
      <div className="card" style={{ height: 'fit-content', padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Add Menu Item
        </h3>
        
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Item Name *</label>
            <input type="text" className="input-field" style={{ width: '100%' }} value={newItem.name} onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Price (₹) *</label>
              <input type="number" className="input-field" style={{ width: '100%' }} value={newItem.price} onChange={e => setNewItem(prev => ({ ...prev, price: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Initial Stock</label>
              <input type="number" className="input-field" style={{ width: '100%' }} value={newItem.stock} onChange={e => setNewItem(prev => ({ ...prev, stock: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Category</label>
            <input type="text" className="input-field" style={{ width: '100%' }} value={newItem.category} onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))} placeholder="e.g. Snacks, Drinks" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Calories (kcal)</label>
              <input type="number" className="input-field" style={{ width: '100%' }} value={newItem.calories} onChange={e => setNewItem(prev => ({ ...prev, calories: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.25rem' }}>Weight (units)</label>
              <input type="number" className="input-field" style={{ width: '100%' }} value={newItem.weight} onChange={e => setNewItem(prev => ({ ...prev, weight: e.target.value }))} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Add Item to Menu
          </button>
        </form>
      </div>

    </div>
  );
}
