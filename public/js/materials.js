/* ==========================================================================
   IRAIVAN STEELS - 3D Materials Showcase & Live Price Commodity Terminal
   Features:
   - Realistic 3D PBR Shaders, Wireframe CAD mode, X-Ray core mode
   - Studio lighting controls & speed toggles
   - Live Spot Price vs Yesterday Closing Price (Gold-Style Realtime Feed)
   - 7-day historical price fluctuation graphs
   ========================================================================== */

const MATERIALS_CATALOG = [
  {
    id: 'iraivan-tmt',
    name: 'Iraivan Fe 550D TMT Structural Rebar',
    category: 'Primary Structural Steel',
    brand: 'IRAIVAN STEELS PRIMARY MILLS',
    image: 'assets/materials/tmt_rebar.jpg',
    imageCaption: 'Iraivan Fe 550D TMT Rebar — Authentic Primary Billet Quenched Steel',
    tagline: 'Thermo-Mechanically Treated High-Yield Rebar with Superior Ductility',
    standards: 'IS 1786:2008 Fe 550D · GreenPro Certified',
    desc: 'Manufactured through primary steel billet continuous casting and computerized online Tempcore water quenching. Delivers 575 N/mm² yield proof stress and high elongation for superior seismic and earthquake resistance in RCC columns and beams.',
    pricing: {
      today: 61800,
      yesterday: 61150,
      unit: 'MT (Metric Ton)',
      high24h: 62100,
      low24h: 60950,
      history: [59800, 60400, 60900, 60700, 61150, 61800],
      tax: '18% GST Extra'
    },
    specs: {
      'Steel Grade Standard': 'Fe 550D (High Ductility Seismic Grade)',
      '0.2% Proof Stress (Yield)': '575 N/mm² (Standard min 550 N/mm²)',
      'Ultimate Tensile Strength': '645 N/mm²',
      'UTS / YS Ratio': '1.12 (Seismic safety buffer)',
      'Total Elongation': '16.5% (Standard min 14.5%)',
      'Bend / Rebend Angle': '180° mandrel without rupture',
      'Carbon Equivalent (CE)': '< 0.38% (Superior site weldability)',
      'Corrosion Resistance': 'CRS (Copper-Chromium Microalloyed)'
    },
    build: (options) => {
      const g = new THREE.Group();
      const isWire = options.renderMode === 'wireframe';
      const isXray = options.renderMode === 'xray';

      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x5a6672,
        metalness: isXray ? 0.2 : 0.92,
        roughness: isXray ? 0.9 : 0.28,
        wireframe: isWire,
        transparent: isXray,
        opacity: isXray ? 0.38 : 1.0
      });

      const ribMat = new THREE.MeshStandardMaterial({
        color: 0x48525b,
        metalness: isXray ? 0.2 : 0.88,
        roughness: isXray ? 0.9 : 0.35,
        wireframe: isWire,
        transparent: isXray,
        opacity: isXray ? 0.38 : 1.0
      });

      // Bundle of 5 TMT rebar rods
      const rodOffsets = [
        [0, 0, 0],
        [-0.4, 0.35, 0.1],
        [0.4, 0.35, -0.1],
        [-0.35, -0.38, -0.05],
        [0.35, -0.38, 0.05]
      ];

      rodOffsets.forEach(([rx, ry, rz]) => {
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.8, 18), steelMat);
        cylinder.rotation.z = Math.PI / 2;
        cylinder.position.set(rx, ry, rz);
        g.add(cylinder);

        // Transverse ribs along bar
        for (let k = -15; k <= 15; k++) {
          const rib = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.024, 8, 16), ribMat);
          rib.rotation.y = Math.PI / 2;
          rib.position.set(rx + k * 0.12, ry, rz);
          g.add(rib);
        }

        // Longitudinal spine ribs
        const spine1 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.045, 0.035), ribMat);
        spine1.position.set(rx, ry + 0.145, rz);
        g.add(spine1);
        const spine2 = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.045, 0.035), ribMat);
        spine2.position.set(rx, ry - 0.145, rz);
        g.add(spine2);
      });

      // Internal tempered core visualization when in X-Ray mode
      if (isXray) {
        rodOffsets.forEach(([rx, ry, rz]) => {
          const core = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 3.8, 14),
            new THREE.MeshBasicMaterial({ color: 0x00d2ff, wireframe: false })
          );
          core.rotation.z = Math.PI / 2;
          core.position.set(rx, ry, rz);
          g.add(core);
        });
      }

      // Embossed Brand Label Tag
      const cv = document.createElement('canvas');
      cv.width = 512;
      cv.height = 128;
      const x = cv.getContext('2d');
      x.fillStyle = '#111922';
      x.fillRect(0, 0, 512, 128);
      x.fillStyle = '#f5a623';
      x.font = '800 38px Archivo, sans-serif';
      x.fillText('IRAIVAN STEELS · FE 550D', 24, 78);
      const tagTex = new THREE.CanvasTexture(cv);
      const tagMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.4),
        new THREE.MeshBasicMaterial({ map: tagTex, side: THREE.DoubleSide })
      );
      tagMesh.position.set(0, 0.7, 0.2);
      g.add(tagMesh);

      return g;
    }
  },
  {
    id: 'ismb-girder',
    name: 'ISMB 200 Heavy Structural Steel Beam',
    category: 'Structural Sections',
    brand: 'IRAIVAN HEAVY SECTIONS',
    image: 'assets/materials/ismb_beam.jpg',
    imageCaption: 'ISMB 200 Heavy Structural Steel Beam — Hot-Rolled High-Load Carbon Girder',
    tagline: 'Hot-Rolled Carbon Steel Girder for Heavy Commercial Spans',
    standards: 'IS 2062:2011 Grade E250 / E350',
    desc: 'Heavy structural I-beam with tapered flanges designed for industrial crane gantries, pre-engineered buildings, bridge spans, and multi-storey transfer slabs.',
    pricing: {
      today: 58900,
      yesterday: 59200,
      unit: 'MT (Metric Ton)',
      high24h: 59400,
      low24h: 58700,
      history: [59600, 59400, 59100, 59500, 59200, 58900],
      tax: '18% GST Extra'
    },
    specs: {
      'Section Dimensions': 'ISMB 200 (Depth 200mm, Flange 100mm)',
      'Weight per Metre': '25.4 kg / m',
      'Yield Strength (Min)': '250 N/mm² (IS 2062 E250A)',
      'Tensile Strength': '410 - 540 N/mm²',
      'Flange Thickness': '10.8 mm',
      'Web Thickness': '5.7 mm',
      'Moment of Inertia (Ixx)': '2235 cm⁴',
      'Section Modulus (Zxx)': '223.5 cm³'
    },
    build: (options) => {
      const g = new THREE.Group();
      const isWire = options.renderMode === 'wireframe';
      const isXray = options.renderMode === 'xray';

      const mat = new THREE.MeshStandardMaterial({
        color: 0x62717e,
        metalness: isXray ? 0.2 : 0.94,
        roughness: isXray ? 0.9 : 0.25,
        wireframe: isWire,
        transparent: isXray,
        opacity: isXray ? 0.45 : 1.0
      });

      const len = 3.8;
      // Top Flange
      const tf = new THREE.Mesh(new THREE.BoxGeometry(len, 0.16, 1.2), mat);
      tf.position.y = 1.0;
      g.add(tf);
      // Bottom Flange
      const bf = new THREE.Mesh(new THREE.BoxGeometry(len, 0.16, 1.2), mat);
      bf.position.y = -1.0;
      g.add(bf);
      // Central Web
      const web = new THREE.Mesh(new THREE.BoxGeometry(len, 1.9, 0.14), mat);
      g.add(web);

      // Stiffener ribs along web
      const stiffMat = new THREE.MeshStandardMaterial({ color: 0x4f5b66, metalness: 0.9, roughness: 0.3 });
      for (let sx = -1.2; sx <= 1.2; sx += 1.2) {
        const stiff = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.84, 0.5), stiffMat);
        stiff.position.set(sx, 0, 0.3);
        g.add(stiff);
        const stiffBack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.84, 0.5), stiffMat);
        stiffBack.position.set(sx, 0, -0.3);
        g.add(stiffBack);
      }

      return g;
    }
  },
  {
    id: 'tata-tiscon',
    name: 'Tata Tiscon 550D Super Ductile Rebar',
    category: 'Primary Structural Steel',
    brand: 'TATA TISCON / IRAIVAN PARTNER',
    image: 'assets/materials/tata_tiscon.jpg',
    imageCaption: 'Tata Tiscon 550D Super Ductile Rebar — Authentic Chevron Rib Mill Certified Stock',
    tagline: 'GreenPro Certified Primary Billet Super-Ductile Rebar',
    standards: 'IS 1786:2008 & GreenPro Certified',
    desc: 'Engineered with primary virgin iron ore through Blast Furnace - Basic Oxygen Furnace route with online Tempcore water quenching. Features high energy absorption capacity for critical earthquake zones.',
    pricing: {
      today: 66450,
      yesterday: 65900,
      unit: 'MT (Metric Ton)',
      high24h: 66700,
      low24h: 65800,
      history: [64900, 65200, 65800, 65500, 65900, 66450],
      tax: '18% GST Extra'
    },
    specs: {
      'Grade Standard': 'Fe 550D Super Ductile',
      '0.2% Proof Stress': '580 N/mm²',
      'Tensile Strength': '650 N/mm²',
      'Elongation at Fracture': '17.5%',
      'Seismic Toughness': 'High Cyclic Reversal Fatigue Life',
      'Mill Verification': 'Embossed TATA TISCON 550D SD every meter'
    },
    build: (options) => {
      const g = new THREE.Group();
      const isWire = options.renderMode === 'wireframe';
      const isXray = options.renderMode === 'xray';

      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x515d68,
        metalness: isXray ? 0.2 : 0.9,
        roughness: isXray ? 0.9 : 0.3,
        wireframe: isWire,
        transparent: isXray,
        opacity: isXray ? 0.4 : 1.0
      });

      for (let i = 0; i < 4; i++) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.8, 18), steelMat);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, (i % 2) * 0.4 - 0.2, (Math.floor(i / 2) - 0.5) * 0.5);
        g.add(bar);

        // Chevron V-ribs
        for (let k = -12; k <= 12; k++) {
          const rib = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.025, 6, 14), steelMat);
          rib.rotation.y = Math.PI / 2;
          rib.position.set(k * 0.14, bar.position.y, bar.position.z);
          g.add(rib);
        }
      }

      return g;
    }
  },
  {
    id: 'dalmia-cement',
    name: 'Dalmia DSP Cement (OPC 53 Grade)',
    category: 'Structural Cement',
    brand: 'DALMIA BHARAT / IRAIVAN STEELS',
    image: 'assets/materials/dalmia_cement.jpg',
    imageCaption: 'Dalmia DSP Cement (OPC 53 Grade) — High-Early-Strength 50kg BOPP Moisture-Proof Bag',
    tagline: 'High-Early-Strength OPC 53 in Moisture-Proof BOPP Bag',
    standards: 'IS 12269:2015 Compliant · ISO 9001',
    desc: 'Specially engineered particle size distribution delivering 58.5 MPa 28-day compressive strength and micro-fine pore refinement for leak-proof structural foundations and columns.',
    pricing: {
      today: 415,
      yesterday: 422,
      unit: '50 kg Bag',
      high24h: 425,
      low24h: 412,
      history: [428, 425, 422, 426, 422, 415],
      tax: '28% GST Included'
    },
    specs: {
      '28-Day Compressive Strength': '58.5 MPa (IS Standard min 53 MPa)',
      '7-Day Early Strength': '41.2 MPa',
      'Initial Setting Time': '125 minutes (min 30 min)',
      'Final Setting Time': '210 minutes (max 600 min)',
      'Soundness (Le Chatelier)': '1.2 mm (max 10 mm)',
      'Packaging': '50 kg BOPP Laminated Tamper-Proof'
    },
    build: (options) => {
      const g = new THREE.Group();
      const isWire = options.renderMode === 'wireframe';

      const sackMat = new THREE.MeshStandardMaterial({
        color: 0xdce2e6,
        roughness: 0.8,
        wireframe: isWire
      });

      const sack = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.6, 0.75), sackMat);
      g.add(sack);

      // Crimped seal seams
      const seamMat = new THREE.MeshStandardMaterial({ color: 0xbac5cc, roughness: 0.6 });
      const topSeam = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.14, 0.16), seamMat);
      topSeam.position.y = 1.34;
      g.add(topSeam);
      const botSeam = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.14, 0.16), seamMat);
      botSeam.position.y = -1.34;
      g.add(botSeam);

      // Printed Graphic Label
      const cv = document.createElement('canvas');
      cv.width = 512;
      cv.height = 720;
      const x = cv.getContext('2d');
      x.fillStyle = '#ffffff';
      x.fillRect(0, 0, 512, 720);

      x.fillStyle = '#1d4e89';
      x.fillRect(0, 80, 512, 220);

      x.fillStyle = '#f8fafc';
      x.font = '800 60px Archivo, sans-serif';
      x.fillText('Dalmia DSP', 45, 175);

      x.fillStyle = '#e2e8f0';
      x.font = '600 28px sans-serif';
      x.fillText('OPC 53 STRUCTURAL CEMENT', 45, 230);

      x.fillStyle = '#f5a623';
      x.fillRect(45, 255, 240, 30);
      x.fillStyle = '#080c10';
      x.font = '800 20px sans-serif';
      x.fillText('DISTRIBUTED BY IRAIVAN', 50, 277);

      x.fillStyle = '#14202b';
      x.font = '600 26px sans-serif';
      x.fillText('NET WEIGHT: 50 kg', 45, 360);
      x.fillText('IS 12269:2015 CERTIFIED', 45, 410);

      const labelTex = new THREE.CanvasTexture(cv);
      const labelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.88, 2.56),
        new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
      );
      labelMesh.position.z = 0.38;
      g.add(labelMesh);

      return g;
    }
  },
  {
    id: 'wirecut-bricks',
    name: 'Class-A Wire-Cut Burnt Clay Bricks',
    category: 'Masonry Units',
    brand: 'IRAIVAN CLAY WORKS',
    image: 'assets/materials/wirecut_bricks.jpg',
    imageCaption: 'Class-A Wire-Cut Burnt Clay Red Bricks — Precision Machine-Cut High-Density Masonry',
    tagline: 'High-Density Machine Wire-Cut Bricks with Razor-Sharp Arrises',
    standards: 'IS 1077 & IS 3495 Class 10.5+',
    desc: 'Manufactured from alluvial clay fired in automated Hoffman tunnel kilns at 1050°C. Delivers 12.5 N/mm² crushing strength and zero efflorescence.',
    pricing: {
      today: 9800,
      yesterday: 9650,
      unit: '1,000 Pcs',
      high24h: 9900,
      low24h: 9600,
      history: [9400, 9450, 9550, 9600, 9650, 9800],
      tax: '5% GST Included'
    },
    specs: {
      'Nominal Size': '230 × 110 × 70 mm (9" × 4.5" × 3")',
      'Compressive Strength': '12.5 N/mm² (Rating 10.5+)',
      'Water Absorption': '9.8% (IS allowable up to 15%)',
      'Efflorescence': 'Nil / Zero surface alkali',
      'Dry Density': '1,920 kg/m³'
    },
    build: (options) => {
      const g = new THREE.Group();
      const isWire = options.renderMode === 'wireframe';
      const brickMat = new THREE.MeshStandardMaterial({
        color: 0xb4472f,
        roughness: 0.85,
        wireframe: isWire
      });
      const frogMat = new THREE.MeshStandardMaterial({ color: 0x933620, roughness: 0.9 });

      const coords = [
        [0, -0.6, 0],
        [-1.15, 0, 0],
        [1.15, 0, 0],
        [-0.55, 0.6, 0],
        [0.55, 0.6, 0]
      ];

      coords.forEach(([x, y, z]) => {
        const brick = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.58, 0.95), brickMat);
        brick.position.set(x, y, z);
        g.add(brick);

        // Frog with IRAIVAN stamp
        const frog = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.45), frogMat);
        frog.position.set(x, y + 0.26, z);
        g.add(frog);
      });

      return g;
    }
  },
  {
    id: 'binding-wire',
    name: 'MS Annealed Binding Wire (18 Gauge)',
    category: 'Steel Accessories',
    brand: 'IRAIVAN WIRE PRODUCTS',
    image: 'assets/materials/binding_wire.jpg',
    imageCaption: 'MS Annealed Binding Wire (18 Gauge) — Oxide-Free Soft Annealed 25kg Tie Coils',
    tagline: 'High-Tensile Soft Annealed Wire for Rebar Tying',
    standards: 'IS 280:2006 Soft Quality',
    desc: 'Soft dead-annealed mild steel binding wire offering high flexibility without snapping during rebar tie knotting.',
    pricing: {
      today: 76.0,
      yesterday: 74.0,
      unit: 'kg',
      high24h: 77.0,
      low24h: 74.0,
      history: [72.0, 73.0, 73.5, 75.0, 74.0, 76.0],
      tax: '18% GST Extra'
    },
    specs: {
      'Wire Gauge': '18 SWG (1.20 mm diameter)',
      'Tensile Strength': '350 - 450 N/mm²',
      'Elongation (Min)': '15% on 200mm gauge length',
      'Surface Treatment': 'Oxide-Free Bright Annealed',
      'Packaging': '25 kg Coils'
    },
    build: (options) => {
      const g = new THREE.Group();
      const isWire = options.renderMode === 'wireframe';
      const wireMat = new THREE.MeshStandardMaterial({
        color: 0x2d343b,
        metalness: 0.9,
        roughness: 0.35,
        wireframe: isWire
      });

      // Torus coils simulating wire bundle
      for (let r = 0.8; r <= 1.3; r += 0.12) {
        for (let y = -0.4; y <= 0.4; y += 0.16) {
          const torus = new THREE.Mesh(new THREE.TorusGeometry(r, 0.065, 8, 24), wireMat);
          torus.position.y = y;
          torus.rotation.x = Math.PI / 2;
          g.add(torus);
        }
      }

      return g;
    }
  }
];

