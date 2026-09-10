import React, { useState, useEffect } from 'react';
import { memberApi } from '../services/memberApi';
import DummyPaymentGateway from './DummyPaymentGateway';
import ReceiptModal from './ReceiptModal';
import { initiateRazorpayPayment } from '../services/razorpayService';


const DEFAULT_PRODUCTS = [
  {
    id: "muscleblaze-biozyme",
    name: "MuscleBlaze Biozyme Performance Whey",
    category: "protein",
    price: 2799,
    origPrice: 3499,
    rating: 4.9,
    reviews: 2450,
    tag: "50% Absorbability",
    tagClass: "best-seller",
    image: "/assets/images/muscleblaze_whey.png",
    desc: "Clinically tested 50% higher protein absorption rate. Biozyme Performance Whey with Enhanced Absorption Formula (EAF). Rich Chocolate, 2.0kg tub.",
    specs: {
      "Weight": "2.0 kg (4.4 lbs)",
      "Protein / Serving": "25g",
      "EAF Absorbability": "50% Higher",
      "Flavor": "Rich Milk Chocolate",
      "Servings": "50"
    }
  },
  {
    id: "gnc-whey-pro",
    name: "GNC Pro Performance 100% Whey",
    category: "protein",
    price: 3199,
    origPrice: 3999,
    rating: 4.8,
    reviews: 1890,
    tag: "Official Brand",
    tagClass: "best-seller",
    image: "/assets/images/gnc_whey.png",
    desc: "Instantized 100% Whey Protein with 24g ultra-pure protein and 5.5g BCAAs per scoop. Fast absorbing muscle recovery blend. Chocolate Fudge flavor.",
    specs: {
      "Weight": "2.0 kg (4.4 lbs)",
      "Protein / Serving": "24g",
      "BCAAs": "5.5g",
      "Flavor": "Chocolate Fudge",
      "Servings": "57"
    }
  },
  {
    id: "wellcore-creatine",
    name: "Wellcore Pure Micronized Creatine Powder",
    category: "strength",
    price: 1299,
    origPrice: 1699,
    rating: 4.9,
    reviews: 3120,
    tag: "Best Seller",
    tagClass: "best-seller",
    image: "/assets/images/wellcore_creatine.png",
    desc: "100% Pure Unflavored Micronized Creatine Monohydrate. Rapid ATP synthesis, uncompromised purity for explosive strength & muscular endurance.",
    specs: {
      "Weight": "250g Jar",
      "Serving Size": "3g",
      "Purity": "100% Micronized",
      "Flavor": "Unflavored",
      "Servings": "83"
    }
  },
  {
    id: "whey-isolate",
    name: "Apex Whey Protein Isolate",
    category: "protein",
    price: 2999,
    origPrice: 3799,
    rating: 4.8,
    reviews: 1248,
    tag: "Pure Isolate",
    tagClass: "best-seller",
    image: "/assets/images/whey_protein.png",
    desc: "100% Pure cross-flow microfiltered isolate. Chocolate flavor, 2.2 lbs tub. Yields 25g protein per serving.",
    specs: {
      "Weight": "2.2 lbs",
      "Protein / Serving": "25g",
      "BCAAs / Serving": "5.5g",
      "Flavor": "Double Rich Chocolate",
      "Servings": "30"
    }
  },
  {
    id: "creatine-mono",
    name: "Apex Micronized Creatine",
    category: "strength",
    price: 1199,
    origPrice: 1599,
    rating: 4.9,
    reviews: 842,
    tag: "ATP Power",
    tagClass: "best-seller",
    image: "/assets/images/creatine.png",
    desc: "Premium 200-mesh micronized creatine monohydrate. 500g bag. Promotes ATP regeneration and cellular hydration.",
    specs: {
      "Weight": "500g",
      "Serving Size": "5g",
      "Purity": "99.9% Monohydrate",
      "Flavor": "Unflavored",
      "Servings": "100"
    }
  },
  {
    id: "pre-ignite",
    name: "Apex Pre-Workout Ignite",
    category: "energy",
    price: 1699,
    origPrice: 2199,
    rating: 4.7,
    reviews: 612,
    tag: "High Energy",
    tagClass: "",
    image: "/assets/images/pre_workout.png",
    desc: "Sour Apple focus blend. 30 servings. Formulated with L-Citrulline, Beta-Alanine, and caffeine anhydrous.",
    specs: {
      "Weight": "300g",
      "Servings": "30",
      "Caffeine": "250mg",
      "L-Citrulline": "6000mg",
      "Beta-Alanine": "3200mg",
      "Flavor": "Sour Green Apple"
    }
  }
];

