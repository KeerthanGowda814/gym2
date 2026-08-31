import express from 'express';
import { getDB, saveDB } from '../config/db.js';

const router = express.Router();

/**
 * GET /api/member/supplements/products
 * Fetch store product catalog
 */
router.get('/products', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    count: db.supplements.products.length,
    data: db.supplements.products
  });
});

/**
 * POST /api/member/supplements/products
 * Add new supplement product to catalog
 */
router.post('/products', (req, res) => {
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

  res.status(201).json({
    success: true,
    message: 'Product added successfully.',
    data: newProduct
  });
});

/**
 * POST /api/member/supplements/checkout
 * Process shop cart checkout, apply promo code, generate order & invoice
 */
router.post('/checkout', (req, res) => {
  const { cartItems, promoCode } = req.body;

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

  for (const item of cartItems) {
    const prod = db.supplements.products.find((p) => p.id === item.productId || p.id === item.product?.id);
    const qty = Number(item.qty) || 1;

    if (prod) {
      subtotal += prod.price * qty;
      itemsSummaryList.push(`${qty}x ${prod.name}`);
    }
  }

  const memberDiscount = subtotal * 0.10; // Automatic 10% Member discount
  const isPromoValid = String(promoCode || '').toUpperCase().trim() === 'APEX10';
  const promoDiscount = isPromoValid ? subtotal * 0.10 : 0;
  const totalBilled = Math.max(0, subtotal - memberDiscount - promoDiscount);

  const txId = 'TX-' + Math.floor(1000 + Math.random() * 9000);
  const itemsSummary = itemsSummaryList.join(', ');

  const newOrder = {
    orderId: `ORD-${Date.now()}`,
    txId,
    itemsSummary,
    subtotal,
    memberDiscount,
    promoDiscount,
    total: totalBilled,
    date: 'Today',
    status: 'Completed'
  };

  db.supplements.orders.unshift(newOrder);

  // Auto-record in member invoices payment history
  const newInvoice = {
    txId,
    plan: 'Supp Store Purchase',
    amount: totalBilled,
    status: 'paid',
    date: 'Today'
  };

  db.invoices.unshift(newInvoice);
  saveDB(db);

  res.status(201).json({
    success: true,
    message: 'Order processed successfully. Billed total charged to account.',
    txId,
    totalBilled,
    order: newOrder,
    invoice: newInvoice
  });
});

/**
 * DELETE /api/member/supplements/products/:id
 * Delete product from catalog
 */
router.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const initialLength = db.supplements.products.length;
  db.supplements.products = db.supplements.products.filter((p) => p.id !== id);

  if (db.supplements.products.length === initialLength) {
    return res.status(404).json({
      success: false,
      message: 'Product not found.'
    });
  }

  saveDB(db);

  res.json({
    success: true,
    message: 'Product deleted successfully.'
  });
});

export default router;
