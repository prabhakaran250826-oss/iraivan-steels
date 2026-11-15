/* ==========================================================================
   IRAIVAN STEELS - AI Material Quality & Metallurgical Scanner
   (Gemini Vision / Groq / Iraivan Diagnostics Engine)
   ========================================================================== */

(function () {
  'use strict';

  const v = $('#vid');
  const sn = $('#snap');
  const res = $('#res');
  const hudScan = $('#hudScan');
  let stream = null;

  // Curated high-resolution construction sample images for instant testing
  const SAMPLES = {
    prime_rebar: {
      name: 'Prime Fe 550D TMT Rebar (Pass)',
      generate: () => renderSyntheticSample('prime_rebar')
    },
    rusted_rebar: {
      name: 'Corroded Rebar (Surface Rust/Pitting)',
      generate: () => renderSyntheticSample('rusted_rebar')
    },
    ismb_beam: {
      name: 'ISMB 200 Structural Steel Flange',
      generate: () => renderSyntheticSample('ismb_beam')
    },
    class_a_brick: {
      name: 'Class-A Wire-Cut Red Clay Brick (Pass)',
      generate: () => renderSyntheticSample('class_a_brick')
    },
    cracked_brick: {
      name: 'Cracked / Efflorescent Brick (Flagged)',
      generate: () => renderSyntheticSample('cracked_brick')
    },
    dalmia_cement: {
      name: 'Fresh Dalmia DSP OPC 53 Cement',
      generate: () => renderSyntheticSample('dalmia_cement')
    }
  };

  function renderSyntheticSample(type) {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 480;
    const ctx = c.getContext('2d');

    // Studio inspection background
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#151d26');
    grad.addColorStop(1, '#080d12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    ctx.save();
    if (type === 'prime_rebar') {
      // Prime Fe 550D TMT Rebar
      ctx.fillStyle = '#4f5963';
      ctx.fillRect(60, 190, 520, 100);
      ctx.fillStyle = '#3a4249';
      for (let x = 70; x < 570; x += 20) {
        ctx.fillRect(x, 180, 10, 120);
      }
      // Stamped mill marking
      ctx.fillStyle = '#f5a623';
      ctx.font = '800 20px Archivo, sans-serif';
      ctx.fillText('IRAIVAN STEELS · FE 550D · IS 1786 · PRIME', 85, 248);
    } else if (type === 'rusted_rebar') {
      // Corroded rebar with oxidation patches
      ctx.fillStyle = '#6a4a35';
      ctx.fillRect(60, 190, 520, 100);
      // Irregular oxidized ribs
      ctx.fillStyle = '#8f4f2c';
      for (let x = 70; x < 570; x += 22) {
        const h = 110 + (x % 14);
        ctx.fillRect(x, 185 - (x % 5), 9, h);
      }
      // Heavy rust flake speckles
      ctx.fillStyle = '#c8642a';
      for (let i = 0; i < 70; i++) {
        const rx = 80 + (i * 29) % 480;
        const ry = 195 + (i * 17) % 90;
        ctx.fillRect(rx, ry, 6 + (i % 4), 4 + (i % 3));
      }
      ctx.fillStyle = '#ffe0cc';
      ctx.font = '700 18px Archivo, sans-serif';
      ctx.fillText('WARNING: REBAR SURFACE OXIDATION & RUST PITTING DETECTED', 75, 248);
    } else if (type === 'ismb_beam') {
      // ISMB 200 Structural Beam Flange
      ctx.fillStyle = '#5b6976';
      ctx.fillRect(100, 110, 440, 65); // top flange
      ctx.fillRect(100, 310, 440, 65); // bottom flange
      ctx.fillRect(285, 160, 70, 160); // web
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 22px Archivo, sans-serif';
      ctx.fillText('ISMB 200 HEAVY STRUCTURAL GIRDER', 130, 245);
    } else if (type === 'class_a_brick') {
      // High-grade burnt clay brick
      ctx.fillStyle = '#b3472c';
      ctx.fillRect(110, 130, 420, 220);
      ctx.fillStyle = '#8d321b';
      ctx.fillRect(170, 175, 300, 130); // deep frog indentation
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 22px Archivo, sans-serif';
      ctx.fillText('IRAIVAN CLASS-A WIRE-CUT BRICK', 185, 245);
    } else if (type === 'cracked_brick') {
      // Damaged brick with fracture & efflorescence
      ctx.fillStyle = '#b3472c';
      ctx.fillRect(110, 130, 420, 220);
      ctx.fillStyle = '#8d321b';
      ctx.fillRect(170, 175, 300, 130);
      // White efflorescence salt patches
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(220, 230, 35, 0, Math.PI * 2);
      ctx.arc(380, 250, 42, 0, Math.PI * 2);
      ctx.fill();
      // Through-crack fracture line
      ctx.strokeStyle = '#150804';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(310, 130);
      ctx.lineTo(305, 190);
      ctx.lineTo(330, 240);
      ctx.lineTo(315, 300);
      ctx.lineTo(325, 350);
      ctx.stroke();
      ctx.fillStyle = '#ffe8e0';
      ctx.font = '700 18px Archivo, sans-serif';
      ctx.fillText('CRACK FRACTURE & EFFLORESCENCE DEPOSIT FLAGGED', 118, 160);
    } else if (type === 'dalmia_cement') {
      // Fresh cement powder
      ctx.fillStyle = '#cbd2d7';
      ctx.beginPath();
      ctx.ellipse(320, 250, 210, 130, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#101a24';
      ctx.font = '800 22px Archivo, sans-serif';
      ctx.fillText('DALMIA DSP OPC 53 GRADE CEMENT', 140, 255);
    }
    ctx.restore();

    return c.toDataURL('image/jpeg', 0.92);
  }

  function showReport(r) {
    if (hudScan) hudScan.style.display = 'none';

    const renderList = (arr) => {
      if (!arr || !arr.length) return '<p style="color:var(--mut);font-size:0.9rem">None detected under visual inspection.</p>';
      return '<ul class="report-list">' + arr.map(x => '<li>' + String(x).replace(/</g, '&lt;') + '</li>').join('') + '</ul>';
    };

    const gradeClass = 'g-' + (r.grade || 'Good');
    const scoreVal = clamp(r.score || 88, 0, 100);
    const certId = 'CERT-IS-' + Math.abs(Math.sin((r.score || 88) * 4567.89) * 1000000).toFixed(0).padStart(6, '0');
    const engineLabel = r.engine || 'Google Gemini Multimodal Vision AI';

    res.innerHTML = `
      <div class="report-box">
        <div class="engine-badge-row">
          <span class="ai-engine-pill">
            <span class="pulse-dot"></span> <strong>AI Engine:</strong> ${engineLabel}
          </span>
          <span class="cert-pill">Ref: ${certId}</span>
        </div>

        <div class="report-header" style="margin-top:0.8rem">
          <div>
            <span class="report-tag">IRAIVAN STEELS METALLURGICAL INSPECTION REPORT</span>
            <h3 style="font-size:1.5rem;margin-top:0.2rem;color:#fff">${String(r.material).replace(/</g, '&lt;')}</h3>
          </div>
          <div class="badge-grade ${gradeClass}">${r.grade} QUALITY</div>
        </div>

        <div class="score-container">
          <div class="score-label">
            <span>Overall Diagnostic Integrity Score</span>
            <strong style="color:var(--gold);font-size:1.15rem">${scoreVal} / 100</strong>
          </div>
          <div class="score-bar">
            <div class="score-fill ${gradeClass}" style="width:${scoreVal}%"></div>
          </div>
        </div>

        <div class="report-section">
          <h4>Observed Visual Characteristics & Defects</h4>
          ${renderList(r.defects)}
        </div>

        <div class="report-section">
          <h4>Recommended Laboratory Quality Verification Tests</h4>
          ${renderList(r.checks)}
        </div>

        <div class="report-section note-box">
          <strong style="color:#fff">Metallurgist Technical Assessment:</strong>
          <p style="margin-top:0.3rem">${String(r.note || '').replace(/</g, '&lt;')}</p>
        </div>

        <div class="row" style="margin-top:1.5rem">
          <button class="btn" id="dlReport">Download Inspection Certificate (.txt)</button>
          <button class="btn alt" id="consultEng">Consult Chief Quality Engineer</button>
        </div>
      </div>
    `;

    $('#dlReport').onclick = () => {
      const text = [
        `=================================================================`,
        `                 IRAIVAN STEELS QUALITY INSPECTION               `,
        `               AUTOMATED MATERIAL DIAGNOSTICS REPORT             `,
        `=================================================================`,
        `Certificate Ref: ${certId}`,
        `Analysis Engine: ${engineLabel}`,
        `Generated: ${new Date().toLocaleString()}`,
        `Material Specimen: ${r.material}`,
        `Automated Grading: ${r.grade} (Diagnostic Score: ${scoreVal}/100)`,
        ``,
        `OBSERVED VISUAL CHARACTERISTICS / DEFECTS:`,
        ...(r.defects.length ? r.defects.map(d => ` • ${d}`) : [` • No critical defects noted in visual analysis.`]),
        ``,
        `RECOMMENDED STANDARD LABORATORY TESTS:`,
        ...(r.checks.length ? r.checks.map(c => ` • ${c}`) : [` • Standard batch compliance tests.`]),
        ``,
        `TECHNICAL CONSULTANT ASSESSMENT:`,
        r.note,
        ``,
        `COMPLIANCE DISCLAIMER:`,
        `Issued by Iraivan Steels Materials Testing Laboratory under`,
        `IS 1786 / IS 2062 / IS 12269 quality verification standards.`,
        `=================================================================`
      ].join('\n');

      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `IraivanSteels-Quality-Report-${r.material.replace(/\s+/g, '_')}.txt`;
      a.click();
    };

    $('#consultEng').onclick = () => {
      const query = `IRAIVAN QUALITY CONSULTATION ENQUIRY:\nCertificate Ref: ${certId}\nRegarding Material: ${r.material}\nGrade Given: ${r.grade} (${scoreVal}/100)\nEngine: ${engineLabel}\nDefects Flagged:\n${r.defects.join('\n')}\n\nPlease arrange a consultation with your metallurgical lab.`;
      sessionStorage.setItem('quote', query);
      window.location.href = 'contact.html';
    };
  }

  async function sendToBackend(dataUrl) {
    if (hudScan) hudScan.style.display = 'block';
    res.innerHTML = `
      <div style="padding:2.5rem;text-align:center">
        <div class="spinner"></div>
        <h3 style="margin-top:1rem;color:var(--ink)">Analysing Material Morphology…</h3>
        <p style="color:var(--mut);font-size:0.9rem">Extracting surface texture, micro-fractures, color consistency and edge arrises using civil diagnostics models.</p>
      </div>
    `;

    $('#scanBtn').disabled = true;

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Scan request failed');
      showReport(data);
    } catch (err) {
      if (hudScan) hudScan.style.display = 'none';
      res.innerHTML = `
        <div style="padding:1.5rem;background:#fff1f0;border:1px solid #ffa39e;border-radius:6px;color:#cf1322">
          <strong>Scan Error:</strong> ${err.message || 'Inspection failed. Please try a clearer, well-lit photo.'}
        </div>
      `;
    } finally {
      $('#scanBtn').disabled = false;
    }
  }

  // Camera handling
  $('#camBtn').onclick = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      v.srcObject = stream;
      v.style.display = 'block';
      sn.style.display = 'none';
      await v.play();
      $('#scanBtn').disabled = false;
      $('#camBtn').textContent = 'Camera Active ✓';
    } catch (e) {
      res.innerHTML = `
        <div style="padding:1rem;background:#fffbe6;border:1px solid #ffe58f;border-radius:6px;color:#d46b08">
          <strong>Camera Unavailable:</strong> ${e.message}. You can upload a photo or use one of our test sample presets below!
        </div>
      `;
    }
  };

  $('#scanBtn').onclick = () => {
    if (!v.videoWidth) return;
    const w = Math.min(1024, v.videoWidth);
    const h = (w * v.videoHeight) / v.videoWidth;
    sn.width = w;
    sn.height = h;
    const ctx = sn.getContext('2d');
    ctx.drawImage(v, 0, 0, w, h);
    sn.style.display = 'block';
    v.style.display = 'none';
    sendToBackend(sn.toDataURL('image/jpeg', 0.9));
  };

  // File upload handling
  $('#file').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const maxW = 1024;
      const scale = Math.min(1, maxW / img.width);
      sn.width = img.width * scale;
      sn.height = img.height * scale;
      const ctx = sn.getContext('2d');
      ctx.drawImage(img, 0, 0, sn.width, sn.height);
      sn.style.display = 'block';
      v.style.display = 'none';
      sendToBackend(sn.toDataURL('image/jpeg', 0.9));
    };
    img.src = URL.createObjectURL(file);
  };

  // Sample Preset Buttons Setup
  const sampleContainer = $('#samplePills');
  if (sampleContainer) {
    sampleContainer.innerHTML = Object.entries(SAMPLES).map(([key, s]) => `
      <button class="btn-sample" data-sample="${key}">🔍 ${s.name}</button>
    `).join('');

    sampleContainer.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.sample;
        const dataUrl = SAMPLES[key].generate();

        const img = new Image();
        img.onload = () => {
          sn.width = img.width;
          sn.height = img.height;
          sn.getContext('2d').drawImage(img, 0, 0);
          sn.style.display = 'block';
          v.style.display = 'none';
          sendToBackend(dataUrl);
        };
        img.src = dataUrl;
      };
    });
  }

})();
