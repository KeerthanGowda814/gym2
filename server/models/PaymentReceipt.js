import mongoose from 'mongoose';

const PaymentReceiptSchema = new mongoose.Schema({
  receiptNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  orderId: { 
    type: String, 
    required: true 
  },
  paymentId: { 
    type: String, 
    required: true 
  },
  signature: { 
    type: String 
  },
  userId: { 
    type: String, 
    default: 'MEM-90210' 
  },
  userName: { 
    type: String, 
    required: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  userPhone: { 
    type: String, 
    default: '+91 98765 43210' 
  },
  userRole: { 
    type: String, 
    default: 'member' 
  },
  paymentType: { 
    type: String, 
    enum: ['membership', 'trainer_booking', 'supplement_order', 'general'], 
    default: 'general' 
  },
  title: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: 'INR' 
  },
  status: { 
    type: String, 
    enum: ['paid', 'captured', 'failed', 'refunded'], 
    default: 'paid' 
  },
  paymentMethod: { 
    type: String, 
    default: 'Razorpay Gateway' 
  },
  bankRrn: { 
    type: String, 
    default: '' 
  },
  items: [
    {
      name: { type: String, required: true },
      qty: { type: Number, default: 1 },
      unitPrice: { type: Number, required: true },
      total: { type: Number, required: true }
    }
  ],
  subtotal: { 
    type: Number, 
    required: true 
  },
  gstRate: { 
    type: Number, 
    default: 18 
  },
  gstAmount: { 
    type: Number, 
    default: 0 
  },
  discountAmount: { 
    type: Number, 
    default: 0 
  },
  netAmount: { 
    type: Number, 
    required: true 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }
}, { timestamps: true });

export default mongoose.models.PaymentReceipt || mongoose.model('PaymentReceipt', PaymentReceiptSchema);
