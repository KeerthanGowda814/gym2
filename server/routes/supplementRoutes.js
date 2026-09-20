import express from 'express';
import { getDB, saveDB } from '../config/db.js';
import { Supplement, SupplementOrder } from '../models/Supplement.js';
import PaymentReceipt from '../models/PaymentReceipt.js';
import { isMongoConnected } from '../config/mongodb.js';

const router = express.Router();

/**
 * GET /api/member/supplements/products
 * Fetch store product catalog from MongoDB Atlas & DB Fallback
 */
router.get('/products', async (req, res) => {
  let mongoProducts = [];
  if (isMongoConnected()) {
    try {
      mongoProducts = await Supplement.find().lean();
    } catch (e) {
      console.warn('Error reading products from MongoDB:', e.message);
    }
  }

  const db = getDB();
  const fileProducts = db.supplements.products || [];

  const map = new Map();
  [...fileProducts, ...mongoProducts].forEach((p) => {
    if (p && p.id) {
      map.set(p.id, p);
    }
  });

  const data = Array.from(map.values());

  res.json({
    success: true,
    count: data.length,
    data
  });
});

/**
 * POST /api/member/supplements/products
 * Add new supplement product to catalog in MongoDB Atlas & DB Fallback
 */
router.post('/products', async (req, res) => {
  const { name, category, price, origPrice, rating, reviews, tag, tagClass, image, desc, specs } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      message: 'Product name, category, and price are required.'
    });
  }

  const db = getDB();
  const newProduct = {
    id: String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now(),
    name,
    category: String(category).toLowerCase(),
    price: Number(price),
    origPrice: Number(origPrice || price),
    rating: Number(rating || 4.5),
    reviews: Number(reviews || 1),
    tag: tag || '',
    tagClass: tagClass || '',
    image: image || 'assets/images/gallery_weights.png',
    desc: desc || '',
    specs: specs || {}
  };

  db.supplements.products.push(newProduct);
  saveDB(db);

  if (isMongoConnected()) {
    try {
      await Supplement.create(newProduct);
    } catch (e) {
      console.warn('Error saving product to MongoDB Atlas:', e.message);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Product added successfully.',
    data: newProduct
  });
});

/**
 * POST /api/member/supplements/checkout
 * Process shop cart checkout, apply promo code, generate order in MongoDB Atlas & DB Fallback
 */
