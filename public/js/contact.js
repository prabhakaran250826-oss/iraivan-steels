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

      msg.innerHTML = `
        <div class="enquiry-success">
          <div style="font-size:1.35rem;font-weight:800;color:var(--green);margin-bottom:0.3rem">✓ Spot Rate Booking Successfully Registered</div>
          <p style="color:#fff">Order Ref ID: <code style="color:var(--gold);font-weight:700">${result.id}</code> · Database: <strong>${result.database}</strong></p>
          <p style="margin-top:0.5rem;font-size:0.9rem;color:var(--ink-secondary)">
            Our Senior Sales Desk & Dispatch Logistics Officer will lock today's spot rate and issue your formal Proforma Invoice with mill test certificates within one business hour.
          </p>
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
