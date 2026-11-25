/* ==========================================================================
   IRAIVAN STEELS - Cinematic Real-World House Construction Intro Engine
   High-definition real-world architectural building construction sequence
   with real-time engineering telemetry, WebGL depth, and commodity market feed
   ========================================================================== */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // 1. Live Commodity Price Feed (Real-Time Gold-Style Terminal)
  // -------------------------------------------------------------
  let cachedPrices = [];

  async function fetchLivePrices() {
    try {
      const res = await fetch('/api/prices');
      const data = await res.json();
      cachedPrices = data.items || [];

      renderTicker(cachedPrices, data.timestamp);
      renderPriceTerminal(cachedPrices);
      setupEstimator(cachedPrices);
    } catch (e) {
      console.warn('Price feed note:', e.message);
    }
  }

  function renderTicker(items, timestamp) {
    const track = document.getElementById('tickerTrack');
    if (!track) return;

    track.innerHTML = items.map(item => {
      const isUp = item.diff > 0;
      const isFlat = item.diff === 0;
      const sign = isUp ? '▲ +' : (isFlat ? '▬ ' : '▼ ');
      const cls = isUp ? 'ticker-up' : (isFlat ? '' : 'ticker-down');

      return `
        <div class="ticker-item">
          <span class="ticker-name">${item.name}</span>
          <span class="ticker-price">₹${item.today.toLocaleString('en-IN')}</span>
          <span class="${cls}">${sign}₹${Math.abs(item.diff)} (${item.pct}%)</span>
        </div>
      `;
    }).join('');

    const timeEl = document.getElementById('tickerTime');
    if (timeEl && timestamp) {
      const t = new Date(timestamp);
      timeEl.textContent = 'UPDATED ' + t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST';
    }
  }

  function generateSparkline(history, isUp) {
    if (!history || history.length < 2) return '';
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = (max - min) || 1;
    const w = 260, h = 42;

    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * w;
      const y = h - ((val - min) / range) * (h - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const strokeColor = isUp ? '#00e676' : '#ff5252';
    const fillColor = isUp ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 82, 82, 0.12)';

    return `
      <svg viewBox="0 0 ${w} ${h}">
        <polygon points="0,${h} ${points} ${w},${h}" fill="${fillColor}" />
        <polyline points="${points}" fill="none" stroke="${strokeColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  function renderPriceTerminal(items) {
    const grid = document.getElementById('pricesGrid');
    if (!grid) return;

    grid.innerHTML = items.map(item => {
      const isUp = item.diff > 0;
      const isFlat = item.diff === 0;
      const badgeCls = isUp ? 'up' : (isFlat ? 'flat' : 'down');
      const badgeSign = isUp ? '▲ +' : (isFlat ? '▬ ' : '▼ ');

      return `
        <div class="price-card">
          <div class="price-card-header">
            <div>
              <div class="price-card-name">${item.name}</div>
              <div class="price-card-cat">${item.category}</div>
            </div>
            <div class="price-change-badge ${badgeCls}">
              ${badgeSign}₹${Math.abs(item.diff)} (${item.pct}%)
            </div>
          </div>

          <div class="price-main-val">
            ₹${item.today.toLocaleString('en-IN')}
            <span class="price-unit">/ ${item.unit}</span>
          </div>

          <div class="price-compare-row">
            <span class="compare-label">Yesterday Close:</span>
            <span class="compare-val">₹${item.yesterday.toLocaleString('en-IN')}</span>
          </div>

          <div class="sparkline-box">
            ${generateSparkline(item.history, isUp)}
          </div>

          <div class="price-day-range">
            <span>24h Low: <strong>₹${item.low24h.toLocaleString('en-IN')}</strong></span>
            <span>24h High: <strong>₹${item.high24h.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }

  function setupEstimator(items) {
    const select = document.getElementById('estProduct');
    const inputQty = document.getElementById('estQty');
    const outTotal = document.getElementById('estTotal');
    const outBase = document.getElementById('estBase');
    const outGst = document.getElementById('estGst');
    const outRate = document.getElementById('estRate');
    const btnBook = document.getElementById('btnBookRate');

    if (!select || !inputQty) return;

    select.innerHTML = items.map(item => `
      <option value="${item.id}" data-rate="${item.today}" data-unit="${item.unit}" data-name="${item.name}">
        ${item.name} — ₹${item.today.toLocaleString('en-IN')} / ${item.unit}
      </option>
    `).join('');

    function recalc() {
      const opt = select.selectedOptions[0];
      if (!opt) return;
      const rate = parseFloat(opt.dataset.rate) || 0;
      const qty = Math.max(0.1, parseFloat(inputQty.value) || 1);

      const baseAmount = rate * qty;
      const gstRate = opt.dataset.name.includes('Cement') ? 0.28 : 0.18;
      const gstAmount = baseAmount * gstRate;
      const totalAmount = baseAmount + gstAmount;

      if (outRate) outRate.textContent = `₹${rate.toLocaleString('en-IN')} / ${opt.dataset.unit}`;
      if (outBase) outBase.textContent = `₹${Math.round(baseAmount).toLocaleString('en-IN')}`;
      if (outGst) outGst.textContent = `₹${Math.round(gstAmount).toLocaleString('en-IN')} (${(gstRate * 100)}%)`;
      if (outTotal) outTotal.textContent = `₹${Math.round(totalAmount).toLocaleString('en-IN')}`;

      if (btnBook) {
        btnBook.onclick = () => {
          const summary = `IRAIVAN STEELS RATE BOOKING:\nProduct: ${opt.dataset.name}\nQuantity: ${qty} ${opt.dataset.unit}\nLocked Spot Rate: ₹${rate.toLocaleString('en-IN')}\nEstimated Total (incl. GST): ₹${Math.round(totalAmount).toLocaleString('en-IN')}\n\nPlease dispatch proforma invoice and confirm yard allocation.`;
          sessionStorage.setItem('quote', summary);
          window.location.href = 'contact.html';
        };
      }
    }

    select.onchange = recalc;
    inputQty.oninput = recalc;
    recalc();
  }

  // -------------------------------------------------------------
  // 2. Persistent Ambient WebGL Background
  // -------------------------------------------------------------
  function initAmbientBg() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } catch (e) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 6, 14);
    camera.lookAt(0, 0, 0);

    const grid = new THREE.GridHelper(90, 45, 0x1d6bb8, 0x1a2633);
    grid.position.y = -4;
    scene.add(grid);

    const count = 240;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 40;
      pos[i + 1] = Math.random() * 16 - 4;
      pos[i + 2] = (Math.random() - 0.5) * 40;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00d2ff, size: 0.08, transparent: true, opacity: 0.35 });
    const nodes = new THREE.Points(geom, mat);
    scene.add(nodes);

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
    window.addEventListener('resize', onResize);
    onResize();

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.3;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.3;
    });

    function anim(time) {
      requestAnimationFrame(anim);
      nodes.rotation.y = time * 0.0001 + mouseX * 0.4;
      grid.rotation.y = time * 0.00005;
      camera.position.x = mouseX * 2.5;
      camera.position.y = 6 - mouseY * 1.5;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(anim);
  }

  // -------------------------------------------------------------
  // 3. CINEMATIC 4K FAMOUS LANDMARK CONSTRUCTION INTRO (OVERLAY ONLY)
  //    Rotates dynamically on every site visit across world-renowned
  //    engineering marvels and structural steel masterworks (100% letter-free)
  // -------------------------------------------------------------
  const FAMOUS_PROJECTS = [
    {
      id: 'mercedes-benz-stadium',
      name: 'Mercedes-Benz Mega Steel Arena',
      location: 'Atlanta, USA',
      badge: '★ 27,000 MT KINETIC STEEL SPACEFRAME & PETAL ROOF',
      videoSources: [
        { src: 'assets/intro/intro_stadium_steel.webm', type: 'video/webm' }
      ],
      playbackRate: 1.25,
      labels: ['Structural Steel', 'Column Height', 'High-Grade Concrete', 'Roof Span'],
      phases: [
        {
          p: 0.00,
          title: '1. Deep Caisson Piling & Superstructure Foundations',
          sub: 'Drilling 40-meter bedrock caissons and massive cast-in-place concrete pile caps supporting mega-column reactions.',
          telemetry: { m1: '3,800 MT', m2: '45 m', m3: '42,000 m³', m4: 'Ø 120 m' }
        },
        {
          p: 0.22,
          title: '2. Perimeter Concrete Cores & Mega Steel Columns',
          sub: 'Reinforced concrete shear cores and perimeter heavy structural steel box columns engineered for 27,000 MT load path.',
          telemetry: { m1: '11,400 MT', m2: '88 m', m3: '96,000 m³', m4: 'Ø 165 m' }
        },
        {
          p: 0.46,
          title: '3. Heavy Crawler Crane Super-Truss Erection',
          sub: 'Dual Manitowoc crawler cranes hoisting the 220-meter primary structural steel spaceframe arch and cantilever box girders.',
          telemetry: { m1: '19,200 MT', m2: '120 m', m3: '135,000 m³', m4: 'Ø 200 m' }
        },
        {
          p: 0.70,
          title: '4. Eight Kinetic Cantilever Petal Trusses',
          sub: 'Radial assembly of the eight kinetic steel roof petals that glide smoothly on motorized bogie rail tracks.',
          telemetry: { m1: '24,600 MT', m2: '145 m', m3: '150,000 m³', m4: 'Ø 220 m' }
        },
        {
          p: 0.90,
          title: '5. ETFE Pneumatic Facade & 360° Halo Ribbon',
          sub: 'Triple-layer ETFE translucent facade installation and 360-degree high-definition halo structural display ring.',
          telemetry: { m1: '27,000 MT', m2: '145 m', m3: '150,000 m³', m4: 'Ø 220 m' }
        }
      ]
    },
    {
      id: 'hudson-yards',
      name: 'Hudson Yards Manhattan Mega-Structure',
      location: 'New York City, USA',
      badge: '★ 52-STOREY HIGH-RISE COMPOSITE STRUCTURAL STEEL CORE',
      videoSources: [
        { src: 'assets/intro/intro_hudson_yards.webm', type: 'video/webm' }
      ],
      playbackRate: 1.25,
      labels: ['Structural Steel', 'Drilled Caissons', 'High-Strength Core', 'Tower Elevation'],
      phases: [
        {
          p: 0.00,
          title: '1. Deep Caisson Piling & Active Rail Platform',
          sub: 'Drilling 300+ bedrock caissons between active passenger rail tracks and constructing massive structural transfer deck.',
          telemetry: { m1: '6,500 MT', m2: '300+ Units', m3: '18,000 m³', m4: '+24 m' }
        },
        {
          p: 0.20,
          title: '2. High-Strength Concrete Slipform Core',
          sub: 'Self-climbing jump formwork casting continuous 8,000 PSI shear walls with embedded steel node plates.',
          telemetry: { m1: '14,200 MT', m2: '300+ Units', m3: '38,000 m³', m4: '+110 m' }
        },
        {
          p: 0.45,
          title: '3. Heavy Perimeter Composite Steel Columns',
          sub: 'Twin high-altitude tower cranes lifting 40-ton steel column sections and corrugated metal composite deck slabs.',
          telemetry: { m1: '22,800 MT', m2: '300+ Units', m3: '58,000 m³', m4: '+230 m' }
        },
        {
          p: 0.70,
          title: '4. Structural Topping Out & High-Altitude Outriggers',
          sub: 'Completion of 52 structural steel floors, outrigger truss belts, and upper mechanical plantrooms.',
          telemetry: { m1: '29,400 MT', m2: '300+ Units', m3: '76,000 m³', m4: '+340 m' }
        },
        {
          p: 0.90,
          title: '5. Unitized Curtain Wall Facade & Cantilever Deck',
          sub: 'Low-E acoustic insulated glass unitized curtain wall envelopes and outward cantilever observation skydeck.',
          telemetry: { m1: '32,000 MT', m2: '300+ Units', m3: '85,000 m³', m4: '+395 m' }
        }
      ]
    },
    {
      id: 'hudson-yards-tower',
      name: 'Shanghai Tower Mega-Structural Steel Core',
      location: 'Shanghai, China',
      badge: '★ 2,073-FT TWISTED COMPOSITE MEGA-STRUCTURAL STEEL TOWER',
      videoSources: [
        { src: 'assets/intro/intro_stadium_steel.webm', type: 'video/webm' }
      ],
      playbackRate: 1.1,
      labels: ['Structural Steel', 'Mega Columns', 'High-Strength Concrete', 'Tower Height'],
      phases: [
        {
          p: 0.00,
          title: '1. Rock Socket Piling & Barrette Foundation',
          sub: 'Installation of 1,000 reinforced barrette piles socketed 60 meters into Shanghai bedrock clay.',
          telemetry: { m1: '4,200 MT', m2: '1,078 piles', m3: '12,000 m³', m4: '+0 m' }
        },
        {
          p: 0.22,
          title: '2. Mega-Column Grid & Inner Core Walls',
          sub: 'Eight composite mega-columns housing steel sections encased in ultra-high-strength concrete, plus inner core slip-formed shear walls.',
          telemetry: { m1: '18,000 MT', m2: '8 MegaCols', m3: '62,000 m³', m4: '+120 m' }
        },
        {
          p: 0.48,
          title: '3. Outrigger Truss Belts & Sky Lobbies',
          sub: 'Six outrigger truss zone belts tying the inner core to outer mega-columns at every 15 floors, housing the sky-lobby transfer levels.',
          telemetry: { m1: '33,500 MT', m2: '8 MegaCols', m3: '110,000 m³', m4: '+350 m' }
        },
        {
          p: 0.72,
          title: '4. Twisted Composite Facade Framing',
          sub: 'Progressive 120° twist of the glass curtain wall secondary steel framing reducing wind load by 24% over conventional towers.',
          telemetry: { m1: '50,000 MT', m2: '8 MegaCols', m3: '155,000 m³', m4: '+500 m' }
        },
        {
          p: 0.92,
          title: '5. Spiral Crown & Observation Deck Completion',
          sub: 'Structural topping-out at 632 m with the spiral crown and highest observation deck in China at floor 118.',
          telemetry: { m1: '55,000 MT', m2: '8 MegaCols', m3: '170,000 m³', m4: '+632 m' }
        }
      ]
    }
  ];

  let isIntroActive = false;
  let currentProjectIdx = 0;
  let introInitialized = false;

  function loadFamousProject(idx, shouldAutoplay = true) {
    const video = document.getElementById('introVideo');
    if (idx < 0 || idx >= FAMOUS_PROJECTS.length) idx = 0;
    currentProjectIdx = idx;
    const proj = FAMOUS_PROJECTS[idx];

    // Update HUD elements
    const pCounter = document.getElementById('introProjectCounter');
    const pName = document.getElementById('introProjectName');
    const pLoc = document.getElementById('introProjectLoc');
    const pCat = document.getElementById('introProjectCategory');
    const trackTag = document.getElementById('introBottomTrackTag');

    if (pCounter) pCounter.textContent = `PROJECT ${idx + 1} / ${FAMOUS_PROJECTS.length}`;
    if (pName) pName.textContent = proj.name;
    if (pLoc) pLoc.textContent = proj.location;
    if (pCat) pCat.textContent = proj.badge;
    if (trackTag) trackTag.textContent = `PROJECT ${idx + 1} OF ${FAMOUS_PROJECTS.length}: ${proj.name.toUpperCase()} · 4K ULTRA-HD`;

    // Update HUD telemetry labels
    const lbl1 = document.getElementById('hudMetric1Lbl');
    const lbl2 = document.getElementById('hudMetric2Lbl');
    const lbl3 = document.getElementById('hudMetric3Lbl');
    const lbl4 = document.getElementById('hudMetric4Lbl');
    if (lbl1 && proj.labels[0]) lbl1.textContent = proj.labels[0];
    if (lbl2 && proj.labels[1]) lbl2.textContent = proj.labels[1];
    if (lbl3 && proj.labels[2]) lbl3.textContent = proj.labels[2];
    if (lbl4 && proj.labels[3]) lbl4.textContent = proj.labels[3];

    // Initial phase text & telemetry values
    const initPhase = proj.phases[0];
    const pTitle = document.getElementById('introPhaseTitle');
    const pSub = document.getElementById('introPhaseSub');
    const val1 = document.getElementById('hudMetric1Val') || document.getElementById('hudTmt');
    const val2 = document.getElementById('hudMetric2Val') || document.getElementById('hudCement');
    const val3 = document.getElementById('hudMetric3Val') || document.getElementById('hudBricks');
    const val4 = document.getElementById('hudMetric4Val') || document.getElementById('hudHeight');

    if (pTitle) pTitle.textContent = initPhase.title;
    if (pSub) pSub.textContent = initPhase.sub;
    if (val1) val1.textContent = initPhase.telemetry.m1;
    if (val2) val2.textContent = initPhase.telemetry.m2;
    if (val3) val3.textContent = initPhase.telemetry.m3;
    if (val4) val4.textContent = initPhase.telemetry.m4;

    // Reset progress bar
    const fill = document.getElementById('introProgressFill');
    if (fill) fill.style.width = '0%';
    const elapsed = document.getElementById('introElapsed');
    if (elapsed) elapsed.textContent = '00:00';

    if (video) {
      video.pause();

      const fallback = document.getElementById('introPlayFallback');
      if (fallback) fallback.style.display = 'none';

      // Set direct source on video element for 100% browser compatibility
      const primarySrc = (proj.videoSources && proj.videoSources[0]) ? proj.videoSources[0].src : '';
      if (primarySrc) {
        video.src = primarySrc;
      }

      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      video.load();
      video.playbackRate = proj.playbackRate || 1.25;

      video.onerror = (e) => {
        console.warn('Video load error on project', currentProjectIdx, e);
        // Automatically skip to next project if a browser codec issue occurs
        setTimeout(() => {
          if (isIntroActive) advanceToNextProject();
        }, 800);
      };

      video.onplay = () => {
        const fb = document.getElementById('introPlayFallback');
        if (fb) fb.style.display = 'none';
      };

      if (shouldAutoplay) {
        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Autoplay restricted by browser policy:', err.message);
            const fb = document.getElementById('introPlayFallback');
            if (fb) fb.style.display = 'flex';
          });
        }
      }
    }
  }

  function advanceToNextProject() {
    currentProjectIdx = (currentProjectIdx + 1) % FAMOUS_PROJECTS.length;
    // Persist next index so the next visit continues rotation
    localStorage.setItem('iraivan_famous_project_idx', currentProjectIdx.toString());
    loadFamousProject(currentProjectIdx, true);
  }

  function startCinematicIntro() {
    const overlay = document.getElementById('cinematicIntro');
    const video = document.getElementById('introVideo');
    if (!overlay) return;

    // Determine project index for this entry (cycle sequentially every visit)
    let savedIdx = parseInt(localStorage.getItem('iraivan_famous_project_idx') || '0', 10);
    if (isNaN(savedIdx) || savedIdx < 0) savedIdx = 0;
    savedIdx = (savedIdx + 1) % FAMOUS_PROJECTS.length;
    localStorage.setItem('iraivan_famous_project_idx', savedIdx.toString());

    isIntroActive = true;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      overlay.style.transform = 'scale(1)';
    });

    loadFamousProject(savedIdx, true);

    // Fallback tap-to-play button
    const forcePlayBtn = document.getElementById('btnIntroForcePlay');
    if (forcePlayBtn && video) {
      forcePlayBtn.onclick = (e) => {
        e.stopPropagation();
        video.muted = true;
        video.play().then(() => {
          const fb = document.getElementById('introPlayFallback');
          if (fb) fb.style.display = 'none';
        }).catch(err => {
          console.warn('Manual play attempt:', err);
        });
      };
    }

    if (!introInitialized && video) {
      introInitialized = true;

      const fill = document.getElementById('introProgressFill');
      const elapsed = document.getElementById('introElapsed');
      const remaining = document.getElementById('introRemaining');
      const pTitle = document.getElementById('introPhaseTitle');
      const pSub = document.getElementById('introPhaseSub');
      const val1 = document.getElementById('hudMetric1Val') || document.getElementById('hudTmt');
      const val2 = document.getElementById('hudMetric2Val') || document.getElementById('hudCement');
      const val3 = document.getElementById('hudMetric3Val') || document.getElementById('hudBricks');
      const val4 = document.getElementById('hudMetric4Val') || document.getElementById('hudHeight');

      video.ontimeupdate = () => {
        if (!isIntroActive) return;
        const dur = video.duration || 45;
        const cur = video.currentTime;
        const progress = Math.max(0, Math.min(1, cur / dur));

        if (fill) fill.style.width = (progress * 100).toFixed(1) + '%';

        const curMin = Math.floor(cur / 60);
        const curSec = Math.floor(cur % 60);
        const rem = Math.max(0, dur - cur);
        const remMin = Math.floor(rem / 60);
        const remSec = Math.floor(rem % 60);

        if (elapsed) elapsed.textContent = `${String(curMin).padStart(2, '0')}:${String(curSec).padStart(2, '0')}`;
        if (remaining) remaining.textContent = `${String(remMin).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;

        const proj = FAMOUS_PROJECTS[currentProjectIdx];
        if (proj && proj.phases) {
          let curPhase = proj.phases[0];
          for (let i = 0; i < proj.phases.length; i++) {
            if (progress >= proj.phases[i].p) curPhase = proj.phases[i];
          }

          if (pTitle) pTitle.textContent = curPhase.title;
          if (pSub) pSub.textContent = curPhase.sub;
          if (val1) val1.textContent = curPhase.telemetry.m1;
          if (val2) val2.textContent = curPhase.telemetry.m2;
          if (val3) val3.textContent = curPhase.telemetry.m3;
          if (val4) val4.textContent = curPhase.telemetry.m4;
        }
      };

      video.onended = () => {
        // Auto advance to next famous project or smooth dismiss
        setTimeout(advanceToNextProject, 1200);
      };

      // Button: Next Project (instant switch during intro)
      const btnNext = document.getElementById('btnNextProject');
      if (btnNext) {
        btnNext.onclick = (e) => {
          e.stopPropagation();
          advanceToNextProject();
        };
      }

      // Button: Replay current project video
      const btnReplay = document.getElementById('btnIntroReplay');
      if (btnReplay) {
        btnReplay.onclick = (e) => {
          e.stopPropagation();
          video.currentTime = 0;
          video.play().catch(() => {});
        };
      }

      // Button: Enter Website (dismiss intro)
      const btnEnter = document.getElementById('btnEnterSite');
      if (btnEnter) {
        btnEnter.onclick = (e) => {
          e.stopPropagation();
          closeIntro();
        };
      }
    }

    function closeIntro() {
      if (!isIntroActive) return;
      isIntroActive = false;

      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(1.02)';
      setTimeout(() => {
        overlay.style.display = 'none';
        if (video) video.pause();
      }, 750);
    }
  }

  // -------------------------------------------------------------
  // 4. Hero Real-Time 3D Building Simulator (Three.js WebGL Model)
  //    Parametric structural engineering showcase with 360° orbit
  // -------------------------------------------------------------
  const REAL_WORLD_PHASES = [
    {
      p: 0.00,
      title: '1. Excavation & Monolithic Foundation',
      sub: 'Engineered soil trenches, isolated footing pads & monolithic plinth slab using Dalmia DSP Cement.',
      telemetry: { tmt: '4.2 MT', cement: '180 Bags', bricks: '0', height: '+0.4 m' }
    },
    {
      p: 0.20,
      title: '2. Reinforced Concrete Columns & Steel Girders',
      sub: 'Iraivan Fe 550D primary rebar cages, concrete column curing & heavy ISMB structural floor girders.',
      telemetry: { tmt: '9.4 MT', cement: '380 Bags', bricks: '0', height: '+3.4 m' }
    },
    {
      p: 0.42,
      title: '3. Class-A Burnt Clay Brick Masonry',
      sub: 'High-density wire-cut red clay bricks in running bond with concrete lintel beams across openings.',
      telemetry: { tmt: '12.1 MT', cement: '590 Bags', bricks: '8,400', height: '+5.8 m' }
    },
    {
      p: 0.62,
      title: '4. Intermediate Slab & Cantilever Balcony',
      sub: 'Solid concrete floor slab casting with cantilevered balcony, glass balustrades & upper storey framework.',
      telemetry: { tmt: '14.8 MT', cement: '720 Bags', bricks: '12,800', height: '+6.8 m' }
    },
    {
      p: 0.80,
      title: '5. Roof Structure & Terracotta Spanish Tiles',
      sub: 'Heavy timber roof trusses, ridge beam & kiln-fired terracotta roof tiles with protective weather ridge.',
      telemetry: { tmt: '14.8 MT', cement: '850 Bags', bricks: '14,200', height: '+8.2 m' }
    },
    {
      p: 0.94,
      title: '6. Architectural Facade & Teakwood Glazing',
      sub: 'Exterior weather-shield coating, teakwood main entrance, tinted glass panes & interior lighting.',
      telemetry: { tmt: '14.8 MT', cement: '850 Bags', bricks: '14,200', height: '+8.2 m' }
    }
  ];

  function initHeroRealWorldStage() {
    const canvas = document.getElementById('hero3dCanvas');
    if (!canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch (e) {
      console.warn('Three.js initialization note:', e);
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060a0f, 0.035);

    const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 80);
    let camRadius = 14;
    let camTheta = 0.75; // azimuth
    let camPhi = 0.55;   // elevation
    let autoRotate = true;

    function updateCameraPos() {
      camera.position.x = camRadius * Math.sin(camTheta) * Math.cos(camPhi);
      camera.position.y = Math.max(1.8, camRadius * Math.sin(camPhi));
      camera.position.z = camRadius * Math.cos(camTheta) * Math.cos(camPhi);
      camera.lookAt(0, 1.4, 0);
    }
    updateCameraPos();

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    dirLight.position.set(12, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const blueFill = new THREE.DirectionalLight(0x00d2ff, 0.45);
    blueFill.position.set(-10, 8, -10);
    scene.add(blueFill);

    // Architectural Ground Grid
    const groundGrid = new THREE.GridHelper(24, 24, 0x00d2ff, 0x182430);
    groundGrid.position.y = -0.01;
    scene.add(groundGrid);

    // Ground Concrete Plinth Pad
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x222a35, roughness: 0.85, metalness: 0.1 });
    const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.4, 8.4), plinthMat);
    plinthMesh.position.set(0, 0.2, 0);
    plinthMesh.receiveShadow = true;
    scene.add(plinthMesh);

    // Construction Building Group
    const houseGroup = new THREE.Group();
    scene.add(houseGroup);

    // Materials
    const footingMat = new THREE.MeshStandardMaterial({ color: 0x3d4957, roughness: 0.9 });
    const steelRebarMat = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.85, roughness: 0.25 });
    const columnConcreteMat = new THREE.MeshStandardMaterial({ color: 0x7c8a98, roughness: 0.7 });
    const beamSteelMat = new THREE.MeshStandardMaterial({ color: 0x2d5a88, metalness: 0.75, roughness: 0.35 });
    const brickMat = new THREE.MeshStandardMaterial({ color: 0xa8422b, roughness: 0.85 });
    const slabMat = new THREE.MeshStandardMaterial({ color: 0x8a98a6, roughness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.4, roughness: 0.1 });
    const roofWoodMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.75 });
    const tileMat = new THREE.MeshStandardMaterial({ color: 0xb33924, roughness: 0.65 });
    const paintMat = new THREE.MeshStandardMaterial({ color: 0xdde6ed, roughness: 0.5 });

    // --- 1. Footings & Excavation (Stage 0.0 - 0.20) ---
    const footingsGroup = new THREE.Group();
    const colCoords = [
      [-3.4, -2.8], [3.4, -2.8],
      [-3.4, 2.8], [3.4, 2.8],
      [0, -2.8], [0, 2.8]
    ];
    colCoords.forEach(([cx, cz]) => {
      const fBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), footingMat);
      fBox.position.set(cx, 0.38, cz);
      fBox.castShadow = true;
      footingsGroup.add(fBox);
    });
    houseGroup.add(footingsGroup);

    // --- 2. Columns with Visible Fe 550D Rebars (Stage 0.20 - 0.42) ---
    const columnsGroup = new THREE.Group();
    const rebarsGroup = new THREE.Group();

    colCoords.forEach(([cx, cz]) => {
      // Internal Fe 550D Rebar Starter Cages
      for (let rx = -0.15; rx <= 0.15; rx += 0.3) {
        for (let rz = -0.15; rz <= 0.15; rz += 0.3) {
          const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.4, 8), steelRebarMat);
          rebar.position.set(cx + rx, 1.9, cz + rz);
          rebarsGroup.add(rebar);
        }
      }
      // Concrete Encased Column
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 0.5), columnConcreteMat);
      col.position.set(cx, 1.8, cz);
      col.castShadow = true;
      columnsGroup.add(col);
    });
    houseGroup.add(rebarsGroup);
    houseGroup.add(columnsGroup);

    // --- Structural ISMB Steel Girders across tops ---
    const beamsGroup = new THREE.Group();
    // Longitudinal beams
    [-2.8, 2.8].forEach(cz => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.28, 0.28), beamSteelMat);
      beam.position.set(0, 3.35, cz);
      beam.castShadow = true;
      beamsGroup.add(beam);
    });
    // Transverse beams
    [-3.4, 0, 3.4].forEach(cx => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 5.8), beamSteelMat);
      beam.position.set(cx, 3.35, 0);
      beam.castShadow = true;
      beamsGroup.add(beam);
    });
    houseGroup.add(beamsGroup);

    // --- 3. Brick Masonry Walls (Stage 0.42 - 0.62) ---
    const wallsGroup = new THREE.Group();
    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.8, 0.3), brickMat);
    backWall.position.set(0, 1.8, -2.8);
    backWall.castShadow = true;
    wallsGroup.add(backWall);

    // Left Wall with window opening
    const leftWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.8, 2.2), brickMat);
    leftWall1.position.set(-3.4, 1.8, -1.6);
    wallsGroup.add(leftWall1);
    const leftWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.8, 2.2), brickMat);
    leftWall2.position.set(-3.4, 1.8, 1.6);
    wallsGroup.add(leftWall2);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.8, 5.6), brickMat);
    rightWall.position.set(3.4, 1.8, 0);
    rightWall.castShadow = true;
    wallsGroup.add(rightWall);

    // Front Wall with Doorway
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.3), brickMat);
    frontWallLeft.position.set(-2.2, 1.8, 2.8);
    wallsGroup.add(frontWallLeft);
    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.3), brickMat);
    frontWallRight.position.set(2.2, 1.8, 2.8);
    wallsGroup.add(frontWallRight);
    houseGroup.add(wallsGroup);

    // --- 4. Intermediate RCC Slab & Balcony (Stage 0.62 - 0.80) ---
    const slabGroup = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.3, 6.4), slabMat);
    slab.position.set(0, 3.5, 0);
    slab.castShadow = true;
    slab.receiveShadow = true;
    slabGroup.add(slab);

    // Cantilever Balcony
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 1.6), slabMat);
    balcony.position.set(0, 3.45, 3.8);
    balcony.castShadow = true;
    slabGroup.add(balcony);

    // Glass Balustrade
    const glassRail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.75, 0.08), glassMat);
    glassRail.position.set(0, 3.9, 4.5);
    slabGroup.add(glassRail);
    houseGroup.add(slabGroup);

    // --- 5. Upper Storey & Timber Pitched Roof (Stage 0.80 - 0.94) ---
    const roofGroup = new THREE.Group();
    // Upper Walls
    const upBack = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.2, 0.28), paintMat);
    upBack.position.set(0, 4.7, -2.8);
    roofGroup.add(upBack);

    // Triangular Gable Ends
    const gableGeom = new THREE.ConeGeometry(3.9, 1.8, 4);
    gableGeom.rotateY(Math.PI / 4);
    const gableMesh = new THREE.Mesh(gableGeom, roofWoodMat);
    gableMesh.position.set(0, 6.2, 0);
    roofGroup.add(gableMesh);

    // Terracotta Pitched Roof Planes
    const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 6.8), tileMat);
    roofLeft.position.set(-1.8, 6.1, 0);
    roofLeft.rotation.z = 0.42;
    roofLeft.castShadow = true;
    roofGroup.add(roofLeft);

    const roofRight = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 6.8), tileMat);
    roofRight.position.set(1.8, 6.1, 0);
    roofRight.rotation.z = -0.42;
    roofRight.castShadow = true;
    roofGroup.add(roofRight);
    houseGroup.add(roofGroup);

    // --- 6. Exterior Finishes & Lighting (Stage 0.94 - 1.0) ---
    const finishesGroup = new THREE.Group();
    // Smooth Plaster / Paint Coating on Walls
    const coatGeom = new THREE.BoxGeometry(7.4, 2.85, 0.04);
    const coatFront = new THREE.Mesh(coatGeom, paintMat);
    coatFront.position.set(0, 1.8, 2.96);
    finishesGroup.add(coatFront);

    // Warm Interior Glow Light
    const roomLight = new THREE.PointLight(0xffaa44, 2.5, 12);
    roomLight.position.set(0, 2.2, 0);
    finishesGroup.add(roomLight);
    houseGroup.add(finishesGroup);

    // Update Building Construction Visibility based on Progress (0.0 to 1.0)
    let currentProgress = 0;

    function applyStageProgress(p) {
      currentProgress = Math.max(0, Math.min(1, p));

      // Footings: 0.0 to 0.18
      footingsGroup.visible = currentProgress > 0.02;
      footingsGroup.scale.y = Math.min(1, currentProgress / 0.15);

      // Columns & Rebars: 0.18 to 0.42
      const colProg = Math.max(0, Math.min(1, (currentProgress - 0.15) / 0.25));
      rebarsGroup.visible = currentProgress > 0.14;
      rebarsGroup.scale.y = colProg;
      columnsGroup.visible = currentProgress > 0.22;
      columnsGroup.scale.y = Math.max(0.01, Math.min(1, (currentProgress - 0.22) / 0.18));
      beamsGroup.visible = currentProgress > 0.36;

      // Brickwork: 0.40 to 0.62
      const wallProg = Math.max(0, Math.min(1, (currentProgress - 0.40) / 0.22));
      wallsGroup.visible = currentProgress > 0.40;
      wallsGroup.scale.y = Math.max(0.01, wallProg);

      // Slabs: 0.60 to 0.80
      slabGroup.visible = currentProgress > 0.60;

      // Roof: 0.78 to 0.94
      roofGroup.visible = currentProgress > 0.78;
      const roofProg = Math.max(0, Math.min(1, (currentProgress - 0.78) / 0.16));
      roofGroup.scale.set(roofProg, roofProg, roofProg);

      // Finishes: 0.94 to 1.0
      finishesGroup.visible = currentProgress > 0.93;

      // Update UI Indicators
      const scrubber = document.getElementById('animScrubber');
      if (scrubber && !scrubber.matches(':active')) {
        scrubber.value = (currentProgress * 100).toFixed(1);
      }

      const pctEl = document.getElementById('animProgressPct');
      if (pctEl) pctEl.textContent = `${Math.round(currentProgress * 100)}%`;

      let curPhase = (typeof REAL_WORLD_PHASES !== 'undefined' && REAL_WORLD_PHASES[0]) ? REAL_WORLD_PHASES[0] : { title: 'Construction Progress', sub: 'Parametric building assembly.' };
      if (typeof REAL_WORLD_PHASES !== 'undefined') {
        REAL_WORLD_PHASES.forEach(ph => {
          if (currentProgress >= ph.p) curPhase = ph;
        });
      }

      const stgName = document.getElementById('animStageName');
      if (stgName) stgName.textContent = curPhase.title;

      const phDesc = document.getElementById('animPhaseDesc');
      if (phDesc) phDesc.textContent = curPhase.sub;

      document.querySelectorAll('#animPhasePills button').forEach((btn, idx) => {
        const phVal = parseFloat(btn.dataset.phase) / 100;
        const nextVal = (typeof REAL_WORLD_PHASES !== 'undefined' && REAL_WORLD_PHASES[idx + 1]) ? REAL_WORLD_PHASES[idx + 1].p : 1.01;
        const active = (currentProgress >= phVal && currentProgress < nextVal);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    applyStageProgress(0);

    // Interactive Drag to Orbit 360° Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      autoRotate = false;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      camTheta += dx * 0.008;
      camPhi = Math.max(0.12, Math.min(1.35, camPhi + dy * 0.008));
      updateCameraPos();
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      camRadius = Math.max(8, Math.min(24, camRadius + e.deltaY * 0.015));
      updateCameraPos();
    }, { passive: false });

    // Touch support for mobile devices
    let touchStartX = 0;
    let touchStartY = 0;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        autoRotate = false;
      }
    });
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        camTheta += dx * 0.01;
        camPhi = Math.max(0.12, Math.min(1.35, camPhi + dy * 0.01));
        updateCameraPos();
      }
    });

    // Resize Handler
    function onResize() {
      const parent = canvas.parentElement || canvas;
      const w = parent.clientWidth || 800;
      const h = parent.clientHeight || 420;
      renderer.setSize(w, h, false);
      camera.aspect = w / (h || 1);
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);
    onResize();

    // Controls & Scrubber Bindings
    let isPlaying = true;
    let heroSpeed = 1.0;
    let lastTime = performance.now();

    const btnPlay = document.getElementById('btnAnimPlay');
    if (btnPlay) {
      btnPlay.onclick = () => {
        isPlaying = !isPlaying;
        btnPlay.textContent = isPlaying ? 'Pause ❚❚' : 'Play ▶';
      };
    }

    const btnReplay = document.getElementById('btnAnimReplay');
    if (btnReplay) {
      btnReplay.onclick = () => {
        currentProgress = 0;
        applyStageProgress(0);
        isPlaying = true;
        if (btnPlay) btnPlay.textContent = 'Pause ❚❚';
      };
    }

    const btnAnimCam = document.getElementById('btnAnimCam');
    if (btnAnimCam) {
      btnAnimCam.onclick = () => {
        autoRotate = !autoRotate;
        btnAnimCam.textContent = autoRotate ? 'Cinematic Cam: ON' : 'Cinematic Cam: OFF';
      };
    }

    const scrubber = document.getElementById('animScrubber');
    if (scrubber) {
      scrubber.oninput = (e) => {
        const val = parseFloat(e.target.value) / 100;
        applyStageProgress(val);
      };
    }

    const speedPill = document.getElementById('animSpeedToggle');
    if (speedPill) {
      speedPill.onclick = () => {
        if (heroSpeed === 1.0) {
          heroSpeed = 2.0;
          speedPill.textContent = '2x';
        } else if (heroSpeed === 2.0) {
          heroSpeed = 0.5;
          speedPill.textContent = '0.5x';
        } else {
          heroSpeed = 1.0;
          speedPill.textContent = '1x';
        }
      };
    }

    document.querySelectorAll('#animPhasePills button').forEach(btn => {
      btn.onclick = () => {
        const targetVal = parseFloat(btn.dataset.phase) / 100;
        applyStageProgress(targetVal);
      };
    });

    // Animation Render Loop
    function animate(time) {
      requestAnimationFrame(animate);

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (isPlaying) {
        currentProgress += (dt / 16.0) * heroSpeed;
        if (currentProgress > 1.0) currentProgress = 0.0;
        applyStageProgress(currentProgress);
      }

      if (autoRotate && !isDragging) {
        camTheta += dt * 0.12;
        updateCameraPos();
      }

      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  }

  // --- Bootstrap Engine ---
  function init() {
    fetchLivePrices();
    initAmbientBg();
    initHeroRealWorldStage();

    // Always launch rotating famous landmark construction intro on entry
    const overlay = document.getElementById('cinematicIntro');
    if (overlay) {
      startCinematicIntro();
    }

    // Button in Hero to manually replay full-screen 4K intro
    const btnHeroWatch = document.getElementById('btnHeroWatchIntro');
    if (btnHeroWatch) {
      btnHeroWatch.onclick = () => {
        startCinematicIntro();
      };
    }

    // Refresh commodity prices every 60 seconds
    setInterval(fetchLivePrices, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