router.post('/checkout', async (req, res) => {
  const {
    cartItems,
    promoCode,
    shippingInfo,
    paymentMethod,
    userEmail,
    userName,
    userPhone,
    receiptNumber,
    paymentId,
    paymentStatus
  } = req.body;

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty.'
    });
  }

  const db = getDB();

  // Calculate pricing server-side for integrity
  let subtotal = 0;
  const itemsSummaryList = [];
  const detailedItems = [];

  for (const item of cartItems) {
    const prod = Array.isArray(db.supplements?.products)
      ? db.supplements.products.find((p) => p.id === item.productId || p.id === item.id || p.id === item.product?.id || p.name === item.name || p.name === item.product?.name)
      : null;
    
    const qty = Number(item.qty || item.quantity) || 1;
    const itemPrice = prod ? Number(prod.price) : Number(item.price || item.unitPrice || item.product?.price || item.total || 0);
    const itemName = prod ? prod.name : (item.name || item.product?.name || 'Supplement Product');

    if (itemPrice > 0 || itemName) {
      const itemSub = itemPrice * qty;
      subtotal += itemSub;
      itemsSummaryList.push(`${qty}x ${itemName}`);
      detailedItems.push({
        id: prod?.id || item.id || item.productId || `prod-${Date.now()}`,
        name: itemName,
        price: itemPrice,
        quantity: qty,
        image: prod?.image || item.image || item.product?.image || '',
        category: prod?.category || item.category || item.product?.category || 'Supplements'
      });
    }
  }

  // Fallback to request body total if subtotal could not be calculated from items
  if (subtotal === 0 && (req.body.total || req.body.totalBilled || req.body.amount)) {
    subtotal = Number(req.body.total || req.body.totalBilled || req.body.amount || 0);
  }

  const memberDiscount = subtotal * 0.10; // Automatic 10% Member discount
  const isPromoValid = String(promoCode || '').toUpperCase().trim() === 'APEX10';
  const promoDiscount = isPromoValid ? subtotal * 0.10 : 0;
  const shippingFee = shippingInfo?.deliveryType === 'express' ? 49.00 : 0.00;
  const totalBilled = Math.max(0, subtotal - memberDiscount - promoDiscount + shippingFee);

  const txId = paymentId || ('TX-' + Math.floor(1000 + Math.random() * 9000));
  const orderId = `ORD-${Date.now()}`;
  const itemsSummary = itemsSummaryList.join(', ');
  const orderDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const methodStr = String(paymentMethod || 'online').toLowerCase();
  const isCod = methodStr.includes('cod') || methodStr === 'cash on delivery';
  const isAccount = methodStr.includes('account') || methodStr === 'apex member account';

  const normalizedMethod = isCod
    ? 'Cash on Delivery (COD)'
    : isAccount
    ? 'Apex Member Account'
    : 'Online Payment (Razorpay)';

  const normalizedStatus = paymentStatus || (isCod
    ? 'Pending (COD)'
    : isAccount
    ? 'Billed to Member Account'
    : 'Paid');

  const resolvedReceiptNumber = receiptNumber || (isCod
    ? `MH-RCP-COD-${Math.floor(100000 + Math.random() * 900000)}`
    : isAccount
    ? `MH-RCP-ACC-${Math.floor(100000 + Math.random() * 900000)}`
    : `MH-RCP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);

  const initialTimeline = [
    {
      status: 'Pending Confirmation',
      timestamp: orderDate,
      note: isCod
        ? 'Order placed with Cash on Delivery. Pending admin verification & dispatch.'
        : isAccount
        ? 'Order placed and charged to Monthly Member Account invoice. Pending admin confirmation.'
        : 'Payment received & verified via Razorpay. Pending admin packing & dispatch.'
    }
  ];

  const newOrder = {
    orderId,
    txId,
    receiptNumber: resolvedReceiptNumber,
    userEmail: userEmail || 'member@apex.com',
    userName: userName || shippingInfo?.fullName || 'Registered Member',
    userPhone: userPhone || shippingInfo?.phone || '+91 98765 43210',
    items: detailedItems,
    itemsSummary,
    subtotal,
    memberDiscount,
    promoDiscount,
    shippingFee,
    total: totalBilled,
    totalAmount: totalBilled,
    shippingInfo: shippingInfo || {
      fullName: userName || 'Ethan Hunt',
      phone: userPhone || '+91 98765 43210',
      address: '123 Apex Fitness Boulevard',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      deliveryType: 'standard'
    },
    paymentMethod: normalizedMethod,
    paymentStatus: normalizedStatus,
    courierName: 'Apex Express Logistics',
    trackingNumber: '',
    estimatedDelivery: shippingInfo?.deliveryType === 'express' ? '24 Hours Priority' : '2-3 Business Days',
    status: 'Pending Confirmation',
    statusTimeline: initialTimeline,
    date: orderDate
  };

  if (!db.supplements.orders) {
    db.supplements.orders = [];
  }
  db.supplements.orders.unshift(newOrder);

  // 1. Log in Invoices
  const newInvoice = {
    id: resolvedReceiptNumber,
    txId,
    receiptNumber: resolvedReceiptNumber,
    plan: `Supplements: ${itemsSummary.substring(0, 35)}...`,
    desc: `Supp Store: ${itemsSummary.substring(0, 35)}...`,
    amount: `₹${totalBilled.toLocaleString('en-IN')}`,
    numAmount: totalBilled,
    status: isCod ? 'Pending (COD)' : (isAccount ? 'Billed to Account' : 'Paid'),
    paymentMethod: normalizedMethod,
    userEmail: userEmail || 'member@apex.com',
    userName: userName || 'Registered Member',
    date: orderDate
  };

  if (!db.invoices) db.invoices = [];
  db.invoices.unshift(newInvoice);

  // 2. Generate Receipt in receipts collection so Admin Financial Ledger & Receipts Modal reflect all orders
  const numAmount = totalBilled;
  const subtotalNet = Math.round((numAmount / 1.18) * 100) / 100;
  const gstAmt = Math.round((numAmount - subtotalNet) * 100) / 100;

  const receiptData = {
    receiptNumber: resolvedReceiptNumber,
    orderId,
    paymentId: txId,
    signature: 'GATEWAY_VERIFIED',
    userId: 'MEM-90210',
    userName: userName || shippingInfo?.fullName || 'Registered Member',
    userEmail: userEmail || 'member@apex.com',
    userPhone: userPhone || shippingInfo?.phone || '+91 98765 43210',
    userRole: 'member',
    paymentType: 'supplement_order',
    title: `MuScLe HuB Store: ${itemsSummary.substring(0, 40)}`,
    amount: numAmount,
    currency: 'INR',
    status: isCod ? 'pending' : (isAccount ? 'billed_to_account' : 'paid'),
    paymentMethod: normalizedMethod,
    bankRrn: `RRN-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    items: detailedItems.map(d => ({
      name: d.name,
      qty: d.quantity,
      unitPrice: d.price,
      total: d.price * d.quantity
    })),
    subtotal: subtotalNet,
    gstRate: 18,
    gstAmount: gstAmt,
    discountAmount: memberDiscount + promoDiscount,
    netAmount: numAmount,
    createdAt: new Date().toISOString(),
    metadata: {
      deliveryType: shippingInfo?.deliveryType || 'standard',
      shippingAddress: `${shippingInfo?.address || ''}, ${shippingInfo?.city || ''}, ${shippingInfo?.state || ''} - ${shippingInfo?.pincode || ''}`,
      orderId
    }
  };

  if (!db.receipts) db.receipts = [];
  // Avoid duplicate receipt numbers if already logged by razorpay verify
  const existingRIndex = db.receipts.findIndex(r => r.receiptNumber === resolvedReceiptNumber || (r.orderId && r.orderId === orderId));
  if (existingRIndex === -1) {
    db.receipts.unshift(receiptData);
  } else {
    db.receipts[existingRIndex] = { ...db.receipts[existingRIndex], ...receiptData };
  }

  saveDB(db);

  if (isMongoConnected()) {
    try {
      await SupplementOrder.create(newOrder);
    } catch (e) {
      console.warn('Error saving order to MongoDB Atlas:', e.message);
    }

    try {
      await PaymentReceipt.findOneAndUpdate(
        { receiptNumber: resolvedReceiptNumber },
        receiptData,
        { upsert: true, new: true }
      );
    } catch (e) {
      console.warn('Error saving receipt to MongoDB Atlas:', e.message);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully. Waiting for admin confirmation.',
    txId,
    orderId,
    receiptNumber: resolvedReceiptNumber,
    totalBilled,
    order: newOrder,
    invoice: newInvoice,
    receipt: receiptData
  });
});

