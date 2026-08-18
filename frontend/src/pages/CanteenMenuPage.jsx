import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function CanteenMenuPage() {
  const [menu, setMenu] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Fetch menu on load
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/menu');
      if (!res.ok) throw new Error('Failed to fetch canteen menu');
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

  const handleIncrement = (itemId) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 1) + 1
    }));
  };

  const handleDecrement = (itemId) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) - 1)
    }));
  };

  const addToCart = (item) => {
    const qty = quantities[item.id] || 1;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { ...item, quantity: qty }];
    });
    // Reset quantity input
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
    setSuccessMsg(`Added ${qty} × ${item.name} to cart!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setLoading(true);
      
      // Step 1: Concurrency Stock Lock & Deduction
      const deductPayload = {
        itemsToDeduct: cart.map(item => ({
          id: item.id,
          quantity: item.quantity
        }))
      };

      const deductRes = await fetch('http://localhost:8000/api/menu/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deductPayload)
      });

      const deductData = await deductRes.json();
      if (!deductRes.ok) {
        throw new Error(deductData.error || 'Deduction failed');
      }

      // Step 2: Create Canteen Order
      const orderPayload = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: cartTotal
      };

      const orderRes = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to place order');
      }

      // Success
      alert(`Order ${orderData.id} placed successfully! Notification and Kitchen events emitted.`);
      setCart([]);
      fetchMenu(); // Refresh stock counts
    } catch (err) {
      alert(`Checkout Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '4rem', display: 'grid', gridTemplateColumns: cart.length > 0 ? '3fr 1.2fr' : '1fr', gap: '2rem' }}>
      
      <div>
        <PageHeader 
          title="Canteen Menu" 
          description="Browse campus canteen menu items, customize quantities, and place orders directly to the kitchen queue." 
        />

        {successMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(56, 161, 105, 0.1)', color: '#38A169', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <AlertCircle size={16} />
            <span>Connection Warning: {error}. Check if backend Menu Service is running.</span>
          </div>
        )}

        {loading && menu.length === 0 ? (
          <div className="text-center" style={{ padding: '2rem' }}>Loading menu items...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {menu.map(item => {
              const qty = quantities[item.id] || 1;
              const isOutOfStock = item.stock <= 0;

              return (
                <div key={item.id} className="card" style={{ opacity: isOutOfStock ? 0.6 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{item.name}</h3>
                      <strong style={{ color: 'var(--accent-red)' }}>₹{item.price}</strong>
                    </div>
                    <p className="text-xs text-muted" style={{ marginBottom: '0.75rem' }}>
                      Category: {item.category || 'General'}
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
                      <span>Stock: <strong>{item.stock} left</strong></span>
                      <span>Calories: <strong>{item.calories} kcal</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', border: 'none', borderRadius: 0 }} onClick={() => handleDecrement(item.id)} disabled={isOutOfStock}>
                        <Minus size={14} />
                      </button>
                      <span style={{ minWidth: '30px', textAlign: 'center', fontSize: '0.9rem' }}>{qty}</span>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', border: 'none', borderRadius: 0 }} onClick={() => handleIncrement(item.id)} disabled={isOutOfStock}>
                        <Plus size={14} />
                      </button>
                    </div>

                    <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => addToCart(item)} disabled={isOutOfStock}>
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Summary Panel */}
      {cart.length > 0 && (
        <div className="card" style={{ position: 'sticky', top: '2rem', height: 'fit-content', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            <ShoppingCart size={18} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Cart Summary</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div>
                  <div><strong>{item.name}</strong></div>
                  <div className="text-muted">{item.quantity} × ₹{item.price}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span>₹{item.quantity * item.price}</span>
                  <button style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontSize: '0.7rem', padding: 0, cursor: 'pointer' }} onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total:</span>
            <span>₹{cartTotal}</span>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCheckout}>
            Place Order
          </button>
        </div>
      )}

    </div>
  );
}
