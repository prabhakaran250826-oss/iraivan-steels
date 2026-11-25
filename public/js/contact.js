/* ==========================================================================
   IRAIVAN STEELS - Live Rate Booking & RFQ Form Handler
   ========================================================================== */

(function () {
  'use strict';

  // Check if incoming from 3D Builder, Price Estimator, or Materials quote generator
  const quoteData = sessionStorage.getItem('quote');
  if (quoteData && $('#f')) {
    const reqField = $('#f').requirements;
    if (reqField) {
      reqField.value = quoteData;
      const banner = document.createElement('div');
      banner.className = 'quote-banner';
      banner.innerHTML = '⚡ <strong>Spot Rate Booking / Bill of Materials Attached:</strong> Your configuration and live commodity pricing have been pre-filled below.';
      $('#f').prepend(banner);
    }
  }

  const form = $('#f');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = $('#sub');
    const msg = $('#msg');

    submitBtn.disabled = true;
    msg.innerHTML = '<span class="status-sending" style="color:var(--steel-glow)">Registering rate booking in Iraivan Steels trading database…</span>';

    const formData = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit booking');

      const mailtoLink = result.mailtoUrl || `mailto:asmi29042009@gmail.com?subject=Iraivan%20Steels%20Booking%20Ref%20${result.id}`;
      const waLink = result.whatsappUrl || `https://wa.me/919940033757`;

      msg.innerHTML = `
        <div class="enquiry-success" style="background:rgba(0,230,118,0.06);border:1px solid rgba(0,230,118,0.4);border-radius:10px;padding:1.4rem;margin-top:1.2rem">
          <div style="font-size:1.35rem;font-weight:800;color:var(--green);margin-bottom:0.4rem">
            ✓ Spot Rate Booking Registered & Queued
          </div>
          <p style="color:#fff;margin:0.25rem 0">
            Order Ref ID: <code style="color:var(--gold);font-weight:700;font-size:1.05rem">${result.id}</code> · Storage: <strong>${result.database}</strong>
          </p>
          <div style="display:inline-flex;align-items:center;gap:0.4rem;background:rgba(0,210,255,0.1);border:1px solid rgba(0,210,255,0.3);padding:0.35rem 0.8rem;border-radius:6px;margin:0.6rem 0;font-size:0.88rem;color:#00d2ff">
            <span>✉ Designated Recipient:</span>
            <strong style="color:#fff">asmi29042009@gmail.com</strong>
            <span style="color:var(--mut)">(R.Ajmalkhan · +91 99400 33757)</span>
          </div>

          <p style="margin-top:0.4rem;font-size:0.92rem;color:var(--ink-secondary);line-height:1.5">
            Your enquiry is saved in our system. You can also send the complete enquiry directly to <strong>asmi29042009@gmail.com</strong> or WhatsApp with 1 click below for immediate price lock:
          </p>

          <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:1rem">
            <a href="${mailtoLink}" target="_blank" rel="noopener noreferrer" class="btn" style="background:#00d2ff;color:#04070a;font-weight:700;display:inline-flex;align-items:center;gap:0.4rem;text-decoration:none;padding:0.6rem 1.1rem;border-radius:6px">
              ✉ Send Direct Email to asmi29042009@gmail.com
            </a>
            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn alt" style="background:#25D366;color:#fff;border-color:#25D366;font-weight:700;display:inline-flex;align-items:center;gap:0.4rem;text-decoration:none;padding:0.6rem 1.1rem;border-radius:6px">
              💬 Instant WhatsApp (+91 99400 33757)
            </a>
          </div>

          <div style="margin-top:0.9rem;font-size:0.82rem;color:var(--mut)">
            ✓ Dispatch Address: No. 868, Near Kismath Ceramics / Kismath Titles, Rameswaram Main Road, Devakottai South, Tamil Nadu 630302.
          </div>
        </div>
      `;

      form.reset();
      sessionStorage.removeItem('quote');
    } catch (err) {
      msg.innerHTML = `
        <div class="enquiry-error">
          <strong>Submission Error:</strong> ${err.message || 'Could not send enquiry. Please check your connection and try again.'}
        </div>
      `;
    } finally {
      submitBtn.disabled = false;
    }
  };

})();