/**
 * GET /api/member/supplements/orders
 * Fetch all supplement orders or filter by user email from MongoDB Atlas & DB Fallback
 */
router.get('/orders', async (req, res) => {
  const { email } = req.query;
  let mongoOrders = [];

  if (isMongoConnected()) {
    try {
      const query = email ? { userEmail: new RegExp(`^${email}$`, 'i') } : {};
      mongoOrders = await SupplementOrder.find(query).sort({ createdAt: -1 }).lean();
    } catch (e) {
      console.warn('Error reading orders from MongoDB Atlas:', e.message);
    }
  }

  const db = getDB();
  let localOrders = db.supplements.orders || [];

  if (email) {
    localOrders = localOrders.filter((o) => o.userEmail && o.userEmail.toLowerCase() === email.toLowerCase());
  }

  const map = new Map();
  [...localOrders, ...mongoOrders].forEach((o) => {
    if (o && (o.orderId || o.txId)) {
      map.set(o.orderId || o.txId, o);
    }
  });

  const orders = Array.from(map.values());

  res.json({
    success: true,
    count: orders.length,
    data: orders
  });
});

/**
 * GET /api/member/supplements/orders/:orderId
 * Fetch single order details by orderId from MongoDB Atlas & DB Fallback
 */
router.get('/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;

  if (isMongoConnected()) {
    try {
      const mongoOrder = await SupplementOrder.findOne({ $or: [{ orderId }, { txId: orderId }] }).lean();
      if (mongoOrder) {
        return res.json({ success: true, data: mongoOrder });
      }
    } catch (e) {}
  }

  const db = getDB();
  const order = (db.supplements.orders || []).find((o) => o.orderId === orderId || o.txId === orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found.'
    });
  }

  res.json({
    success: true,
    data: order
  });
});

