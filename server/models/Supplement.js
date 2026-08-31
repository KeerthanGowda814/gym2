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
  items: [{ id: String, name: String, price: Number, quantity: Number }],
  totalAmount: { type: Number },
  discountApplied: { type: Number },
  promoCode: { type: String },
  date: { type: String },
  status: { type: String, default: 'Confirmed' }
}, { timestamps: true });

export const Supplement = mongoose.models.Supplement || mongoose.model('Supplement', SupplementSchema);
export const SupplementOrder = mongoose.models.SupplementOrder || mongoose.model('SupplementOrder', OrderSchema);