export default function SupplementShop({ onCheckoutSuccess, isAdmin = false, currentUser = null, onViewOrders = null }) {
  const [storeProducts, setStoreProducts] = useState(DEFAULT_PRODUCTS);
  const [lastCheckoutDetail, setLastCheckoutDetail] = useState(null);

  // State for Add Product Form
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('protein');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOrigPrice, setNewProdOrigPrice] = useState('');
  const [newProdTag, setNewProdTag] = useState('');
  const [newProdTagClass, setNewProdTagClass] = useState('best-seller');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdImagePreview, setNewProdImagePreview] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Spec detail states
  const [specWeight, setSpecWeight] = useState('');
  const [specProtein, setSpecProtein] = useState('');
  const [specFlavors, setSpecFlavors] = useState('');
  const [specServings, setSpecServings] = useState('');
  const [cart, setCart] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [sortVal, setSortVal] = useState('popular');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // Detail modal
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoColor, setPromoColor] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PER_PAGE = 6;

  // Multi-step Checkout Flow State: 'cart' | 'shipping' | 'payment'
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [showGateway, setShowGateway] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);


  // Shipping Form State
  const [shippingInfo, setShippingInfo] = useState({
    fullName: 'Ethan Hunt',
    phone: '+91 98765 43210',
    address: '123 Apex Fitness Boulevard, Suite 4B',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    deliveryType: 'standard' // 'standard' (Free) | 'express' (₹49)
  });

  // Payment Form State
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'card', // 'card' | 'upi' | 'account' | 'cod'
    cardNumber: '4242 4242 4242 4242',
    cardExpiry: '12/28',
    cardCvv: '888',
    upiId: 'ethanhunt@upi'
  });

  // Fetch backend products if available
  useEffect(() => {
    async function loadProducts() {
      try {
        const fetched = await memberApi.getSupplementProducts();
        if (fetched && Array.isArray(fetched) && fetched.length > 0) {
          setStoreProducts(fetched);
          localStorage.setItem('apex_supplement_products', JSON.stringify(fetched));
          return;
        }
      } catch (err) {
        console.warn('Failed to load remote products, checking local cache:', err);
      }

      // Fallback: check localStorage
      const localProds = localStorage.getItem('apex_supplement_products');
      if (localProds) {
        try {
          setStoreProducts(JSON.parse(localProds));
        } catch (e) {
          setStoreProducts(DEFAULT_PRODUCTS);
        }
      } else {
        setStoreProducts(DEFAULT_PRODUCTS);
      }
    }
    loadProducts();
  }, []);

  // Filter and sort products
  let filtered = storeProducts.filter((p) => {
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchVal.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchVal.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (sortVal === 'low-high') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortVal === 'high-low') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortVal === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else {
    filtered.sort((a, b) => b.reviews - a.reviews);
  }

  // Add to cart
  const addToCart = (productId, qty = 1) => {
    const product = storeProducts.find((p) => p.id === productId);
    if (!product) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === productId);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === productId ? { ...item, qty: item.qty + qty } : item
        );
      } else {
        return [...prevCart, { product, qty }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const changeCartItemQty = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.product.id === productId ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  // Pricing calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const memberDiscount = subtotal * 0.10; // Automatic 10% Member discount
  const promoDiscount = promoApplied ? subtotal * 0.10 : 0; // Extra 10%
  const shippingFee = shippingInfo.deliveryType === 'express' ? 4.99 : 0.00;
  const totalPrice = Math.max(0, subtotal - memberDiscount - promoDiscount + shippingFee);
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // Apply promo code
  const handleApplyPromo = () => {
    const code = promoInput.toUpperCase().trim();
    if (code === 'APEX10') {
      setPromoApplied(true);
      setPromoMessage("Promo applied: Additional 10% Discount applied! ✓");
      setPromoColor('var(--accent-volt)');
    } else if (code === '') {
      setPromoApplied(false);
      setPromoMessage('');
    } else {
      setPromoMessage("Invalid promo code. Try 'APEX10'.");
      setPromoColor('#ff3e6c');
    }
  };

  const processCheckoutInDB = async (customTxId) => {
    const cartItems = cart.map((item) => ({ productId: item.product.id, qty: item.qty }));
    
    const uEmail = currentUser?.email || 'member@apex.com';
    const uName = currentUser?.name || shippingInfo.fullName || 'Registered Member';
    const uPhone = shippingInfo.phone || '+91 98765 43210';

    // Call Node.js Express backend API
    const backendRes = await memberApi.checkoutSupplements(
      cartItems,
      promoInput,
      shippingInfo,
      paymentInfo.method,
      uEmail,
      uName,
      uPhone
    );

    const txId = customTxId || backendRes?.txId || ('TX-' + Math.floor(1000 + Math.random() * 9000));
    const finalTotal = backendRes?.totalBilled !== undefined ? backendRes.totalBilled : totalPrice;
    const orderId = backendRes?.order?.orderId || `ORD-${Date.now()}`;
    const orderDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const fullOrderObj = backendRes?.order || {
      orderId,
      txId,
      userEmail: uEmail,
      userName: uName,
      userPhone: uPhone,
      items: cart.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.qty,
        image: item.product.image,
        category: item.product.category
      })),
      itemsSummary: cart.map((item) => `${item.qty}x ${item.product.name}`).join(', '),
      subtotal,
      memberDiscount,
      promoDiscount,
      shippingFee,
      total: finalTotal,
      totalAmount: finalTotal,
      shippingInfo: { ...shippingInfo },
      paymentMethod: paymentInfo.method,
      paymentStatus: paymentInfo.method === 'cod' ? 'Pending (COD)' : 'Paid',
      courierName: 'Apex Express Logistics',
      trackingNumber: '',
      estimatedDelivery: shippingInfo.deliveryType === 'express' ? '24 Hours Priority' : '2-3 Business Days',
      status: 'Pending Confirmation',
      statusTimeline: [
        {
          status: 'Pending Confirmation',
          timestamp: orderDate,
          note: 'Order submitted by user and pending admin confirmation.'
        }
      ],
      date: orderDate
    };

    // Sync client-side localStorage fallback for instant cross-tab reactivity
    try {
      const existingOrders = JSON.parse(localStorage.getItem('apex_supplement_orders') || '[]');
      existingOrders.unshift(fullOrderObj);
      localStorage.setItem('apex_supplement_orders', JSON.stringify(existingOrders));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.warn("Error updating localStorage orders:", err);
    }

    const detail = {
      txId,
      orderId,
      itemsSummary: cart.map((item) => `${item.qty}x ${item.product.name}`).join(', '),
      total: finalTotal,
      cartSnapshot: [...cart],
      shippingInfo: { ...shippingInfo },
      paymentMethod: paymentInfo.method,
      orderObj: fullOrderObj
    };

    setLastCheckoutDetail(detail);
    setShowSuccessModal(true);
    setCheckoutStep('cart');
    setIsCartOpen(false);

    // Bubble up checkout event to MemberPanel to update payments table & activity log
    if (onCheckoutSuccess) {
      onCheckoutSuccess(detail);
    }

    // Reset shopping cart states
    setCart([]);
    setPromoApplied(false);
    setPromoInput('');
    setPromoMessage('');
  };

  // Final Order Submission Handler
  const handleFinalPlaceOrder = async (e) => {
    if (e) e.preventDefault();
    if (cart.length === 0) return;

    if (paymentInfo.method === 'cod') {
      await processCheckoutInDB();
      return;
    }

    setIsProcessingPayment(true);
    try {
      await initiateRazorpayPayment({
        amount: totalPrice,
        title: 'MuScLe HuB Supplement Store Order',
        paymentType: 'supplement_order',
        items: cart.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          qty: i.qty,
          unitPrice: i.product.price,
          total: i.product.price * i.qty
        })),
        memberInfo: {
          id: currentUser?.id || currentUser?.memberId || 'MEM-90210',
          name: shippingInfo.fullName || currentUser?.name || 'Athlete Member',
          email: currentUser?.email || 'athlete@apex.club',
          phone: shippingInfo.phone || '+91 98765 43210'
        },
        metadata: {
          deliveryType: shippingInfo.deliveryType,
          address: shippingInfo.address,
          city: shippingInfo.city,
          pincode: shippingInfo.pincode,
          state: shippingInfo.state
        },
        onSuccess: async (receipt) => {
          setIsProcessingPayment(false);
          await processCheckoutInDB(receipt?.receiptNumber || receipt?.paymentId);
          setActiveReceipt(receipt);
        },
        onFailure: (err) => {
          setIsProcessingPayment(false);
          if (err?.reason !== 'cancelled') {
            alert(err?.message || 'Payment could not be completed via Razorpay. Please try again.');
          }
        }
      });
    } catch (err) {
      setIsProcessingPayment(false);
      console.error('[Supplement Checkout Error]:', err);
    }
  };

  const handleGatewayPaymentSuccess = async (paymentDetail) => {
    setShowGateway(false);
    await processCheckoutInDB(paymentDetail.txId);
  };


  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProdImagePreview(reader.result);
        setNewProdImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice || !newProdCategory) {
      alert("Product Name, Category, and Price are required.");
      return;
    }

    const payload = {
      name: newProdName.trim(),
      category: newProdCategory,
      price: parseFloat(newProdPrice),
      origPrice: parseFloat(newProdOrigPrice || newProdPrice),
      rating: 4.8,
      reviews: Math.floor(10 + Math.random() * 90),
      tag: newProdTag.trim(),
      tagClass: newProdTagClass || 'best-seller',
      image: newProdImage.trim() || '/assets/images/gallery_weights.png',
      desc: newProdDesc.trim(),
      specs: {
        ...(specWeight ? { "Weight": specWeight.trim() } : {}),
        ...(specProtein ? { "Protein / Serving": specProtein.trim() } : {}),
        ...(specFlavors ? { "Flavor": specFlavors.trim() } : {}),
        ...(specServings ? { "Servings": specServings.trim() } : {})
      }
    };

    const res = await memberApi.addSupplementProduct(payload);

    if (res && res.success && res.data) {
      setStoreProducts((prev) => {
        const updated = [...prev, res.data];
        localStorage.setItem('apex_supplement_products', JSON.stringify(updated));
        return updated;
      });
    } else {
      console.warn("Backend addProduct failed, saving client-side.");
      const clientProduct = {
        ...payload,
        id: newProdName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
      };
      setStoreProducts((prev) => {
        const updated = [...prev, clientProduct];
        localStorage.setItem('apex_supplement_products', JSON.stringify(updated));
        return updated;
      });
    }

    // Reset Form
    setIsAddProductOpen(false);
    setNewProdName('');
    setNewProdCategory('protein');
    setNewProdPrice('');
    setNewProdOrigPrice('');
    setNewProdTag('');
    setNewProdTagClass('best-seller');
    setNewProdImage('');
    setNewProdImagePreview('');
    setNewProdDesc('');
    setSpecWeight('');
    setSpecProtein('');
    setSpecFlavors('');
    setSpecServings('');

    alert(`Product "${payload.name}" successfully added to the catalog!`);
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete the product "${productName}"?`)) {
      const res = await memberApi.deleteSupplementProduct(productId);
      
      setStoreProducts((prev) => {
        const updated = prev.filter((p) => p.id !== productId);
        localStorage.setItem('apex_supplement_products', JSON.stringify(updated));
        return updated;
      });
      
      alert(`Product "${productName}" has been deleted.`);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      
      {/* SHOP PROMO BANNER */}
      <div className="store-promo-banner" style={{ marginBottom: '2rem' }}>
        <div className="promo-content">
          <span className="promo-badge">Summer VIP Sale</span>
          <h2>Fuel Your Performance</h2>
          <p>Get an automatic 10% Member discount on all premium formulations. Use code <strong>APEX10</strong> at checkout for an extra 10% off!</p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {isAdmin && (
            <button
              type="button"
              className="glow-btn"
              onClick={() => setIsAddProductOpen(true)}
              style={{
                padding: '0.65rem 1.3rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                borderRadius: '6px',
                border: 'none',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--accent-volt)',
                color: '#000',
                boxShadow: '0 0 15px rgba(255, 94, 0, 0.3)'
              }}
            >
              <span style={{ fontSize: '1.2rem', lineHeight: 1, fontWeight: 900 }}>+</span> Add Product
            </button>
          )}
          {onViewOrders && (
            <button
              type="button"
              className="outline-btn"
              onClick={onViewOrders}
              style={{
                padding: '0.65rem 1.2rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                borderRadius: '6px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--accent-cyan)',
                borderColor: 'rgba(0, 240, 255, 0.4)',
                background: 'rgba(0, 240, 255, 0.08)'
              }}
            >
              <span>🚚</span> Track Orders
            </button>
          )}
          <button
            className="promo-cart-trigger"
            onClick={() => {
              setCheckoutStep('cart');
              setIsCartOpen(true);
            }}
          >
            <div className="cart-trigger-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="cart-badge-count">{totalQty}</span>
            </div>
            <span>View Cart</span>
          </button>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="store-filter-bar" style={{ marginBottom: '2rem' }}>
        {/* Search */}
        <div className="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="form-input"
            placeholder="Search products..."
            value={searchVal}
            onChange={(e) => { setSearchVal(e.target.value); setProductPage(1); }}
          />
        </div>

        {/* Categories */}
        <div className="filter-categories" id="store-category-filters">
          <button
            className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setCategoryFilter('all'); setProductPage(1); }}
          >
            All Items
          </button>
          <button
            className={`filter-chip ${categoryFilter === 'protein' ? 'active' : ''}`}
            onClick={() => { setCategoryFilter('protein'); setProductPage(1); }}
          >
            Proteins
          </button>
          <button
            className={`filter-chip ${categoryFilter === 'strength' ? 'active' : ''}`}
            onClick={() => { setCategoryFilter('strength'); setProductPage(1); }}
          >
            Strength & ATP
          </button>
          <button
            className={`filter-chip ${categoryFilter === 'energy' ? 'active' : ''}`}
            onClick={() => { setCategoryFilter('energy'); setProductPage(1); }}
          >
            Energy & Focus
          </button>
        </div>

        {/* Sort */}
        <div className="sort-box">
          <span>Sort:</span>
          <select
            className="form-input"
            value={sortVal}
            onChange={(e) => { setSortVal(e.target.value); setProductPage(1); }}
          >
            <option value="popular">Popularity</option>
            <option value="low-high">Price: Low to High</option>
            <option value="high-low">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="supp-products-grid" id="supp-products-grid">
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-dim)' }}>
            No matching products found. Try a different query or category filter!
          </div>
        ) : (
          filtered
            .slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE)
            .map((p) => {
            const discountPercentage = Math.round(((p.origPrice - p.price) / p.origPrice) * 100);
            
            return (
              <div
                key={p.id}
                className="product-card"
                onClick={() => setSelectedProduct(p)}
                style={{ position: 'relative' }}
              >
                {p.tag && <span className={`product-card-tag ${p.tagClass}`}>{p.tag}</span>}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(p.id, p.name);
                    }}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(255, 62, 108, 0.15)',
                      border: '1px solid rgba(255, 62, 108, 0.4)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ff3e6c',
                      cursor: 'pointer',
                      zIndex: 10,
                      transition: 'background 0.2s, transform 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ff3e6c';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 62, 108, 0.15)';
                      e.currentTarget.style.color = '#ff3e6c';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Delete Product"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <div className="product-img-container">
                  <img
                    src={p.image}
                    alt={p.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/images/gallery_weights.png';
                    }}
                  />
                </div>
                <span className="product-category">{p.category}</span>
                <h4 className="product-title">{p.name}</h4>
                <div className="product-rating-row">
                  <span className="rating-stars">★ ★ ★ ★ ★</span>
                  <span className="reviews-count">{p.rating} ({p.reviews})</span>
                </div>
                <p className="product-desc">{p.desc}</p>
                <div className="product-specs-badges">
                  {Object.entries(p.specs).slice(0, 2).map(([k, v]) => (
                    <span key={k} className="spec-badge">{k}: {v}</span>
                  ))}
                </div>
                <div className="product-pricing">
                  <span className="current-price">₹{p.price}</span>
                  <span className="original-price">₹{p.origPrice}</span>
                  <span className="discount-pct">{discountPercentage}% OFF</span>
                </div>
                
                <div className="product-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="outline-btn add-cart-btn"
                    onClick={(e) => {
                      addToCart(p.id, 1);
                      const btn = e.target;
                      btn.textContent = "Added ✓";
                      btn.style.color = "#00ff66";
                      btn.style.borderColor = "rgba(0, 255, 102, 0.3)";
                      setTimeout(() => {
                        btn.textContent = "Add";
                        btn.style.color = "var(--accent-cyan)";
                        btn.style.borderColor = "var(--accent-cyan)";
                      }, 1200);
                    }}
                  >
                    Add
                  </button>
                  <button
                    className="glow-btn buy-now-btn"
                    onClick={() => {
                      setCart([{ product: p, qty: 1 }]);
                      setCheckoutStep('cart');
                      setIsCartOpen(true);
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {filtered.length > PRODUCTS_PER_PAGE && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: 600 }}>
            Showing {((productPage - 1) * PRODUCTS_PER_PAGE) + 1}-{Math.min(productPage * PRODUCTS_PER_PAGE, filtered.length)} of {filtered.length} products
          </span>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button
              type="button"
              className="outline-btn"
              disabled={productPage === 1}
              onClick={() => setProductPage(productPage - 1)}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', opacity: productPage === 1 ? 0.4 : 1, cursor: productPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
            >
              ← Previous
            </button>
            <span style={{ color: 'var(--accent-volt)', fontWeight: 800, padding: '0.25rem 0.7rem', background: 'rgba(198, 255, 0, 0.08)', borderRadius: '4px', border: '1px solid rgba(198, 255, 0, 0.2)', fontSize: '0.78rem' }}>
              Page {productPage} of {Math.ceil(filtered.length / PRODUCTS_PER_PAGE)}
            </span>
            <button
              type="button"
              className="outline-btn"
              disabled={productPage >= Math.ceil(filtered.length / PRODUCTS_PER_PAGE)}
              onClick={() => setProductPage(productPage + 1)}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', opacity: productPage >= Math.ceil(filtered.length / PRODUCTS_PER_PAGE) ? 0.4 : 1, cursor: productPage >= Math.ceil(filtered.length / PRODUCTS_PER_PAGE) ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {selectedProduct && (
        <div className="store-modal-overlay" id="product-detail-modal" onClick={() => setSelectedProduct(null)}>
          <div className="store-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              id="detail-modal-close"
              onClick={() => setSelectedProduct(null)}
            >
              &times;
            </button>
            <div className="modal-detail-content" id="detail-modal-content">
              <div className="modal-img-column">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/images/gallery_weights.png';
                  }}
                />
              </div>
              <div className="modal-info-column">
                <span className="product-category">{selectedProduct.category}</span>
                <h2>{selectedProduct.name}</h2>
                <div className="product-rating-row">
                  <span className="rating-stars">★ ★ ★ ★ ★</span>
                  <span className="reviews-count">{selectedProduct.rating} ({selectedProduct.reviews} verified reviews)</span>
                </div>
                <p className="product-desc">
                  {selectedProduct.desc}
                </p>
                
                <h5 style={{ color: 'var(--text-white)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                  Nutrition & Technical Facts
                </h5>
                <div className="specs-list">
                  {Object.entries(selectedProduct.specs).map(([k, v]) => (
                    <div key={k} className="spec-item-row">
                      <span className="spec-label">{k}</span>
                      <span className="spec-value">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="product-pricing">
                  <span className="current-price">₹{selectedProduct.price}</span>
                  <span className="original-price">₹{selectedProduct.origPrice}</span>
                  <span className="discount-pct">
                    {Math.round(((selectedProduct.origPrice - selectedProduct.price) / selectedProduct.origPrice) * 100)}% OFF
                  </span>
                </div>

                <div className="modal-action-row">
                  <button
                    className="outline-btn add-cart-btn"
                    onClick={() => {
                      addToCart(selectedProduct.id, 1);
                      setSelectedProduct(null);
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    className="glow-btn buy-now-btn"
                    onClick={() => {
                      setCart([{ product: selectedProduct, qty: 1 }]);
                      setSelectedProduct(null);
                      setCheckoutStep('cart');
                      setIsCartOpen(true);
                    }}
                  >
                    Direct Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER OVERLAY */}
      {isCartOpen && (
        <div className="store-cart-drawer-overlay" id="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="store-cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h3>My Shopping Cart ({totalQty})</h3>
              <button
                className="cart-drawer-close"
                id="cart-drawer-close-btn"
                onClick={() => setIsCartOpen(false)}
              >
                &times;
              </button>
            </div>

            {/* Cart Items List */}
            <div className="cart-items-container" id="cart-items-list">
              {cart.length === 0 ? (
                <div className="cart-empty-state">
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>Your shopping cart is currently empty.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="cart-item">
                    <div className="cart-item-img">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/images/gallery_weights.png';
                        }}
                      />
                    </div>
                    <div className="cart-item-info">
                      <h5 className="cart-item-title">{item.product.name}</h5>
                      <div className="cart-item-price">₹{item.product.price} each</div>
                    </div>
                    <div className="cart-item-actions">
                      <div className="qty-selector">
                        <button
                          className="qty-btn cart-minus"
                          onClick={() => changeCartItemQty(item.product.id, -1)}
                          title="Decrease Quantity (-)"
                          aria-label="Decrease quantity"
                        >
                          &minus;
                        </button>
                        <span className="qty-val">{item.qty}</span>
                        <button
                          className="qty-btn cart-plus"
                          onClick={() => changeCartItemQty(item.product.id, 1)}
                          title="Increase Quantity (+)"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="cart-item-delete"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer / Checkout Area - Always Visible */}
            <div className="cart-drawer-footer">
              {cart.length > 0 ? (
                <>
                  {/* Promo Input */}
                  <div className="promo-code-section">
                    <input
                      type="text"
                      id="promo-code-input"
                      className="form-input"
                      placeholder="PROMO CODE (e.g. APEX10)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                    />
                    <button
                      className="outline-btn"
                      id="apply-promo-btn"
                      onClick={handleApplyPromo}
                    >
                      Apply
                    </button>
                  </div>
                  
                  {promoMessage && (
                    <p id="promo-status-msg" style={{ fontSize: '0.72rem', color: promoColor, marginBottom: '0.5rem', textAlign: 'center' }}>
                      {promoMessage}
                    </p>
                  )}

                  {/* Subtotals */}
                  <div className="price-breakdown">
                    <div className="price-row">
                      <span>Cart Subtotal</span>
                      <span id="cart-subtotal">₹{subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="price-row discount">
                      <span>10% VIP Member Discount</span>
                      <span id="cart-member-discount">-₹{memberDiscount.toFixed(2)}</span>
                    </div>

                    {promoApplied && (
                      <div className="price-row discount" id="cart-promo-row">
                        <span>Promo Code Discount (10%)</span>
                        <span id="cart-promo-discount">-₹{promoDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="price-row total">
                      <span>Subtotal Payable</span>
                      <span id="cart-total-price">₹{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    className="glow-btn checkout-btn"
                    id="cart-checkout-btn"
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutStep('shipping');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      fontSize: '0.95rem',
                      padding: '0.9rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      width: '100%'
                    }}
                  >
                    <span>CHECKOUT NOW</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <button
                    className="glow-btn checkout-btn"
                    id="cart-checkout-btn-disabled"
                    disabled
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      fontSize: '0.95rem',
                      padding: '0.9rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      width: '100%',
                      opacity: 0.4,
                      cursor: 'not-allowed',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-dim)'
                    }}
                  >
                    <span>CHECKOUT NOW</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Add items from the shop above to proceed with checkout
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: SHIPPING ADDRESS PAGE / MODAL */}
      {checkoutStep === 'shipping' && (
        <div className="store-modal-overlay" style={{ zIndex: 999900 }} onClick={() => setCheckoutStep('cart')}>
          <div className="store-modal-card" style={{ maxWidth: '600px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            {/* Step Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-volt)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>1</span>
                <div>
                  <h4 style={{ color: 'var(--text-white)', margin: 0, fontSize: '1rem', fontWeight: 800 }}>Shipping Address</h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Step 1 of 2: Enter Delivery Details</span>
                </div>
              </div>
              <button className="modal-close-btn" style={{ position: 'static' }} onClick={() => setCheckoutStep('cart')}>&times;</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setCheckoutStep('payment'); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={shippingInfo.fullName}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Phone Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Street Address / Flat No. *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>City *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>State *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Pincode *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={shippingInfo.pincode}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, pincode: e.target.value })}
                  />
                </div>
              </div>

              {/* Delivery Speed Options */}
              <h5 style={{ color: 'var(--text-white)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.05em' }}>
                Select Delivery Speed
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.8rem' }}>
                <div
                  onClick={() => setShippingInfo({ ...shippingInfo, deliveryType: 'standard' })}
                  style={{
                    background: shippingInfo.deliveryType === 'standard' ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    border: shippingInfo.deliveryType === 'standard' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--text-white)', fontSize: '0.85rem' }}>Standard Express</strong>
                    <span style={{ color: '#00ff66', fontWeight: 800, fontSize: '0.78rem' }}>FREE</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estimated Delivery: 2 - 3 Business Days</span>
                </div>

                <div
                  onClick={() => setShippingInfo({ ...shippingInfo, deliveryType: 'express' })}
                  style={{
                    background: shippingInfo.deliveryType === 'express' ? 'rgba(198, 255, 0, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    border: shippingInfo.deliveryType === 'express' ? '1px solid var(--accent-volt)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--text-white)', fontSize: '0.85rem' }}>VIP Fast-Track ⚡</strong>
                    <span style={{ color: 'var(--accent-volt)', fontWeight: 800, fontSize: '0.78rem' }}>+₹49</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Guaranteed 24-Hour Priority Delivery</span>
                </div>
              </div>

              {/* Order Summary Pill */}
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.8rem 1rem', marginBottom: '1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order Total ({totalQty} item{totalQty > 1 ? 's' : ''}):</span>
                <span style={{ color: 'var(--accent-volt)', fontWeight: 800, fontSize: '1rem' }}>₹{totalPrice.toFixed(2)}</span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="outline-btn"
                  onClick={() => {
                    setCheckoutStep('cart');
                    setIsCartOpen(true);
                  }}
                  style={{ padding: '0.75rem 1.2rem', fontSize: '0.82rem' }}
                >
                  ← Back to Cart
                </button>

                <button
                  type="submit"
                  className="glow-btn"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span>Continue to Payment</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: PAYMENT PAGE / MODAL */}
      {checkoutStep === 'payment' && (
        <div className="store-modal-overlay" style={{ zIndex: 999900 }} onClick={() => setCheckoutStep('shipping')}>
          <div className="store-modal-card" style={{ maxWidth: '620px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            {/* Step Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>2</span>
                <div>
                  <h4 style={{ color: 'var(--text-white)', margin: 0, fontSize: '1rem', fontWeight: 800 }}>Payment Method</h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Step 2 of 2: Confirm Order & Pay</span>
                </div>
              </div>
              <button className="modal-close-btn" style={{ position: 'static' }} onClick={() => setCheckoutStep('shipping')}>&times;</button>
            </div>

            {/* Delivery Destination Badge */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.8rem 1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase' }}>Delivering To:</span>
                <strong style={{ color: 'var(--text-white)' }}>{shippingInfo.fullName}</strong> — {shippingInfo.address}, {shippingInfo.city} ({shippingInfo.pincode})
              </div>
              <button
                type="button"
                className="outline-btn"
                onClick={() => setCheckoutStep('shipping')}
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.68rem' }}
              >
                Edit
              </button>
            </div>

            <form onSubmit={handleFinalPlaceOrder}>
              <h5 style={{ color: 'var(--text-white)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.05em' }}>
                Select Payment Option
              </h5>

              {/* Payment Methods Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
                <div
                  onClick={() => setPaymentInfo({ ...paymentInfo, method: 'card' })}
                  style={{
                    background: paymentInfo.method === 'card' ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    border: paymentInfo.method === 'card' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>💳</span>
                  <div>
                    <strong style={{ color: 'var(--text-white)', fontSize: '0.82rem', display: 'block' }}>Credit / Debit Card</strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Visa, Mastercard, RuPay</span>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentInfo({ ...paymentInfo, method: 'upi' })}
                  style={{
                    background: paymentInfo.method === 'upi' ? 'rgba(198, 255, 0, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    border: paymentInfo.method === 'upi' ? '1px solid var(--accent-volt)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>📱</span>
                  <div>
                    <strong style={{ color: 'var(--text-white)', fontSize: '0.82rem', display: 'block' }}>Instant UPI / QR</strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>GPay, PhonePe, Paytm, BHIM</span>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentInfo({ ...paymentInfo, method: 'account' })}
                  style={{
                    background: paymentInfo.method === 'account' ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    border: paymentInfo.method === 'account' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>⚡</span>
                  <div>
                    <strong style={{ color: 'var(--text-white)', fontSize: '0.82rem', display: 'block' }}>Apex Member Account</strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Add to monthly billing invoice</span>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentInfo({ ...paymentInfo, method: 'cod' })}
                  style={{
                    background: paymentInfo.method === 'cod' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                    border: paymentInfo.method === 'cod' ? '1px solid var(--text-white)' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>💵</span>
                  <div>
                    <strong style={{ color: 'var(--text-white)', fontSize: '0.82rem', display: 'block' }}>Cash on Delivery</strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Pay cash upon delivery</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Payment Input Fields */}
              {paymentInfo.method === 'card' && (
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>Card Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={paymentInfo.cardNumber}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Expiry Date</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="MM/YY"
                        value={paymentInfo.cardExpiry}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardExpiry: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>CVV Code</label>
                      <input
                        type="password"
                        className="form-input"
                        maxLength="4"
                        value={paymentInfo.cardCvv}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardCvv: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentInfo.method === 'upi' && (
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>VPA / UPI ID (e.g. name@upi)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="username@okaxis or username@paytm"
                      value={paymentInfo.upiId}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, upiId: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              {paymentInfo.method === 'account' && (
                <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', color: 'var(--accent-cyan)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  ⚡ <strong>Member Direct Billing Active:</strong> Purchase total of <strong>₹{totalPrice.toFixed(2)}</strong> will be charged to your active account invoice (Receipt ID will be generated upon confirmation).
                </div>
              )}

              {paymentInfo.method === 'cod' && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  💵 <strong>Cash on Delivery:</strong> Please keep exact change of <strong>₹{totalPrice.toFixed(2)}</strong> ready upon delivery by courier.
                </div>
              )}

              {/* Final Breakdown Table */}
              <div className="price-breakdown" style={{ marginBottom: '1.8rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1rem', borderRadius: '6px' }}>
                <div className="price-row">
                  <span>Items Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="price-row discount">
                  <span>10% VIP Member Discount</span>
                  <span>-₹{memberDiscount.toFixed(2)}</span>
                </div>
                {promoApplied && (
                  <div className="price-row discount">
                    <span>Promo Discount (APEX10)</span>
                    <span>-₹{promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="price-row">
                  <span>Delivery Charge ({shippingInfo.deliveryType.toUpperCase()})</span>
                  <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="price-row total" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem', marginTop: '0.3rem' }}>
                  <span>Total Amount Payable</span>
                  <span style={{ color: 'var(--accent-volt)', fontSize: '1.15rem' }}>₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="outline-btn"
                  onClick={() => setCheckoutStep('shipping')}
                  style={{ padding: '0.75rem 1.2rem', fontSize: '0.82rem' }}
                >
                  ← Back to Shipping
                </button>

                <button
                  type="submit"
                  className="glow-btn"
                  style={{ padding: '0.75rem 1.8rem', fontSize: '0.88rem' }}
                >
                  Pay & Complete Order ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 3: ORDER SUCCESS / RECEIPT MODAL */}
      {showSuccessModal && lastCheckoutDetail && (
        <div className="order-success-modal-overlay" id="order-success-modal" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.88)', zIndex: 999999, alignItems: 'center', justifyContent: 'center' }}>
          <div className="db-card" style={{ maxWidth: '480px', width: '90%', minHeight: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '2rem', textAlign: 'center', boxShadow: '0 0 50px rgba(0,255,102,0.15)' }}>
            <div className="success-icon-wrapper" style={{ margin: '0 auto 1.2rem auto', width: '55px', height: '55px', borderRadius: '50%', background: 'rgba(0,255,102,0.1)', border: '2px solid #00ff66', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ff66' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.2rem', color: 'var(--text-white)' }}>Order Confirmed & Placed!</h3>
            <p className="card-subtitle" style={{ marginBottom: '1.2rem' }}>Receipt Invoice: <span id="success-invoice-id" style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace', fontWeight: 700 }}>{lastCheckoutDetail.txId}</span></p>
            
            {/* Delivery address summary */}
            {lastCheckoutDetail.shippingInfo && (
              <div style={{ background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.15)', borderRadius: '6px', padding: '0.8rem', textAlign: 'left', marginBottom: '1rem', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Delivery Destination:</span>
                <div style={{ color: 'var(--text-white)', marginTop: '0.2rem' }}>
                  <strong>{lastCheckoutDetail.shippingInfo.fullName}</strong> ({lastCheckoutDetail.shippingInfo.phone})
                  <div style={{ color: 'var(--text-muted)' }}>{lastCheckoutDetail.shippingInfo.address}, {lastCheckoutDetail.shippingInfo.city}, {lastCheckoutDetail.shippingInfo.state} - {lastCheckoutDetail.shippingInfo.pincode}</div>
                </div>
              </div>
            )}

            {/* Summary lines */}
            <div className="success-order-summary" id="success-order-summary" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.9rem', textAlign: 'left', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {lastCheckoutDetail.cartSnapshot.map((item) => (
                <div key={item.product.id} className="success-summary-line" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span>{item.qty}x {item.product.name}</span>
                  <span>₹{(item.product.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="success-summary-line" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '0.4rem', paddingTop: '0.4rem', color: 'var(--accent-volt)', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.85rem' }}>
                <span>Billed Total</span>
                <span>₹{lastCheckoutDetail.total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                type="button"
                className="glow-btn"
                onClick={() => {
                  const receiptObj = activeReceipt || {
                    receiptNumber: lastCheckoutDetail.txId || 'MH-RCP-SUPP',
                    orderId: lastCheckoutDetail.orderId || 'ORD-SUPP',
                    paymentId: lastCheckoutDetail.txId || 'PAY-VERIFIED',
                    title: 'MuScLe HuB Supplement Store Order',
                    amount: lastCheckoutDetail.total,
                    userName: lastCheckoutDetail.shippingInfo?.fullName || currentUser?.name || 'Athlete Member',
                    userEmail: currentUser?.email || 'athlete@apex.club',
                    userPhone: lastCheckoutDetail.shippingInfo?.phone || '+91 98765 43210',
                    paymentMethod: lastCheckoutDetail.paymentMethod === 'cod' ? 'Cash On Delivery (COD)' : 'Razorpay Verified',
                    paymentType: 'supplement_order',
                    createdAt: new Date().toISOString(),
                    items: lastCheckoutDetail.cartSnapshot.map((i) => ({
                      name: i.product.name,
                      qty: i.qty,
                      unitPrice: i.product.price,
                      total: i.product.price * i.qty
                    }))
                  };
                  setActiveReceipt(receiptObj);
                }}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', background: 'var(--accent-volt)', color: '#000', border: 'none', borderRadius: '6px' }}
              >
                📄 View / Print Tax Invoice
              </button>

              <button
                className="outline-btn"
                id="success-modal-close-btn"
                onClick={() => {
                  setShowSuccessModal(false);
                  setCheckoutStep('cart');
                }}
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {showGateway && (
        <DummyPaymentGateway
          amount={totalPrice}
          title="Apex Supplements Checkout"
          onPaymentSuccess={handleGatewayPaymentSuccess}
          onClose={() => setShowGateway(false)}
        />
      )}

      {/* ADD PRODUCT MODAL OVERLAY */}

      {isAddProductOpen && (
        <div className="store-modal-overlay" style={{ zIndex: 999910 }} onClick={() => setIsAddProductOpen(false)}>
          <div className="store-modal-card" style={{ maxWidth: '600px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>📦</span>
                <div>
                  <h4 style={{ color: 'var(--text-white)', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Add New Supplement Product</h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Publish a new supplement product to the store catalog</span>
                </div>
              </div>
              <button className="modal-close-btn" style={{ position: 'static' }} onClick={() => setIsAddProductOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleAddProductSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Product Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Apex Pure Whey Isolate"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Category *</label>
                  <select
                    className="form-input"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                  >
                    <option value="protein">Protein</option>
                    <option value="strength">Strength & ATP</option>
                    <option value="energy">Energy & Focus</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Sale Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    placeholder="e.g. 59.99"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Original Price (₹) (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 74.99"
                    value={newProdOrigPrice}
                    onChange={(e) => setNewProdOrigPrice(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Product Tag (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Best Seller, ATP Power"
                    value={newProdTag}
                    onChange={(e) => setNewProdTag(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Tag Style Class</label>
                  <select
                    className="form-input"
                    value={newProdTagClass}
                    onChange={(e) => setNewProdTagClass(e.target.value)}
                  >
                    <option value="best-seller">Best Seller (Glow Badge)</option>
                    <option value="">Normal (Standard Gray)</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Product Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%' }}>
                    <label
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px dashed var(--border-color)',
                        borderRadius: '6px',
                        padding: '0.55rem 1rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        color: 'var(--text-white)',
                        flex: 1,
                        height: '42px',
                        boxSizing: 'border-box',
                        transition: 'background 0.2s'
                      }}
                    >
                      📁 Upload Image File
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageFileChange}
                      />
                    </label>
                    {newProdImagePreview && (
                      <div style={{ position: 'relative', width: '42px', height: '42px' }}>
                        <img
                          src={newProdImagePreview}
                          alt="Preview"
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--accent-volt)' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewProdImagePreview('');
                            setNewProdImage('');
                          }}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#ff3e6c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            lineHeight: 1
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Description</label>
                <textarea
                  className="form-input"
                  style={{ height: '60px', resize: 'none' }}
                  placeholder="Enter a brief product description..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                />
              </div>

              <h5 style={{ color: 'var(--text-white)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.2rem' }}>Product Specifications (Optional)</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Weight/Size</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem' }}
                    placeholder="e.g. 2.0 kg or 500g"
                    value={specWeight}
                    onChange={(e) => setSpecWeight(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Protein per serving</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem' }}
                    placeholder="e.g. 25g"
                    value={specProtein}
                    onChange={(e) => setSpecProtein(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Flavor</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem' }}
                    placeholder="e.g. Chocolate Fudge"
                    value={specFlavors}
                    onChange={(e) => setSpecFlavors(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Servings</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem' }}
                    placeholder="e.g. 50 servings"
                    value={specServings}
                    onChange={(e) => setSpecServings(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="outline-btn"
                  onClick={() => setIsAddProductOpen(false)}
                  style={{ padding: '0.6rem 1.3rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glow-btn"
                  style={{ padding: '0.6rem 1.8rem', color: '#000', fontWeight: 800 }}
                >
                  Publish Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL RAZORPAY TAX INVOICE RECEIPT MODAL */}
      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
}
