import React, { useState, useEffect } from 'react';
import { ShoppingCart, RefreshCw, AlertTriangle, Plus, Minus, CheckCircle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

export default function Home() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cart state: item ID -> quantity
  const [cart, setCart] = useState({});
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);

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
      setError(`Failed to load menu items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Cart operations
  const addToCart = (id) => {
    const item = menu.find(m => m.id === id);
    if (!item) return;

    setCart(prev => {
      const currentQty = prev[id] || 0;
      if (currentQty >= item.stock) {
        alert(`Cannot add more. Only ${item.stock} units available in stock.`);
        return prev;
      }
      return { ...prev, [id]: currentQty + 1 };
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const currentQty = prev[id] || 0;
      if (currentQty <= 1) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: currentQty - 1 };
    });
  };

  const clearCart = () => setCart({});

  // Compute Cart stats
  const cartItems = Object.keys(cart).map(id => {
    const menuItem = menu.find(m => m.id === id);
    return {
      ...menuItem,
      quantity: cart[id]
    };
  }).filter(item => item !== undefined);

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Place Order Handler
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    setPlacingOrder(true);
    setPlacedOrderId(null);
    try {
      // 1. Deduct Stock on Menu-Service first to verify Mutex Lock
      const deductRes = await fetch('http://localhost:8000/api/menu/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemsToDeduct: cartItems.map(item => ({ id: item.id, quantity: item.quantity }))
        })
      });

      const deductData = await deductRes.json();
      if (!deductRes.ok) {
        throw new Error(deductData.error || 'Failed to deduct menu stock inventory.');
      }

      // 2. Place Order on Order-Service
      const orderRes = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
          total: cartTotal
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to register order record.');
      }

      // Order success!
      setPlacedOrderId(orderData.id);
      clearCart();
      fetchMenu(); // Refresh stock in visual list
    } catch (err) {
      alert(`Order placement failed: ${err.message}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <PageHeader 
        title="College Canteen Ordering Catalog" 
        description="Select fresh meals, manage your shopping cart, and place orders with transaction integrity." 
      />

      {placedOrderId && (
        <div style={{ 
          backgroundColor: 'rgba(56, 161, 105, 0.1)', 
          border: '1px solid #38A169', 
          color: '#38A169', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CheckCircle size={24} />
          <div>
            <strong style={{ display: 'block' }}>Order Placed Successfully!</strong>
            <span style={{ fontSize: '0.85rem' }}>Your Order ID is <strong>{placedOrderId}</strong>. View status logs on the Kitchen dashboard.</span>
          </div>
        </div>
      )}

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

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Menu Items Catalog Grid */}
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'inherit' }}>Fresh Menu Items</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {menu.map(item => (
                <div key={item.id} className="card" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  opacity: item.stock === 0 || !item.available ? 0.7 : 1
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.125rem 0.5rem', 
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-sidebar)',
                        color: 'var(--accent-red)',
                        fontWeight: 600
                      }}>
                        {item.category || 'Snacks'}
                      </span>
                      <strong style={{ color: 'var(--accent-orange)' }}>₹{item.price}</strong>
                    </div>
                    <h4 style={{ fontSize: '1.2rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)' }}>{item.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                      Calories: {item.calories || 200} kcal
                    </p>
                  </div>
                  
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                      <span>Availability:</span>
                      <strong style={{ color: item.available && item.stock > 0 ? '#38A169' : '#E53E3E' }}>
                        {item.available && item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '1rem' }}>
                      <span>Remaining Stock:</span>
                      <strong>{item.stock} units</strong>
                    </div>

                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                      disabled={item.stock === 0 || !item.available}
                      onClick={() => addToCart(item.id)}
                    >
                      Add To Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Panel Sidebar */}
          <div className="card" style={{ position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <ShoppingCart size={20} color="var(--accent-red)" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'inherit' }}>Your Order Cart</h3>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-sm text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>
                Your cart is empty. Select meals from the catalog to add.
              </p>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', pb: '1rem' }}>
                  {cartItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <div>
                        <strong style={{ display: 'block' }}>{item.name}</strong>
                        <span className="text-muted text-xs">₹{item.price} × {item.quantity}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button style={{ padding: '0.1rem 0.25rem', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '4px' }} onClick={() => removeFromCart(item.id)}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                        <button style={{ padding: '0.1rem 0.25rem', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '4px' }} onClick={() => addToCart(item.id)}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>
                  <span>Total Bill:</span>
                  <span style={{ color: 'var(--accent-orange)' }}>₹{cartTotal}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button className="btn btn-primary" style={{ width: '100%' }} disabled={placingOrder} onClick={handlePlaceOrder}>
                    {placingOrder ? 'Processing Lock...' : 'Place Order'}
                  </button>
                  <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.35rem' }} onClick={clearCart}>
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
