import mongoose from 'mongoose';

const SupplementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number },
  origPrice: { type: Number },
  rating: { type: Number },
  reviews: { type: Number },
  tag: { type: String },
  tagClass: { type: String },
  image: { type: String },
  desc: { type: String },
  specs: { type: Map, of: String }
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  txId: { type: String },
  receiptNumber: { type: String },
  userEmail: { type: String, default: 'member@apex.com' },
  userName: { type: String, default: 'Registered Member' },
  userPhone: { type: String },
  items: [{ id: String, name: String, price: Number, quantity: Number, image: String, category: String }],
  itemsSummary: { type: String },
  subtotal: { type: Number },
  memberDiscount: { type: Number, default: 0 },
  promoDiscount: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  total: { type: Number },
  totalAmount: { type: Number },
  // Gym Pickup Details (No Home Delivery)
  deliveryType: { type: String, default: 'gym_pickup' },
  pickupLocation: { type: String, default: 'Apex Athletics Front Desk & Nutrition Bar' },
  pickupDesk: { type: String, default: 'Reception Desk - Counter 1' },
  pickupTimePreference: { type: String, default: 'Next Gym Visit' },
  pickupNotes: { type: String, default: '' },
  readyForPickupAt: { type: String, default: '' },
  collectedAt: { type: String, default: '' },
  collectedByAdmin: { type: String, default: '' },
  shippingInfo: {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    deliveryType: String
  },
  paymentMethod: { type: String, default: 'Online Payment (Razorpay)' },
  paymentStatus: { type: String, default: 'Paid' },
  status: { type: String, default: 'Pending Confirmation' },
  statusTimeline: [{
    status: { type: String },
    timestamp: { type: String },
    note: { type: String }
  }],
  date: { type: String }
}, { timestamps: true });

export const Supplement = mongoose.models.Supplement || mongoose.model('Supplement', SupplementSchema);
export const SupplementOrder = mongoose.models.SupplementOrder || mongoose.model('SupplementOrder', OrderSchema);
