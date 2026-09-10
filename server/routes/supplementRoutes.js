import express from 'express';
import { getDB, saveDB } from '../config/db.js';
import { Supplement, SupplementOrder } from '../models/Supplement.js';
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
  const { cartItems, promoCode, shippingInfo, paymentMethod, userEmail, userName, userPhone } = req.body;

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
    const prod = db.supplements.products.find((p) => p.id === item.productId || p.id === item.product?.id);
    const qty = Number(item.qty) || 1;

    if (prod) {
      const itemSub = prod.price * qty;
      subtotal += itemSub;
      itemsSummaryList.push(`${qty}x ${prod.name}`);
      detailedItems.push({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        quantity: qty,
        image: prod.image,
        category: prod.category
      });
    }
  }

  const memberDiscount = subtotal * 0.10; // Automatic 10% Member discount
  const isPromoValid = String(promoCode || '').toUpperCase().trim() === 'APEX10';
  const promoDiscount = isPromoValid ? subtotal * 0.10 : 0;
  const shippingFee = shippingInfo?.deliveryType === 'express' ? 49.00 : 0.00;
  const totalBilled = Math.max(0, subtotal - memberDiscount - promoDiscount + shippingFee);

  const txId = 'TX-' + Math.floor(1000 + Math.random() * 9000);
  const orderId = `ORD-${Date.now()}`;
  const itemsSummary = itemsSummaryList.join(', ');
  const orderDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const initialTimeline = [
    {
      status: 'Pending Confirmation',
      timestamp: orderDate,
      note: 'Order submitted by user and pending admin confirmation.'
    }
  ];

  const newOrder = {
    orderId,
    txId,
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
    paymentMethod: paymentMethod || 'card',
    paymentStatus: paymentMethod === 'cod' ? 'Pending (COD)' : 'Paid',
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

  // Auto-record in member invoices payment history
  const newInvoice = {
    txId,
    plan: `Supp Store: ${itemsSummary.substring(0, 30)}...`,
    amount: totalBilled,
    status: paymentMethod === 'cod' ? 'pending' : 'paid',
    date: orderDate
  };

  if (!db.invoices) db.invoices = [];
  db.invoices.unshift(newInvoice);

  saveDB(db);

  if (isMongoConnected()) {
    try {
      await SupplementOrder.create(newOrder);
    } catch (e) {
      console.warn('Error saving order to MongoDB Atlas:', e.message);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully. Waiting for admin confirmation.',
    txId,
    totalBilled,
    order: newOrder,
    invoice: newInvoice
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
  }

  if (!targetOrder) {
    return res.status(404).json({
      success: false,
      message: 'Order not found.'
    });
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
