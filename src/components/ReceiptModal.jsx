import React from 'react';

/**
 * ReceiptModal Component
 * Renders an official, beautifully styled gym tax invoice / payment receipt with print and PDF export capabilities.
 */
export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = receipt.createdAt
    ? new Date(receipt.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

  const subtotal = receipt.subtotal || Math.round((receipt.amount / 1.18) * 100) / 100;
  const gstAmount = receipt.gstAmount || Math.round((receipt.amount - subtotal) * 100) / 100;
  const totalAmount = receipt.amount || receipt.netAmount || 0;

  return (
    <div
      className="receipt-modal-overlay print-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="receipt-card-container printable-receipt"
        style={{
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-white, #0f172a)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '650px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          padding: '2.5rem'
        }}
      >
        {/* Close Button (Hidden when printing) */}
        <button
          className="no-print"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            background: 'rgba(128, 128, 128, 0.1)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            lineHeight: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ff3e6c';
            e.currentTarget.style.background = 'rgba(255, 62, 108, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'rgba(128, 128, 128, 0.1)';
          }}
        >
          &times;
        </button>

        {/* RECEIPT HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.8rem', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.6rem' }}>⚡</span>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--accent-volt, #ff5e00)' }}>
                MuScLe HuB
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Premium Fitness & Strength Club<br />
              #42 Fitness Boulevard, MG Road, Bengaluru, KA 560001<br />
              GSTIN: 29AAAAA0000A1Z5 | Ph: +91 80 2345 6789
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              ✓ PAYMENT SUCCESSFUL
            </span>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-white)' }}>
              {receipt.receiptNumber || 'MH-RCP-2026-90210'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {formattedDate}
            </div>
          </div>
        </div>

        {/* BILLED TO & PAYMENT DETAILS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', background: 'var(--bg-card-hover, rgba(128,128,128,0.05))', padding: '1.2rem', borderRadius: '10px', marginBottom: '1.8rem', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>
              BILLED TO (MEMBER)
            </span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-white)', display: 'block' }}>
              {receipt.userName || 'Athlete Member'}
            </strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
              {receipt.userEmail || 'athlete@apex.club'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
              Member ID: {receipt.userId || 'MEM-90210'} | {receipt.userPhone || '+91 98765 43210'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>
              GATEWAY TRANSACTION
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
              <strong>Payment ID:</strong> <code style={{ fontSize: '0.75rem', color: 'var(--accent-cyan, #0070f3)' }}>{receipt.paymentId || 'pay_test_default'}</code>
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
              <strong>Order ID:</strong> <code style={{ fontSize: '0.75rem' }}>{receipt.orderId || 'order_test_default'}</code>
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
              <strong>Method:</strong> {receipt.paymentMethod || 'Razorpay Online (UPI/Cards)'}
            </span>
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '0.6rem 0.4rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Description</th>
              <th style={{ padding: '0.6rem 0.4rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '0.6rem 0.4rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Rate (₹)</th>
              <th style={{ padding: '0.6rem 0.4rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(receipt.items && receipt.items.length > 0
              ? receipt.items
              : [{ name: receipt.title || 'Gym Service Fee', qty: 1, unitPrice: receipt.amount, total: receipt.amount }]
            ).map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.8rem 0.4rem', fontWeight: 600, color: 'var(--text-white)' }}>
                  {item.name}
                  {receipt.paymentType === 'membership' && (
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      All-access gym floor pass, locker & trainer consultation included
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.8rem 0.4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {item.qty || 1}
                </td>
                <td style={{ padding: '0.8rem 0.4rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                  ₹{(item.unitPrice || item.price || item.total || 0).toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '0.8rem 0.4rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-white)' }}>
                  ₹{(item.total || (item.unitPrice || item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SUMMARY TOTALS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.8rem' }}>
          <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>GST (18% Included):</span>
              <span>₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            {receipt.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                <span>Discount:</span>
                <span>-₹{receipt.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '0.6rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-white)' }}>
              <span>Total Paid:</span>
              <span style={{ color: 'var(--accent-volt, #ff5e00)' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* FOOTER NOTICE */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <p style={{ margin: 0 }}>
            This is a computer-generated tax invoice verified via <strong>Razorpay Payment Gateway</strong>. No physical signature required.
          </p>
          <p style={{ margin: '0.2rem 0 0 0' }}>
            Questions regarding this invoice? Email billing@musclehub.club or call support desk at +91 80 2345 6789.
          </p>
        </div>

        {/* ACTION BUTTONS (Hidden in Print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem' }}>
          <button
            onClick={handlePrint}
            className="outline-btn"
            style={{
              padding: '0.6rem 1.4rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card-hover, #f1f5f9)',
              color: 'var(--text-white)'
            }}
          >
            <span>🖨️</span> Print / Save PDF
          </button>
          <button
            onClick={onClose}
            className="glow-btn"
            style={{
              padding: '0.6rem 1.6rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              borderRadius: '6px',
              cursor: 'pointer',
              background: 'var(--accent-volt, #ff5e00)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 15px rgba(255, 94, 0, 0.25)'
            }}
          >
            Done ✓
          </button>
        </div>
      </div>

      {/* PRINT MEDIA STYLES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-receipt, .printable-receipt * {
            visibility: visible;
          }
          .printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .receipt-modal-overlay {
            background: transparent !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