// --- 3D Materials Controller with Realistic Options ---
(function () {
  'use strict';

  const viewerEl = document.getElementById('viewer');
  if (!viewerEl) return;

  let scene, camera, renderer, currentObject;
  let rx = 0.25, ry = 0.6;
  let isDragging = false;
  let lastX = 0, lastY = 0;
  let isVisible = true;
  let activeIndex = 0;

  // 3D Rendering Options State
  const renderOptions = {
    renderMode: 'realistic', // 'realistic', 'wireframe', 'xray'
    lightingMode: 'studio', // 'studio', 'sunset', 'daylight'
    autoRotate: true,
    rotSpeed: 0.004
  };

  let dirLight, ambientLight, rimLight;

  function initViewer() {
    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(40, viewerEl.clientWidth / viewerEl.clientHeight, 0.1, 50);
    camera.position.set(0, 1.3, 5.8);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xfff8ed, 1.2);
    dirLight.position.set(6, 8, 6);
    scene.add(dirLight);

    rimLight = new THREE.DirectionalLight(0x00d2ff, 0.7);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      viewerEl.innerHTML = '<div style="padding:2rem;text-align:center">WebGL is required to render 3D materials.</div>';
      return;
    }

    renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    viewerEl.appendChild(renderer.domElement);

    setupPointerEvents();
    setup3DOptionsToolbar();
    setupDisplayModeSwitcher();
    renderTabs();
    selectMaterial(0);

    window.addEventListener('resize', onResize);
    new IntersectionObserver(entries => {
      isVisible = entries[0].isIntersecting;
    }).observe(viewerEl);

    requestAnimationFrame(renderLoop);
  }

  function setup3DOptionsToolbar() {
    const btnPbr = document.getElementById('btnOptPbr');
    const btnWire = document.getElementById('btnOptWire');
    const btnXray = document.getElementById('btnOptXray');
    const btnLight = document.getElementById('btnOptLight');
    const btnOrbit = document.getElementById('btnOptOrbit');

    if (btnPbr) {
      btnPbr.onclick = () => {
        renderOptions.renderMode = 'realistic';
        updateModeButtons('pbr');
        rebuildActiveMaterial();
      };
    }

    if (btnWire) {
      btnWire.onclick = () => {
        renderOptions.renderMode = 'wireframe';
        updateModeButtons('wire');
        rebuildActiveMaterial();
      };
    }

    if (btnXray) {
      btnXray.onclick = () => {
        renderOptions.renderMode = 'xray';
        updateModeButtons('xray');
        rebuildActiveMaterial();
      };
    }

    if (btnLight) {
      btnLight.onclick = () => {
        if (renderOptions.lightingMode === 'studio') {
          renderOptions.lightingMode = 'sunset';
          dirLight.color.setHex(0xf5a623);
          dirLight.intensity = 1.4;
          rimLight.color.setHex(0xff5252);
          btnLight.textContent = 'Lighting: Golden Sunset 🌅';
        } else if (renderOptions.lightingMode === 'sunset') {
          renderOptions.lightingMode = 'daylight';
          dirLight.color.setHex(0xffffff);
          dirLight.intensity = 1.5;
          rimLight.color.setHex(0xddebf7);
          btnLight.textContent = 'Lighting: High Noon ☀️';
        } else {
          renderOptions.lightingMode = 'studio';
          dirLight.color.setHex(0xfff8ed);
          dirLight.intensity = 1.2;
          rimLight.color.setHex(0x00d2ff);
          btnLight.textContent = 'Lighting: Studio Cyan 💡';
        }
      };
    }

    if (btnOrbit) {
      btnOrbit.onclick = () => {
        renderOptions.autoRotate = !renderOptions.autoRotate;
        btnOrbit.setAttribute('aria-pressed', renderOptions.autoRotate ? 'true' : 'false');
        btnOrbit.textContent = renderOptions.autoRotate ? 'Auto-Orbit: ON' : 'Auto-Orbit: OFF';
      };
    }
  }

  let currentDisplayMode = 'real';

  function setupDisplayModeSwitcher() {
    const btnReal = document.getElementById('btnModeReal');
    const btn3D = document.getElementById('btnMode3D');
    const btnSplit = document.getElementById('btnModeSplit');
    const wrapper = document.getElementById('viewerWrapper');
    const realBox = document.getElementById('realLiveContainer');
    const viewer = document.getElementById('viewer');
    const hintLeft = document.getElementById('hintLeft');
    const hintRight = document.getElementById('hintRight');

    function applyMode(mode) {
      currentDisplayMode = mode;
      [btnReal, btn3D, btnSplit].forEach(b => b?.classList.remove('active'));

      if (mode === 'real') {
        btnReal?.classList.add('active');
        wrapper?.classList.remove('split-mode');
        realBox?.classList.remove('hidden');
        if (viewer) viewer.style.display = 'none';
        if (hintLeft) hintLeft.textContent = '📷 Real Live High-Definition Stock Yard Photograph';
        if (hintRight) hintRight.textContent = '⚡ Authentic Physical Sample · Devakottai Yard';
      } else if (mode === '3d') {
        btn3D?.classList.add('active');
        wrapper?.classList.remove('split-mode');
        realBox?.classList.add('hidden');
        if (viewer) {
          viewer.style.display = 'block';
          onResize();
        }
        if (hintLeft) hintLeft.textContent = '⟲ Drag to orbit 360° · Scroll to inspect ribs & flanges';
        if (hintRight) hintRight.textContent = '⚡ Physically Based Metallic Shaders';
      } else if (mode === 'split') {
        btnSplit?.classList.add('active');
        wrapper?.classList.add('split-mode');
        realBox?.classList.remove('hidden');
        if (viewer) {
          viewer.style.display = 'block';
          onResize();
        }
        if (hintLeft) hintLeft.textContent = '📷 Real Live Sample (Left) + 🧊 3D CAD Orbit (Right)';
        if (hintRight) hintRight.textContent = '⚡ Real vs 3D Engineering Inspection';
      }
    }

    if (btnReal) btnReal.onclick = () => applyMode('real');
    if (btn3D) btn3D.onclick = () => applyMode('3d');
    if (btnSplit) btnSplit.onclick = () => applyMode('split');

    applyMode('real');
  }

  function updateModeButtons(active) {
    ['btnOptPbr', 'btnOptWire', 'btnOptXray'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.setAttribute('aria-pressed', 'false');
    });
    if (active === 'pbr') document.getElementById('btnOptPbr')?.setAttribute('aria-pressed', 'true');
    if (active === 'wire') document.getElementById('btnOptWire')?.setAttribute('aria-pressed', 'true');
    if (active === 'xray') document.getElementById('btnOptXray')?.setAttribute('aria-pressed', 'true');
  }

  function rebuildActiveMaterial() {
    selectMaterial(activeIndex);
  }

  function onResize() {
    if (!renderer || !camera || !viewerEl) return;
    camera.aspect = viewerEl.clientWidth / viewerEl.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
  }

  function setupPointerEvents() {
    viewerEl.onpointerdown = (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      viewerEl.setPointerCapture(e.pointerId);
      viewerEl.style.cursor = 'grabbing';
    };

    viewerEl.onpointerup = () => {
      isDragging = false;
      viewerEl.style.cursor = 'grab';
    };

    viewerEl.onpointermove = (e) => {
      if (!isDragging) return;
      ry += (e.clientX - lastX) * 0.01;
      rx = clamp(rx + (e.clientY - lastY) * 0.01, -1.2, 1.2);
      lastX = e.clientX;
      lastY = e.clientY;
    };
  }

  function renderTabs() {
    const tabsContainer = document.getElementById('tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = MATERIALS_CATALOG.map((m, idx) => `
      <button data-idx="${idx}" aria-pressed="${idx === 0 ? 'true' : 'false'}">${m.name.split(' (')[0]}</button>
    `).join('');

    tabsContainer.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        selectMaterial(parseInt(btn.dataset.idx, 10));
      };
    });
  }

  function renderMiniSparkline(history, isUp) {
    if (!history || history.length < 2) return '';
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = (max - min) || 1;
    const w = 240, h = 38;

    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * w;
      const y = h - ((val - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const strokeColor = isUp ? '#00e676' : '#ff5252';
    const fillColor = isUp ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 82, 82, 0.15)';

    return `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:38px">
        <polygon points="0,${h} ${points} ${w},${h}" fill="${fillColor}" />
        <polyline points="${points}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" />
      </svg>
    `;
  }

  function selectMaterial(idx) {
    activeIndex = idx;
    const item = MATERIALS_CATALOG[idx];
    if (!item) return;

    if (currentObject) scene.remove(currentObject);
    currentObject = item.build(renderOptions);
    scene.add(currentObject);

    // Update Text Fields
    if (document.getElementById('mName')) document.getElementById('mName').textContent = item.name;
    if (document.getElementById('mBrand')) document.getElementById('mBrand').textContent = item.brand;
    if (document.getElementById('mTagline')) document.getElementById('mTagline').textContent = item.tagline;
    if (document.getElementById('mDesc')) document.getElementById('mDesc').textContent = item.desc;
    if (document.getElementById('mStandards')) document.getElementById('mStandards').textContent = item.standards;

    // Update Centered Real Live Image & Caption
    const realImg = document.getElementById('realLiveImg');
    const realCaption = document.getElementById('realLiveCaption');
    if (realImg && item.image) {
      realImg.src = item.image;
      realImg.alt = item.name + ' - Real Live Stock Sample';
    }
    if (realCaption && item.imageCaption) {
      realCaption.textContent = item.imageCaption;
    }

    // Price Gold-Style Analysis Card
    const p = item.pricing;
    const diff = +(p.today - p.yesterday).toFixed(2);
    const pct = +((diff / p.yesterday) * 100).toFixed(2);
    const isUp = diff > 0;
    const badgeSign = isUp ? '▲ +' : (diff === 0 ? '▬ ' : '▼ ');
    const badgeCls = isUp ? 'up' : (diff === 0 ? 'flat' : 'down');

    const priceBox = document.getElementById('mPriceBox');
    if (priceBox) {
      priceBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:0.75rem;font-weight:700;color:var(--mut);letter-spacing:0.06em">SPOT COMMODITY BENCHMARK</div>
            <div class="spec-price-val">₹${p.today.toLocaleString('en-IN')} <span style="font-size:0.9rem;font-weight:400;color:var(--mut)">/ ${p.unit}</span></div>
          </div>
          <div class="price-change-badge ${badgeCls}">${badgeSign}₹${Math.abs(diff)} (${pct}%)</div>
        </div>

        <div class="price-compare-row" style="margin:0.6rem 0">
          <span class="compare-label">Yesterday Close:</span>
          <span class="compare-val">₹${p.yesterday.toLocaleString('en-IN')}</span>
          <span class="compare-label">24h High:</span>
          <span class="compare-val">₹${p.high24h.toLocaleString('en-IN')}</span>
        </div>

        <div style="margin-top:0.4rem">
          <div style="font-size:0.75rem;color:var(--mut);margin-bottom:0.2rem">7-DAY HISTORICAL TREND:</div>
          ${renderMiniSparkline(p.history, isUp)}
        </div>
      `;
    }

    const specDl = document.getElementById('mSpec');
    if (specDl) {
      specDl.innerHTML = Object.entries(item.specs).map(([k, v]) => `
        <dt>${k}</dt>
        <dd>${v}</dd>
      `).join('');
    }

    // Update active tab button
    const tabs = document.querySelectorAll('#tabs button');
    tabs.forEach((b, j) => b.setAttribute('aria-pressed', j === idx ? 'true' : 'false'));

    // Update direct quote button payload
    const quoteBtn = document.getElementById('btnQuoteSpec');
    if (quoteBtn) {
      quoteBtn.onclick = () => {
        const note = `IRAIVAN STEELS QUOTE REQUEST:\nProduct: ${item.name}\nBrand: ${item.brand}\nLive Spot Rate: ₹${p.today.toLocaleString('en-IN')} / ${p.unit}\nYesterday Benchmark: ₹${p.yesterday.toLocaleString('en-IN')}\n\nPlease dispatch proforma invoice and confirm dispatch timeline.`;
        sessionStorage.setItem('quote', note);
        window.location.href = 'contact.html';
      };
    }
  }

  function renderLoop() {
    requestAnimationFrame(renderLoop);
    if (!isVisible || !currentObject) return;

    if (!isDragging && renderOptions.autoRotate) {
      ry += renderOptions.rotSpeed;
    }

    currentObject.rotation.set(rx, ry, 0);
    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initViewer);
  } else {
    initViewer();
  }

})();