/**
 * PUT /api/admin/supplements/orders/:orderId/status
 * Admin update order status, courier info, and append tracking timeline in MongoDB Atlas & DB Fallback
 */
router.put('/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status, courierName, trackingNumber, estimatedDelivery, note } = req.body;

  const db = getDB();
  const orders = db.supplements.orders || [];
  const orderIndex = orders.findIndex((o) => o.orderId === orderId || o.txId === orderId);

  let targetOrder = orderIndex !== -1 ? orders[orderIndex] : null;

  const timestamp = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (isMongoConnected()) {
    try {
      const updatedMongo = await SupplementOrder.findOneAndUpdate(
        { $or: [{ orderId }, { txId: orderId }] },
        {
          ...(status && { status }),
          ...(courierName !== undefined && { courierName }),
          ...(trackingNumber !== undefined && { trackingNumber }),
          ...(estimatedDelivery !== undefined && { estimatedDelivery }),
          $push: {
            statusTimeline: {
              status: status || 'Updated',
              timestamp,
              note: note || `Status updated to ${status || 'Updated'} by Admin`
            }
          }
        },
        { new: true }
      ).lean();

      if (updatedMongo) {
        targetOrder = updatedMongo;
      }
    } catch (e) {
      console.warn('Error updating order in MongoDB Atlas:', e.message);
    }
  }

  if (orderIndex !== -1) {
    if (status) targetOrder.status = status;
    if (courierName !== undefined) targetOrder.courierName = courierName;
    if (trackingNumber !== undefined) targetOrder.trackingNumber = trackingNumber;
    if (estimatedDelivery !== undefined) targetOrder.estimatedDelivery = estimatedDelivery;

    if (!targetOrder.statusTimeline) targetOrder.statusTimeline = [];
    targetOrder.statusTimeline.push({
      status: status || targetOrder.status,
      timestamp,
      note: note || `Status updated to ${status || targetOrder.status} by Admin`
    });

    orders[orderIndex] = targetOrder;
    db.supplements.orders = orders;
    saveDB(db);
  } else if (!targetOrder) {
    // Upsert order if missing from DB array
    targetOrder = {
      orderId,
      txId: orderId,
      status: status || 'Confirmed',
      courierName: courierName || 'Apex Express Logistics',
      trackingNumber: trackingNumber || '',
      estimatedDelivery: estimatedDelivery || '2-3 Business Days',
      statusTimeline: [
        {
          status: status || 'Confirmed',
          timestamp,
          note: note || `Status updated to ${status || 'Confirmed'} by Admin`
        }
      ]
    };
    orders.push(targetOrder);
    db.supplements.orders = orders;
    saveDB(db);
  }

  res.json({
    success: true,
    message: `Order status updated to ${targetOrder.status}.`,
    data: targetOrder
  });
});

/**
 * DELETE /api/member/supplements/products/:id
 * Delete product from catalog in MongoDB Atlas & DB Fallback
 */
router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const initialLength = db.supplements.products.length;
  db.supplements.products = db.supplements.products.filter((p) => p.id !== id);

  if (isMongoConnected()) {
    try {
      await Supplement.deleteOne({ id });
    } catch (e) {}
  }

  saveDB(db);

  res.json({
    success: true,
    message: 'Product deleted successfully.'
  });
});

export default router;
