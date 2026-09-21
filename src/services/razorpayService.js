/**
 * Razorpay Payment Gateway Service
 * Handles script injection, order generation, checkout modal popup, and cryptographic signature verification.
 */

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const API_BASE = 'http://localhost:5000/api/payment';

/**
 * Dynamically loads the Razorpay checkout script if not present
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[Razorpay]: Failed to load checkout script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Initiates Razorpay Checkout flow
 */
export const initiateRazorpayPayment = async ({
  amount,
  title = 'MuScLe HuB Payment',
  paymentType = 'general',
  items = [],
  memberInfo = {},
  metadata = {},
  onSuccess,
  onFailure
}) => {
  try {
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      throw new Error('Could not initialize Razorpay checkout script. Please check your internet connection.');
    }

    // 1. Create order on backend
    const orderRes = await fetch(`${API_BASE}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        paymentType,
        notes: {
          title,
          memberId: memberInfo.id || memberInfo.memberId || 'MEM-90210',
          memberName: memberInfo.name || 'Athlete Member',
          memberEmail: memberInfo.email || 'athlete@apex.club'
        }
      })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.success) {
      throw new Error(orderData.message || 'Failed to create payment order on backend.');
    }

    const { orderId, keyId, amount: paiseAmount } = orderData;

    // 2. Configure Razorpay Modal Options
    const options = {
      key: keyId || 'rzp_test_TZpwFUaag8MfCo',
      amount: paiseAmount,
      currency: 'INR',
      name: 'MuScLe HuB',
      description: title,
      image: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
      prefill: {
        name: memberInfo.name || 'Athlete Member',
        email: memberInfo.email || 'athlete@apex.club',
        contact: memberInfo.phone || '+919876543210'
      },
      notes: {
        paymentType,
        title
      },
      theme: {
        color: '#ff5e00',
        backdrop_color: 'rgba(5, 5, 8, 0.85)'
      },
      handler: async function (response) {
        try {
          // 3. Verify Signature on backend
          const verifyRes = await fetch(`${API_BASE}/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentType,
              title,
              amount,
              items,
              memberId: memberInfo.id || memberInfo.memberId || 'MEM-90210',
              memberName: memberInfo.name || 'Athlete Member',
              memberEmail: memberInfo.email || 'athlete@apex.club',
              memberPhone: memberInfo.phone || '+91 98765 43210',
              metadata: {
                ...metadata,
                method: response.razorpay_payment_id ? 'Razorpay Online (UPI/Cards/NetBanking)' : 'Razorpay Gateway'
              }
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            if (onSuccess) onSuccess(verifyData.receipt);
          } else {
            throw new Error(verifyData.message || 'Payment signature verification failed.');
          }
        } catch (verifyErr) {
          console.error('[Payment Verification Failed]:', verifyErr);
          if (onFailure) onFailure(verifyErr);
        }
      },
      modal: {
        ondismiss: function () {
          console.log('[Razorpay Modal Dismissed]');
          if (onFailure) onFailure({ reason: 'cancelled', message: 'Payment modal was closed by user.' });
        }
      }
    };

    // Attach order_id only when a genuine Razorpay server order ID is present
    if (orderId && typeof orderId === 'string' && orderId.startsWith('order_') && !orderId.includes('_mock_') && !orderId.includes('_test_') && orderId.length >= 18) {
      options.order_id = orderId;
    }

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (resp) {
      console.error('[Razorpay Payment Failed]:', resp.error);
      const isAuthError = resp.error?.code === 'BAD_REQUEST_ERROR' || resp.error?.description?.includes('Authentication');
      if (onFailure) {
        onFailure({
          ...resp.error,
          isAuthError,
          message: isAuthError ? 'Razorpay Test Key invalid. Please use local payment mode or update RAZORPAY_KEY_ID.' : resp.error?.description || 'Payment failed.'
        });
      }
    });
    rzp.open();
  } catch (err) {
    console.error('[Razorpay Initiation Error]:', err);
    if (onFailure) onFailure(err);
  }
};
