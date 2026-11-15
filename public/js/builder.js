/* ==========================================================================
   BuildCore 3D House Building Simulator (Three.js Engine)
   High-end real-time construction simulator, procedural layout generator,
   interior staging and brand standard material estimation.
   ========================================================================== */

(function () {
  'use strict';

  // --- Configuration State ---
  const state = {
    step: 1, // 1: Plan, 2: Build, 3: Furnish, 4: Estimate
    floors: 1,
    rooms: {
      hall: 1,
      dining: 1,
      kitchen: 1,
      bedroom: 2,
      bathroom: 2,
      pooja: 1
    },
    roof: 'tile', // 'tile' (pitched) or 'flat' (terrace)
    wallColor: '#f4eedb', // default Warm Ivory
    floorType: 'vitrified', // 'vitrified', 'marble', 'wood', 'granite'
    currentStage: 0,
    maxStage: 8,
    autoPlaying: false,
    autoTimer: null,
    buildSpeed: 1, // 1x, 2x, 5x, 999 (instant)
    removeRoof: false,
    selectedRoomId: null,
    furniturePlaced: {}, // roomId -> Set of itemIds
    planData: null,
    wallsData: null,
    bricksData: []
  };

  const WALL_COLORS = [
    { name: 'Warm Ivory', hex: '#f4eedb', num: 0xf4eedb },
    { name: 'Crisp White', hex: '#ffffff', num: 0xffffff },
    { name: 'Modern Slate', hex: '#cfd8dc', num: 0xcfd8dc },
    { name: 'Terracotta Hue', hex: '#d97d64', num: 0xd97d64 },
    { name: 'Architectural Taupe', hex: '#c5b8a5', num: 0xc5b8a5 }
  ];

  const FLOOR_TYPES = [
    { id: 'vitrified', name: 'Kajaria Vitrified Tiles', color: 0xe8e4db },
    { id: 'marble', name: 'Italian Carrara Marble', color: 0xf5f5f5 },
    { id: 'wood', name: 'Hardwood Parquet', color: 0x9b6b43 },
    { id: 'granite', name: 'Polished Black Granite', color: 0x222629 }
  ];

  const STAGES = [
    { id: 0, title: '1. Site Excavation & Column Footings', desc: 'Precision trenches and RCC footing pads' },
    { id: 1, title: '2. Plinth Beam & Foundation Slab', desc: 'Damp-proof monolithic concrete base' },
    { id: 2, title: '3. RCC Columns & Frame Grid', desc: 'High-grade reinforced structural pillars' },
    { id: 3, title: '4. Brick-by-Brick Wall Masonry', desc: 'First-class burnt red clay bricks with mortar joints' },
    { id: 4, title: '5. Door & Window Frames', desc: 'Teakwood frames and high-performance glazing' },
    { id: 5, title: '6. Internal Partitions & Lintel Beams', desc: 'Room partitions and structural spans' },
    { id: 6, title: '7. Floor & Roof Structure', desc: 'Terrace slab or pitched terracotta roof trusses' },
    { id: 7, title: '8. Cement Plastering (Rough Cast)', desc: 'Waterproof interior and exterior plastering' },
    { id: 8, title: '9. Premium Painting & Architectural Finishes', desc: 'Weatherproof emulsion & polished floors' }
  ];

  // --- Three.js Environment ---
  let scene, camera, renderer;
  let stageEl = $('#stage');
  let houseGroup, terrainGroup, constructionGroup, furnitureGroup, roofGroup;
  let roomFloorMeshes = [];
  let raycaster, mouse;
  let isPointerDown = false;
  let pointerStart = { x: 0, y: 0 };
  let camTheta = 0.85, camPhi = 0.58, camRadius = 26;
  let targetLook = new THREE.Vector3(0, 2.5, 0);
  let isTopDown = false;

  // --- Initialize 3D Engine ---
  function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdfe6ea);
    scene.fog = new THREE.FogExp2(0xdfe6ea, 0.012);

    const aspect = stageEl.clientWidth / stageEl.clientHeight;
    camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    updateCamera();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(stageEl.clientWidth, stageEl.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    stageEl.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xeef3f7, 0x8d9ca5, 0.45);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbf2, 1.05);
    sunLight.position.set(30, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    const d = 25;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Groups
    terrainGroup = new THREE.Group();
    houseGroup = new THREE.Group();
    constructionGroup = new THREE.Group();
    furnitureGroup = new THREE.Group();
    roofGroup = new THREE.Group();

    houseGroup.add(constructionGroup);
    houseGroup.add(furnitureGroup);
    houseGroup.add(roofGroup);

    scene.add(terrainGroup);
    scene.add(houseGroup);

    buildTerrain();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    setupInteraction();
    setupToolbar();

    window.addEventListener('resize', onResize);
    requestAnimationFrame(renderLoop);
  }

  function buildTerrain() {
    terrainGroup.clear();

    // Base ground plane
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xd3dcde });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    terrainGroup.add(ground);

    // Paved plot boundary
    const plotGeo = new THREE.BoxGeometry(32, 0.08, 26);
    const plotMat = new THREE.MeshLambertMaterial({ color: 0xc7d1d6 });
    const plot = new THREE.Mesh(plotGeo, plotMat);
    plot.position.y = 0.04;
    plot.receiveShadow = true;
    terrainGroup.add(plot);

    // Architectural grid helper
    const grid = new THREE.GridHelper(30, 30, 0x1d4e89, 0xb8c5cc);
    grid.position.y = 0.09;
    grid.material.opacity = 0.28;
    grid.material.transparent = true;
    terrainGroup.add(grid);
  }

  function updateCamera() {
    if (isTopDown) {
      camera.position.set(targetLook.x, targetLook.y + camRadius * 1.05, targetLook.z + 0.001);
      camera.lookAt(targetLook);
    } else {
      const x = targetLook.x + camRadius * Math.sin(camPhi) * Math.sin(camTheta);
      const y = targetLook.y + camRadius * Math.cos(camPhi);
      const z = targetLook.z + camRadius * Math.sin(camPhi) * Math.cos(camTheta);
      camera.position.set(x, y, z);
      camera.lookAt(targetLook);
    }
  }

  function onResize() {
    if (!renderer || !camera || !stageEl) return;
    camera.aspect = stageEl.clientWidth / stageEl.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(stageEl.clientWidth, stageEl.clientHeight);
  }

  function setupInteraction() {
    let hasMoved = false;

    stageEl.addEventListener('pointerdown', (e) => {
      isPointerDown = true;
      hasMoved = false;
      pointerStart.x = e.clientX;
      pointerStart.y = e.clientY;
      stageEl.style.cursor = 'grabbing';
      stageEl.setPointerCapture(e.pointerId);
    });

    stageEl.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      const dx = e.clientX - pointerStart.x;
      const dy = e.clientY - pointerStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

      if (e.buttons === 2 || e.shiftKey) {
        // Pan
        const panSpeed = 0.035 * (camRadius / 25);
        const forward = new THREE.Vector3().subVectors(targetLook, camera.position).normalize();
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        targetLook.addScaledVector(right, -dx * panSpeed);
        targetLook.y += dy * panSpeed;
      } else {
        // Rotate
        if (isTopDown) isTopDown = false;
        camTheta -= dx * 0.008;
        camPhi = clamp(camPhi - dy * 0.008, 0.08, Math.PI / 2 - 0.02);
      }

      pointerStart.x = e.clientX;
      pointerStart.y = e.clientY;
      updateCamera();
    });

    stageEl.addEventListener('pointerup', (e) => {
      isPointerDown = false;
      stageEl.style.cursor = 'grab';

      // Click detection for room selection in Step 3
      if (!hasMoved && state.step === 3) {
        const rect = stageEl.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(roomFloorMeshes);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          if (hit.userData && hit.userData.roomId) {
            selectRoom(hit.userData.roomId);
          }
        }
      }
    });

    stageEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      camRadius = clamp(camRadius + e.deltaY * 0.02, 7, 50);
      updateCamera();
    }, { passive: false });

    stageEl.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function setupToolbar() {
    const tools = $('#tools');
    tools.innerHTML = `
      <button id="btnIso" title="Perspective Isometric View">Isometric 3D</button>
      <button id="btnTop" title="Top-down Floor Plan View">Top View</button>
      <button id="btnFront" title="Front Elevation View">Front View</button>
      <button id="btnRoof" title="Toggle Roof Visibility" aria-pressed="${state.removeRoof ? 'true' : 'false'}">
        ${state.removeRoof ? 'Show Roof' : 'Remove Roof'}
      </button>
      <button id="btnReset" title="Reset View Angle">Reset View</button>
    `;

    $('#btnIso').onclick = () => {
      isTopDown = false;
      camTheta = 0.85;
      camPhi = 0.65;
      camRadius = 26;
      updateCamera();
    };

    $('#btnTop').onclick = () => {
      isTopDown = true;
      state.removeRoof = true;
      roofGroup.visible = false;
      updateRoofButton();
      updateCamera();
    };

    $('#btnFront').onclick = () => {
      isTopDown = false;
      camTheta = 0;
      camPhi = 1.45;
      camRadius = 24;
      updateCamera();
    };

    $('#btnRoof').onclick = () => {
      state.removeRoof = !state.removeRoof;
      roofGroup.visible = !state.removeRoof;
      updateRoofButton();
    };

    $('#btnReset').onclick = () => {
      isTopDown = false;
      targetLook.set(0, 2.5, 0);
      camTheta = 0.85;
      camPhi = 0.58;
      camRadius = 26;
      updateCamera();
    };
  }

  function updateRoofButton() {
    const b = $('#btnRoof');
    if (!b) return;
    b.setAttribute('aria-pressed', state.removeRoof ? 'true' : 'false');
    b.textContent = state.removeRoof ? 'Show Roof' : 'Remove Roof';
  }

  function renderLoop() {
    requestAnimationFrame(renderLoop);
    renderer.render(scene, camera);
  }

  // --- Procedural Generation Logic ---
  function generatePlan() {
    state.planData = Layout.plan({
      floors: state.floors,
      rooms: state.rooms,
      roof: state.roof
    });
    state.wallsData = Layout.walls(state.planData);
    state.bricksData = Layout.bricks(state.wallsData);

    // Initialize furniture map for all generated rooms
    state.furniturePlaced = {};
    state.planData.floors.forEach(floor => {
      floor.forEach(room => {
        if (room.t !== 'stair') {
          state.furniturePlaced[room.id] = new Set();
        }
      });
    });

    render2DPlan();
    rebuild3DModel();
    updateStageUI();
  }

  // --- 2D Blueprint SVG Renderer ---
  function render2DPlan() {
    const p = $('#plan2d');
    if (!p || !state.planData) return;

    const pl = state.planData;
    const W = pl.W, D = pl.D;
    const scale = 24;
    const pad = 25;
    const svgW = W * scale + pad * 2;
    const svgH = D * scale + pad * 2;

    let svg = `<svg viewBox="0 0 ${svgW} ${svgH}" style="background:#0e1b29;border-radius:6px;border:1px solid #23374d;">
      <defs>
        <pattern id="gridPattern" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#16293d" stroke-width="0.6"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#gridPattern)"/>
      <g transform="translate(${pad}, ${pad})">`;

    // Outer boundary
    svg += `<rect x="0" y="0" width="${W * scale}" height="${D * scale}" fill="none" stroke="#486581" stroke-width="2.5"/>`;

    // Draw rooms
    pl.floors[0].forEach(r => {
      const rx = (r.x0 + W / 2) * scale;
      const ry = (r.z0 + D / 2) * scale;
      const rw = (r.x1 - r.x0) * scale;
      const rh = (r.z1 - r.z0) * scale;
      const isSel = r.id === state.selectedRoomId;

      svg += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${isSel ? 'rgba(29, 78, 137, 0.45)' : 'rgba(25, 42, 60, 0.65)'}" stroke="#627d98" stroke-width="1.2"/>`;
      svg += `<text x="${rx + rw / 2}" y="${ry + rh / 2 - 4}" fill="#ffffff" font-family="'IBM Plex Sans', sans-serif" font-size="9" font-weight="600" text-anchor="middle">${r.label}</text>`;
      svg += `<text x="${rx + rw / 2}" y="${ry + rh / 2 + 8}" fill="#9fb3c8" font-family="'IBM Plex Sans', sans-serif" font-size="7.5" text-anchor="middle">${(r.x1 - r.x0).toFixed(1)}m × ${(r.z1 - r.z0).toFixed(1)}m</text>`;
    });

    if (pl.F === 2) {
      svg += `<text x="${W * scale / 2}" y="${D * scale + 15}" fill="#627d98" font-size="8.5" text-anchor="middle">Ground Floor Shown (Double Floor Active)</text>`;
    }

    svg += `</g></svg>`;
    p.innerHTML = svg;
  }

  // --- 3D Model Building Stages ---
  function rebuild3DModel() {
    constructionGroup.clear();
    furnitureGroup.clear();
    roofGroup.clear();
    roomFloorMeshes = [];

    if (!state.planData) return;

    const stage = state.currentStage;

    // Stage 0: Excavation & Footings
    if (stage >= 0) {
      buildFootingsAndExcavation();
    }

    // Stage 1: Plinth Beam & Foundation Slab
    if (stage >= 1) {
      buildFoundationAndPlinth();
    }

    // Stage 2: Columns & Framing
    if (stage >= 2) {
      buildColumns();
    }

    // Stage 3: Brick Masonry Walls
    if (stage >= 3) {
      buildBrickWalls();
    }

    // Stage 4: Door & Window Frames
    if (stage >= 4) {
      buildFramesAndDoors();
    }

    // Stage 5: Inner Partitions & Lintels
    if (stage >= 5) {
      buildPartitions();
    }

    // Stage 6: Roof Slab or Pitched Roof Tiles
    if (stage >= 6) {
      buildRoofStructure();
    }

    // Stage 7: Cement Plastering
    if (stage >= 7) {
      applyPlastering();
    }

    // Stage 8: Painting & Finishes
    if (stage >= 8) {
      applyPaintAndFinishes();
    }

    // Rebuild furniture
    buildPlacedFurniture();

    roofGroup.visible = !state.removeRoof;
  }

  function buildFootingsAndExcavation() {
    const pl = state.planData;
    const pts = Layout.columnPts(pl);
    const footingMat = new THREE.MeshLambertMaterial({ color: 0x7c8a94 });
    const trenchMat = new THREE.MeshLambertMaterial({ color: 0x8a705b });

    // Excavation trenches under perimeter
    const W = pl.W, D = pl.D;
    const trench = new THREE.Mesh(new THREE.BoxGeometry(W + 0.8, 0.25, D + 0.8), trenchMat);
    trench.position.set(0, 0.125, 0);
    trench.receiveShadow = true;
    constructionGroup.add(trench);

    // Footing pads
    pts.forEach(pt => {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), footingMat);
      pad.position.set(pt[0], 0.2, pt[1]);
      pad.castShadow = true;
      pad.receiveShadow = true;
      constructionGroup.add(pad);
    });
  }

  function buildFoundationAndPlinth() {
    const pl = state.planData;
    const W = pl.W, D = pl.D, P = Layout.P;
    const plinthMat = new THREE.MeshLambertMaterial({ color: 0x9eacb5 });

    // Solid concrete plinth base
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(W + 0.35, P, D + 0.35), plinthMat);
    plinth.position.set(0, P / 2, 0);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    constructionGroup.add(plinth);

    // Front porch entrance step
    const stepMat = new THREE.MeshLambertMaterial({ color: 0x6e7d87 });
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, P / 2, 0.8), stepMat);
    step.position.set(0, P / 4, D / 2 + 0.5);
    step.receiveShadow = true;
    constructionGroup.add(step);
  }

  function buildColumns() {
    const pl = state.planData;
    const pts = Layout.columnPts(pl);
    const F = pl.F, FH = Layout.FH, P = Layout.P;
    const colMat = new THREE.MeshLambertMaterial({ color: 0xa8b4bd });
    const rebarMat = new THREE.MeshLambertMaterial({ color: 0x4a5560 });

    const totalH = F * FH;

    pts.forEach(pt => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.3, totalH, 0.3), colMat);
      col.position.set(pt[0], P + totalH / 2, pt[1]);
      col.castShadow = true;
      col.receiveShadow = true;
      constructionGroup.add(col);

      // Rebar starter ties projecting from tops if stage == 2
      if (state.currentStage === 2) {
        for (let i = -1; i <= 1; i += 2) {
          for (let j = -1; j <= 1; j += 2) {
            const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8), rebarMat);
            rebar.position.set(pt[0] + i * 0.09, P + totalH + 0.3, pt[1] + j * 0.09);
            constructionGroup.add(rebar);
          }
        }
      }
    });

    // Beam network connecting columns at ceiling heights
    for (let f = 0; f < F; f++) {
      const beamY = P + (f + 1) * FH - 0.15;
      const beamMat = new THREE.MeshLambertMaterial({ color: 0x93a0a8 });
      // Longitudinal beams
      [-pl.D / 2, pl.D / 2, 0].forEach(z => {
        const bm = new THREE.Mesh(new THREE.BoxGeometry(pl.W + 0.3, 0.3, 0.28), beamMat);
        bm.position.set(0, beamY, z);
        bm.castShadow = true;
        constructionGroup.add(bm);
      });
      // Transverse beams
      [-pl.W / 2, pl.W / 2].forEach(x => {
        const bm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, pl.D + 0.3), beamMat);
        bm.position.set(x, beamY, 0);
        bm.castShadow = true;
        constructionGroup.add(bm);
      });
    }
  }

  function buildBrickWalls() {
    // If plastering is active (stage >= 7), we don't need heavy individual bricks
    if (state.currentStage >= 7) return;

    const bricks = state.bricksData;
    const brickMat = new THREE.MeshLambertMaterial({ color: 0xb4472f }); // First-class clay brick
    const mortarMat = new THREE.MeshLambertMaterial({ color: 0x828b91 });

    const brickGeo = new THREE.BoxGeometry(1, 1, 1);
    const instMesh = new THREE.InstancedMesh(brickGeo, brickMat, bricks.length);
    instMesh.castShadow = true;
    instMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const BH = Layout.BH;

    bricks.forEach((b, i) => {
      dummy.position.set(b[0], b[1], b[2]);
      dummy.rotation.set(0, b[3], 0);
      dummy.scale.set(b[4], BH - 0.005, b[5] || Layout.EXT);
      dummy.updateMatrix();
      instMesh.setMatrixAt(i, dummy.matrix);
    });

    instMesh.instanceMatrix.needsUpdate = true;
    constructionGroup.add(instMesh);
  }

  function buildFramesAndDoors() {
    const pl = state.planData;
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x5a3d28 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x8bb4cf,
      transparent: true,
      opacity: 0.38,
      roughness: 0.1,
      metalness: 0.1
    });

    state.wallsData.forEach(floorWalls => {
      floorWalls.forEach(seg => {
        const dx = (seg.x1 - seg.x0) / seg.L;
        const dz = (seg.z1 - seg.z0) / seg.L;
        const angle = Math.atan2(dz, dx);
        const yBase = Layout.P + seg.f * Layout.FH;

        seg.open.forEach(op => {
          const cx = seg.x0 + dx * op.c;
          const cz = seg.z0 + dz * op.c;
          const h = op.y1 - op.y0;
          const cy = yBase + op.y0 + h / 2;

          const frameGroup = new THREE.Group();
          frameGroup.position.set(cx, cy, cz);
          frameGroup.rotation.y = -angle;

          if (op.kind === 'main') {
            // Main Door frame + paneled wooden door leaf
            const frame = new THREE.Mesh(new THREE.BoxGeometry(op.w, h, seg.t + 0.04), woodMat);
            frameGroup.add(frame);
            // Inset panel
            const panel = new THREE.Mesh(new THREE.BoxGeometry(op.w - 0.12, h - 0.1, seg.t - 0.02), new THREE.MeshLambertMaterial({ color: 0x6e4a32 }));
            frameGroup.add(panel);
            // Brass handle
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 12), new THREE.MeshLambertMaterial({ color: 0xd4af37 }));
            handle.position.set(op.w / 2 - 0.18, 0, seg.t / 2 + 0.03);
            frameGroup.add(handle);
          } else if (op.kind === 'window') {
            // Window frame + glass pane + mullions
            const frame = new THREE.Mesh(new THREE.BoxGeometry(op.w, h, seg.t + 0.02), woodMat);
            frameGroup.add(frame);
            const glass = new THREE.Mesh(new THREE.BoxGeometry(op.w - 0.1, h - 0.1, 0.015), glassMat);
            frameGroup.add(glass);
            // Window sill
            const sill = new THREE.Mesh(new THREE.BoxGeometry(op.w + 0.12, 0.05, seg.t + 0.1), woodMat);
            sill.position.y = -h / 2;
            frameGroup.add(sill);
          } else if (op.kind === 'door') {
            // Internal door frame
            const frame = new THREE.Mesh(new THREE.BoxGeometry(op.w, h, seg.t + 0.02), woodMat);
            frameGroup.add(frame);
          }

          constructionGroup.add(frameGroup);
        });
      });
    });
  }

  function buildPartitions() {
    // Internal walls and lintels above doors
    if (state.currentStage >= 7) return; // Plastering covers it
    const pl = state.planData;
    const lintelMat = new THREE.MeshLambertMaterial({ color: 0x8e9aa1 });

    state.wallsData.forEach(floorWalls => {
      floorWalls.filter(s => !s.ext).forEach(seg => {
        const dx = (seg.x1 - seg.x0) / seg.L;
        const dz = (seg.z1 - seg.z0) / seg.L;
        const angle = Math.atan2(dz, dx);
        const yBase = Layout.P + seg.f * Layout.FH;

        seg.open.forEach(op => {
          // Lintel beam spanning the door opening
          const cx = seg.x0 + dx * op.c;
          const cz = seg.z0 + dz * op.c;
          const lintel = new THREE.Mesh(new THREE.BoxGeometry(op.w + 0.3, 0.15, seg.t + 0.02), lintelMat);
          lintel.position.set(cx, yBase + op.y1 + 0.075, cz);
          lintel.rotation.y = -angle;
          lintel.castShadow = true;
          constructionGroup.add(lintel);
        });
      });
    });
  }

  function buildRoofStructure() {
    const pl = state.planData;
    const F = pl.F, W = pl.W, D = pl.D, FH = Layout.FH, P = Layout.P;
    const topY = P + F * FH;

    // Intermediate floor slab if 2 floors
    if (F === 2) {
      const slabPieces = Layout.slabPieces(pl, 0);
      const slabMat = new THREE.MeshLambertMaterial({ color: 0x9eacb5 });
      slabPieces.forEach(sp => {
        const sw = sp[1] - sp[0];
        const sd = sp[3] - sp[2];
        const cx = (sp[0] + sp[1]) / 2;
        const cz = (sp[2] + sp[3]) / 2;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.18, sd), slabMat);
        slab.position.set(cx, P + FH, cz);
        slab.receiveShadow = true;
        constructionGroup.add(slab);
      });

      // Internal staircase
      buildStaircase();
    }

    // Top Roof
    roofGroup.clear();

    if (state.roof === 'tile') {
      // Pitched Roof with terracotta tiles
      const roofAngle = Math.PI * 26 / 180;
      const ridgeY = topY + (D / 2 + 0.6) * Math.tan(roofAngle);
      const slopeLength = (D / 2 + 0.8) / Math.cos(roofAngle);
      const roofOverhang = 0.5;
      const roofWidth = W + roofOverhang * 2;

      const tileMat = new THREE.MeshLambertMaterial({ color: 0xb5452d }); // Terracotta tile red
      const trussMat = new THREE.MeshLambertMaterial({ color: 0x4a3220 });

      // Front slope
      const frontSlope = new THREE.Mesh(new THREE.BoxGeometry(roofWidth, 0.12, slopeLength), tileMat);
      frontSlope.position.set(0, (topY + ridgeY) / 2, (D / 2 + 0.8) / 2);
      frontSlope.rotation.x = roofAngle;
      frontSlope.castShadow = true;
      frontSlope.receiveShadow = true;
      roofGroup.add(frontSlope);

      // Back slope
      const backSlope = new THREE.Mesh(new THREE.BoxGeometry(roofWidth, 0.12, slopeLength), tileMat);
      backSlope.position.set(0, (topY + ridgeY) / 2, -(D / 2 + 0.8) / 2);
      backSlope.rotation.x = -roofAngle;
      backSlope.castShadow = true;
      backSlope.receiveShadow = true;
      roofGroup.add(backSlope);

      // Ridge cap
      const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, roofWidth + 0.1, 12), tileMat);
      ridge.rotation.z = Math.PI / 2;
      ridge.position.set(0, ridgeY + 0.05, 0);
      roofGroup.add(ridge);

      // Gable end walls (triangles)
      [-roofWidth / 2 + 0.1, roofWidth / 2 - 0.1].forEach(gx => {
        const gableShape = new THREE.Shape();
        gableShape.moveTo(-D / 2, topY);
        gableShape.lineTo(0, ridgeY);
        gableShape.lineTo(D / 2, topY);
        gableShape.closePath();
        const gableGeo = new THREE.ShapeGeometry(gableShape);
        const gableMat = new THREE.MeshLambertMaterial({ color: 0xe6e1d5, side: THREE.DoubleSide });
        const gable = new THREE.Mesh(gableGeo, gableMat);
        gable.rotation.y = Math.PI / 2;
        gable.position.x = gx;
        roofGroup.add(gable);
      });
    } else {
      // Flat Terrace Slab with parapet wall
      const slabMat = new THREE.MeshLambertMaterial({ color: 0xa8b4bd });
      const parapetMat = new THREE.MeshLambertMaterial({ color: 0xd4ddd6 });

      const slab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 0.2, D + 0.6), slabMat);
      slab.position.set(0, topY, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      roofGroup.add(slab);

      // Parapet boundary walls
      const pHeight = 0.9;
      // Front & Back parapets
      [-D / 2 - 0.25, D / 2 + 0.25].forEach(pz => {
        const pw = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, pHeight, 0.18), parapetMat);
        pw.position.set(0, topY + pHeight / 2, pz);
        roofGroup.add(pw);
      });
      // Left & Right parapets
      [-W / 2 - 0.25, W / 2 + 0.25].forEach(px => {
        const pw = new THREE.Mesh(new THREE.BoxGeometry(0.18, pHeight, D + 0.6), parapetMat);
        pw.position.set(px, topY + pHeight / 2, 0);
        roofGroup.add(pw);
      });

      // Staircase headroom cabin if 2 floors
      if (F === 2) {
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 3.2), parapetMat);
        cabin.position.set(0, topY + 1.2, -D / 4);
        roofGroup.add(cabin);
      }
    }
  }

  function buildStaircase() {
    const pl = state.planData;
    const st = pl.floors[0].find(r => r.t === 'stair');
    if (!st) return;

    const stairGroup = new THREE.Group();
    const stepCount = 16;
    const stepH = Layout.FH / stepCount;
    const stepW = st.x1 - st.x0 - 0.2;
    const stepD = (st.z1 - st.z0 - 0.4) / (stepCount / 2);
    const stepMat = new THREE.MeshLambertMaterial({ color: 0x7a6350 });

    for (let i = 0; i < stepCount; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(stepW / 2, stepH, stepD), stepMat);
      const y = Layout.P + i * stepH + stepH / 2;
      let z, x;
      if (i < 8) {
        x = st.x0 + stepW / 4 + 0.1;
        z = st.z0 + 0.2 + i * stepD;
      } else {
        x = st.x1 - stepW / 4 - 0.1;
        z = st.z1 - 0.2 - (i - 8) * stepD;
      }
      step.position.set(x, y, z);
      stairGroup.add(step);
    }
    constructionGroup.add(stairGroup);
  }

  function applyPlastering() {
    const pl = state.planData;
    const plasterMat = new THREE.MeshLambertMaterial({ color: 0xd9dedc }); // Cement plaster grey

    state.wallsData.forEach(floorWalls => {
      floorWalls.forEach(seg => {
        const dx = (seg.x1 - seg.x0) / seg.L;
        const dz = (seg.z1 - seg.z0) / seg.L;
        const angle = Math.atan2(dz, dx);
        const yBase = Layout.P + seg.f * Layout.FH;

        const pieces = Layout.pieces(seg);
        pieces.forEach(p => {
          const pw = p.u1 - p.u0;
          const ph = p.y1 - p.y0;
          if (pw <= 0 || ph <= 0) return;

          const uMid = (p.u0 + p.u1) / 2;
          const px = seg.x0 + dx * uMid;
          const pz = seg.z0 + dz * uMid;
          const py = yBase + p.y0 + ph / 2;

          const wallPiece = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, seg.t), plasterMat);
          wallPiece.position.set(px, py, pz);
          wallPiece.rotation.y = -angle;
          wallPiece.castShadow = true;
          wallPiece.receiveShadow = true;
          constructionGroup.add(wallPiece);
        });
      });
    });
  }

  function applyPaintAndFinishes() {
    const pl = state.planData;
    const curWallObj = WALL_COLORS.find(c => c.hex.toLowerCase() === state.wallColor.toLowerCase()) || WALL_COLORS[0];
    const curFloorObj = FLOOR_TYPES.find(f => f.id === state.floorType) || FLOOR_TYPES[0];

    const extPaintMat = new THREE.MeshLambertMaterial({ color: curWallObj.num });
    const intPaintMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const floorTileMat = new THREE.MeshLambertMaterial({ color: curFloorObj.color });

    // Paint all wall pieces
    state.wallsData.forEach(floorWalls => {
      floorWalls.forEach(seg => {
        const dx = (seg.x1 - seg.x0) / seg.L;
        const dz = (seg.z1 - seg.z0) / seg.L;
        const angle = Math.atan2(dz, dx);
        const yBase = Layout.P + seg.f * Layout.FH;

        const pieces = Layout.pieces(seg);
        pieces.forEach(p => {
          const pw = p.u1 - p.u0;
          const ph = p.y1 - p.y0;
          if (pw <= 0 || ph <= 0) return;

          const uMid = (p.u0 + p.u1) / 2;
          const px = seg.x0 + dx * uMid;
          const pz = seg.z0 + dz * uMid;
          const py = yBase + p.y0 + ph / 2;

          const wallPiece = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, seg.t), seg.ext ? extPaintMat : intPaintMat);
          wallPiece.position.set(px, py, pz);
          wallPiece.rotation.y = -angle;
          wallPiece.castShadow = true;
          wallPiece.receiveShadow = true;
          constructionGroup.add(wallPiece);
        });
      });
    });

    // Floor Finishes for each individual room
    pl.floors.forEach((rooms, f) => {
      rooms.forEach(r => {
        const rw = r.x1 - r.x0 - 0.04;
        const rd = r.z1 - r.z0 - 0.04;
        const cx = (r.x0 + r.x1) / 2;
        const cz = (r.z0 + r.z1) / 2;
        const cy = Layout.P + f * Layout.FH + 0.015;

        const isSelected = r.id === state.selectedRoomId;
        const roomMat = isSelected
          ? new THREE.MeshLambertMaterial({ color: 0x4a90e2, emissive: 0x1d4e89, emissiveIntensity: 0.35 })
          : floorTileMat;

        const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.02, rd), roomMat);
        floorMesh.position.set(cx, cy, cz);
        floorMesh.receiveShadow = true;
        floorMesh.userData = { roomId: r.id, roomType: r.t, label: r.label };
        constructionGroup.add(floorMesh);
        roomFloorMeshes.push(floorMesh);
      });
    });
  }

  function buildPlacedFurniture() {
    furnitureGroup.clear();
    if (!state.planData || state.currentStage < 4) return;

    state.planData.floors.forEach((rooms, f) => {
      rooms.forEach(r => {
        const placed = state.furniturePlaced[r.id];
        if (!placed || placed.size === 0) return;

        const rw = r.x1 - r.x0;
        const rd = r.z1 - r.z0;
        const cx = (r.x0 + r.x1) / 2;
        const cz = (r.z0 + r.z1) / 2;
        const yFloor = Layout.P + f * Layout.FH + 0.02;

        placed.forEach(itemId => {
          const itemDef = Furn.byId(itemId);
          if (!itemDef) return;

          const g = new THREE.Group();
          itemDef.build(g);

          // Position according to anchor inside room
          let fx = cx, fz = cz;
          const a = itemDef.anchor || 'C';
          if (a.includes('N')) fz = r.z0 + itemDef.d / 2 + 0.35;
          if (a.includes('S')) fz = r.z1 - itemDef.d / 2 - 0.35;
          if (a.includes('W')) fx = r.x0 + itemDef.w / 2 + 0.35;
          if (a.includes('E')) fx = r.x1 - itemDef.w / 2 - 0.35;

          g.position.set(fx, yFloor, fz);

          // Add a warm point light if it's a lighting fixture
          if (itemDef.light) {
            const pl = new THREE.PointLight(0xffecd1, 0.75, 5);
            pl.position.set(fx, yFloor + 2.4, fz);
            furnitureGroup.add(pl);
          }

          furnitureGroup.add(g);
        });
      });
    });
  }

  // --- Step 1: Plan UI Setup ---
  function setupStep1UI() {
    // Floors selector
    const oFloors = $('#oFloors');
    oFloors.innerHTML = `
      <label><input type="radio" name="floors" value="1" ${state.floors === 1 ? 'checked' : ''}> Single Floor</label>
      <label><input type="radio" name="floors" value="2" ${state.floors === 2 ? 'checked' : ''}> Double Floor (Duplex)</label>
    `;
    oFloors.querySelectorAll('input').forEach(inp => {
      inp.onchange = (e) => {
        state.floors = parseInt(e.target.value, 10);
      };
    });

    // Rooms counters
    const oRooms = $('#oRooms');
    const roomDefs = [
      { key: 'hall', label: 'Living Hall / Lounge', min: 1, max: 2 },
      { key: 'bedroom', label: 'Bedrooms', min: 1, max: 5 },
      { key: 'kitchen', label: 'Kitchen', min: 1, max: 2 },
      { key: 'dining', label: 'Dining Area', min: 1, max: 2 },
      { key: 'bathroom', label: 'Bathrooms', min: 1, max: 4 },
      { key: 'pooja', label: 'Pooja Room', min: 0, max: 1 }
    ];

    oRooms.innerHTML = roomDefs.map(r => `
      <div class="step" data-key="${r.key}">
        <span>${r.label}</span>
        <div>
          <button class="btn-dec" aria-label="Decrease ${r.label}">−</button>
          <b id="cnt-${r.key}">${state.rooms[r.key]}</b>
          <button class="btn-inc" aria-label="Increase ${r.label}">+</button>
        </div>
      </div>
    `).join('');

    roomDefs.forEach(r => {
      const stepRow = oRooms.querySelector(`.step[data-key="${r.key}"]`);
      stepRow.querySelector('.btn-dec').onclick = () => {
        if (state.rooms[r.key] > r.min) {
          state.rooms[r.key]--;
          $(`#cnt-${r.key}`).textContent = state.rooms[r.key];
        }
      };
      stepRow.querySelector('.btn-inc').onclick = () => {
        if (state.rooms[r.key] < r.max) {
          state.rooms[r.key]++;
          $(`#cnt-${r.key}`).textContent = state.rooms[r.key];
        }
      };
    });

    // Roof selector
    const oRoof = $('#oRoof');
    oRoof.innerHTML = `
      <label><input type="radio" name="roof" value="tile" ${state.roof === 'tile' ? 'checked' : ''}> Pitched Roof (Terracotta Tiles)</label>
      <label><input type="radio" name="roof" value="flat" ${state.roof === 'flat' ? 'checked' : ''}> Flat Terrace (RCC Slab)</label>
    `;
    oRoof.querySelectorAll('input').forEach(inp => {
      inp.onchange = (e) => {
        state.roof = e.target.value;
      };
    });

    // Wall Colors
    const oWall = $('#oWall');
    oWall.innerHTML = WALL_COLORS.map(c => `
      <button style="background:${c.hex}" title="${c.name}" aria-pressed="${state.wallColor === c.hex ? 'true' : 'false'}" data-hex="${c.hex}"></button>
    `).join('');
    oWall.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        state.wallColor = btn.dataset.hex;
        oWall.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.hex === state.wallColor ? 'true' : 'false'));
      };
    });

    // Floor Type
    const oFloor = $('#oFloor');
    oFloor.innerHTML = FLOOR_TYPES.map(f => `
      <label><input type="radio" name="floorType" value="${f.id}" ${state.floorType === f.id ? 'checked' : ''}> ${f.name}</label>
    `).join('');
    oFloor.querySelectorAll('input').forEach(inp => {
      inp.onchange = (e) => {
        state.floorType = e.target.value;
      };
    });

    // Generate Layout Button
    $('#gen').onclick = () => {
      generatePlan();
      goToStep(2);
    };
  }

  // --- Step 2: Build UI Setup ---
  function setupStep2UI() {
    const stgList = $('#stg');
    stgList.innerHTML = STAGES.map(s => `
      <li id="stg-${s.id}">
        <strong>${s.title}</strong>
        <div style="font-size:0.8rem;color:var(--mut)">${s.desc}</div>
      </li>
    `).join('');

    // Speed options
    const oSpeed = $('#oSpeed');
    oSpeed.innerHTML = `
      <span style="font-size:0.85rem;font-weight:500;align-self:center">Speed:</span>
      <label><input type="radio" name="speed" value="1" checked> 1x</label>
      <label><input type="radio" name="speed" value="2"> 2x</label>
      <label><input type="radio" name="speed" value="5"> 5x</label>
      <label><input type="radio" name="speed" value="999"> Instant</label>
    `;
    oSpeed.querySelectorAll('input').forEach(inp => {
      inp.onchange = (e) => {
        state.buildSpeed = parseFloat(e.target.value);
      };
    });

    $('#next').onclick = () => {
      if (state.currentStage < state.maxStage) {
        state.currentStage++;
        rebuild3DModel();
        updateStageUI();
      } else {
        goToStep(3);
      }
    };

    $('#auto').onclick = toggleAutoBuild;

    $('#redo').onclick = () => {
      stopAutoBuild();
      goToStep(1);
    };
  }

  function updateStageUI() {
    const cur = state.currentStage;
    const progress = ((cur) / state.maxStage) * 100;
    $('#pb').style.width = progress + '%';

    STAGES.forEach(s => {
      const li = $(`#stg-${s.id}`);
      if (!li) return;
      li.className = '';
      if (s.id < cur) li.classList.add('ok');
      else if (s.id === cur) li.classList.add('on');
    });

    const nextBtn = $('#next');
    if (nextBtn) {
      nextBtn.textContent = cur >= state.maxStage ? 'Proceed to Furnish →' : 'Next Stage →';
    }
  }

  function toggleAutoBuild() {
    if (state.autoPlaying) {
      stopAutoBuild();
    } else {
      startAutoBuild();
    }
  }

  function startAutoBuild() {
    state.autoPlaying = true;
    $('#auto').textContent = 'Pause';

    if (state.buildSpeed === 999) {
      state.currentStage = state.maxStage;
      rebuild3DModel();
      updateStageUI();
      stopAutoBuild();
      return;
    }

    const interval = Math.max(250, 1500 / state.buildSpeed);
    state.autoTimer = setInterval(() => {
      if (state.currentStage < state.maxStage) {
        state.currentStage++;
        rebuild3DModel();
        updateStageUI();
      } else {
        stopAutoBuild();
      }
    }, interval);
  }

  function stopAutoBuild() {
    state.autoPlaying = false;
    clearInterval(state.autoTimer);
    $('#auto').textContent = 'Auto build';
  }

  // --- Step 3: Furnish & Finishes UI Setup ---
  function setupStep3UI() {
    // Interior wall swatches
    const iWall = $('#iWall');
    iWall.innerHTML = WALL_COLORS.map(c => `
      <button style="background:${c.hex}" title="${c.name}" aria-pressed="${state.wallColor === c.hex ? 'true' : 'false'}" data-hex="${c.hex}"></button>
    `).join('');
    iWall.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        state.wallColor = btn.dataset.hex;
        iWall.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.hex === state.wallColor ? 'true' : 'false'));
        rebuild3DModel();
      };
    });

    // Interior floor options
    const iFloor = $('#iFloor');
    iFloor.innerHTML = FLOOR_TYPES.map(f => `
      <label><input type="radio" name="iFloorType" value="${f.id}" ${state.floorType === f.id ? 'checked' : ''}> ${f.name}</label>
    `).join('');
    iFloor.querySelectorAll('input').forEach(inp => {
      inp.onchange = (e) => {
        state.floorType = e.target.value;
        rebuild3DModel();
      };
    });

    $('#autof').onclick = () => {
      // Auto-furnish all rooms with typical sets
      if (!state.planData) return;
      state.planData.floors.forEach(floor => {
        floor.forEach(room => {
          if (room.t === 'stair') return;
          const items = Furn.forRoom(room.t);
          state.furniturePlaced[room.id] = new Set(items.map(i => i.id));
        });
      });
      rebuild3DModel();
      refreshRoomFurnitureUI();
    };

    $('#done').onclick = () => {
      goToStep(4);
    };
  }

  function refreshRoomsList() {
    const roomsContainer = $('#rooms');
    if (!state.planData) return;

    const allRooms = [];
    state.planData.floors.forEach(floor => {
      floor.forEach(room => {
        if (room.t !== 'stair') allRooms.push(room);
      });
    });

    roomsContainer.innerHTML = allRooms.map(r => `
      <label style="font-size:0.85rem">
        <input type="radio" name="selectedRoom" value="${r.id}" ${r.id === state.selectedRoomId ? 'checked' : ''}>
        ${r.label}
      </label>
    `).join('');

    roomsContainer.querySelectorAll('input').forEach(inp => {
      inp.onchange = (e) => {
        selectRoom(e.target.value);
      };
    });

    if (!state.selectedRoomId && allRooms.length > 0) {
      selectRoom(allRooms[0].id);
    } else {
      selectRoom(state.selectedRoomId);
    }
  }

  function selectRoom(roomId) {
    state.selectedRoomId = roomId;

    const allRooms = [];
    state.planData.floors.forEach(floor => floor.forEach(r => allRooms.push(r)));
    const room = allRooms.find(r => r.id === roomId);
    if (!room) return;

    // Update title
    const rname = $('#rname');
    const areaSqM = ((room.x1 - room.x0) * (room.z1 - room.z0)).toFixed(1);
    const areaSqFt = (areaSqM * 10.764).toFixed(0);
    rname.textContent = `${room.label} (${areaSqM} m² / ${areaSqFt} sq.ft)`;

    // Update active radio in #rooms
    const inp = $(`input[name="selectedRoom"][value="${roomId}"]`);
    if (inp) inp.checked = true;

    // Focus camera smoothly towards the room
    const cx = (room.x0 + room.x1) / 2;
    const cz = (room.z0 + room.z1) / 2;
    targetLook.set(cx, Layout.P + room.f * Layout.FH + 1.2, cz);
    updateCamera();

    refreshRoomFurnitureUI();
    render2DPlan();
    rebuild3DModel();
  }

  function refreshRoomFurnitureUI() {
    const furContainer = $('#fur');
    if (!state.selectedRoomId || !state.planData) {
      furContainer.innerHTML = '<p class="note">Select a room to configure furniture.</p>';
      return;
    }

    const allRooms = [];
    state.planData.floors.forEach(fl => fl.forEach(r => allRooms.push(r)));
    const room = allRooms.find(r => r.id === state.selectedRoomId);
    if (!room) return;

    const available = Furn.forRoom(room.t);
    const placedSet = state.furniturePlaced[room.id] || new Set();

    furContainer.innerHTML = available.map(item => `
      <label>
        <input type="checkbox" data-item="${item.id}" ${placedSet.has(item.id) ? 'checked' : ''}>
        ${item.name}
      </label>
    `).join('');

    furContainer.querySelectorAll('input').forEach(chk => {
      chk.onchange = (e) => {
        const itemId = e.target.dataset.item;
        if (e.target.checked) {
          placedSet.add(itemId);
        } else {
          placedSet.delete(itemId);
        }
        rebuild3DModel();
      };
    });
  }

  // --- Step 4: Material Estimation & Quote ---
  function setupStep4UI() {
    $('#back3').onclick = () => goToStep(3);

    $('#quote').onclick = () => {
      // Package estimation data into formatted quote requirements
      const est = calculateRealMaterials();
      const pl = state.planData;
      const totalArea = Math.round(pl.floors.reduce((acc, f) => acc + f.reduce((a, r) => a + (r.x1 - r.x0) * (r.z1 - r.z0), 0), 0) * 10.764);

      const quoteSummary = [
        `================ IRAIVAN STEELS QUOTE SPECIFICATION ================`,
        `Project Architecture: ${state.floors === 1 ? 'Single Floor Villa' : 'G+1 Double Floor Duplex'}`,
        `Total Built-up Area: ~${totalArea} sq.ft (${(totalArea / 10.764).toFixed(0)} m²)`,
        `Roof Design: ${state.roof === 'tile' ? 'Pitched Terracotta Roof Tiles' : 'RCC Waterproof Terrace Slab'}`,
        `Wall Color & Finish: ${state.wallColor}`,
        `Flooring Specification: ${FLOOR_TYPES.find(f => f.id === state.floorType).name}`,
        ``,
        `ESTIMATED REAL-TIME MATERIAL SCHEDULE (TODAY'S SPOT RATES):`,
        `• Structural TMT Steel: ${est['Iraivan Fe 550D TMT Steel']} (Current Spot Rate: ₹61,800/MT, Yesterday: ₹61,150/MT)`,
        `• Structural Cement: ${est['Dalmia DSP / OPC 53 Grade Cement']} (Spot Rate: ₹415/bag)`,
        `• Masonry Units: ${est['First-Class Wire-Cut Red Clay Bricks']} (₹9.80/unit)`,
        `• Fine Sand: ${est['Graded M-Sand (Zone II)']} (High-bonding)`,
        `• Coarse Aggregate: ${est['20mm Graded Blue Metal Aggregate']} (Structural mix)`,
        `• Paint Emulsion: ${est['Asian Paints Royale / Apex Emulsion']} (Weatherproof)`,
        `• Flooring Slabs: ${est['Vitrified Tiles / Marble']} (Finish area)`,
        `• Joinery: ${est['Teakwood Doors']} Doors, ${est['Anodized Glass Windows']} Windows`,
        (est['Pitched Terracotta Roof Tiles'] ? `• Roof Tiles: ${est['Pitched Terracotta Roof Tiles']} (Wienerberger Standard)` : ''),
        ``,
        `Please lock today's spot commodity prices and dispatch proforma invoice with mill test certificates.`
      ].filter(Boolean).join('\n');

      sessionStorage.setItem('quote', quoteSummary);
      window.location.href = 'contact.html';
    };
  }

  function calculateRealMaterials() {
    const pl = state.planData;
    const cfg = { roof: state.roof };
    const bc = state.bricksData.length || 3800;
    const doors = pl.floors.reduce((a, fl) => a + fl.length, 0);
    const wins = pl.floors.reduce((a, fl) => a + fl.length * 2, 0);
    const plasterArea = Math.round(bc * 0.08 + pl.W * pl.D * 4);

    const baseEst = Layout.estimate(pl, cfg, bc, doors, wins, plasterArea);
    const steelTons = +(baseEst['Steel (kg)'] / 1000).toFixed(2);
    const todaySteelCost = Math.round(steelTons * 61800);
    const yestSteelCost = Math.round(steelTons * 61150);
    const steelDiff = todaySteelCost - yestSteelCost;

    const brandEst = {
      'Iraivan Fe 550D TMT Steel': `${steelTons} MT (${baseEst['Steel (kg)']} kg) · ₹${todaySteelCost.toLocaleString('en-IN')} (▲ +₹${steelDiff.toLocaleString('en-IN')} vs yest)`,
      'Dalmia DSP / OPC 53 Grade Cement': `${baseEst['Cement (50 kg bags)']} bags · ₹${(baseEst['Cement (50 kg bags)'] * 415).toLocaleString('en-IN')}`,
      'First-Class Wire-Cut Red Clay Bricks': `${baseEst['Bricks']} units · ₹${(baseEst['Bricks'] * 9.8).toLocaleString('en-IN')}`,
      'Graded M-Sand (Zone II)': `${baseEst['Sand (tons)']} tons`,
      '20mm Graded Blue Metal Aggregate': `${baseEst['Aggregate (tons)']} tons`,
      'Asian Paints Royale / Apex Emulsion': `${baseEst['Paint (litres)']} litres`,
      'Vitrified Tiles / Marble': `${baseEst['Floor finish (m²)']} m² (${Math.round(baseEst['Floor finish (m²)'] * 10.764)} sq.ft)`,
      'Teakwood Doors': `${baseEst['Doors']} sets`,
      'Anodized Glass Windows': `${baseEst['Windows']} sets`
    };

    if (baseEst['Roof tiles']) {
      brandEst['Pitched Terracotta Roof Tiles'] = `${baseEst['Roof tiles']} pieces`;
    }

    return brandEst;
  }

  function renderStep4Estimates() {
    const est = calculateRealMaterials();
    const estContainer = $('#est');
    estContainer.innerHTML = Object.entries(est).map(([mat, qty]) => `
      <dt style="font-size:0.92rem;color:#fff;font-weight:600">${mat}</dt>
      <dd style="font-size:0.92rem;color:var(--gold);font-weight:700">${qty}</dd>
    `).join('');

    const pl = state.planData;
    const totalArea = Math.round(pl.floors.reduce((acc, f) => acc + f.reduce((a, r) => a + (r.x1 - r.x0) * (r.z1 - r.z0), 0), 0) * 10.764);
    const chosen = $('#chosen');
    chosen.innerHTML = `
      <div style="background:var(--bg-elevated);border:1px solid var(--line-highlight);border-radius:6px;padding:0.9rem">
        <div style="font-size:0.75rem;font-weight:700;color:var(--gold);letter-spacing:0.06em">ARCHITECTURAL BILL OF QUANTITIES</div>
        <div style="margin-top:0.3rem">
          <strong>${state.floors === 1 ? 'Single Floor Villa' : 'Double Floor (G+1) Duplex'}</strong> · 
          Built-up: ~${totalArea} sq.ft · 
          ${state.roof === 'tile' ? 'Pitched Terracotta Roof' : 'RCC Terrace Slab'}
        </div>
        <div style="font-size:0.8rem;color:var(--mut);margin-top:0.3rem">
          Live benchmark: Iraivan Fe 550D @ ₹61,800/MT (▲ +₹650/MT vs yesterday close)
        </div>
      </div>
    `;
  }

  // --- Step Navigation ---
  function setupChips() {
    const chips = $('#chips');
    const chipSteps = [
      { num: 1, label: '1. Plan' },
      { num: 2, label: '2. Build' },
      { num: 3, label: '3. Furnish' },
      { num: 4, label: '4. Materials & Quote' }
    ];

    chips.innerHTML = chipSteps.map(s => `
      <button data-step="${s.num}" aria-pressed="${state.step === s.num ? 'true' : 'false'}">${s.label}</button>
    `).join('');

    chips.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        const targetStep = parseInt(btn.dataset.step, 10);
        goToStep(targetStep);
      };
    });
  }

  function goToStep(s) {
    state.step = s;

    // Update chips
    $('#chips').querySelectorAll('button').forEach(b => {
      b.setAttribute('aria-pressed', parseInt(b.dataset.step, 10) === s ? 'true' : 'false');
    });

    // Hide all step panels
    $('#s1').hidden = (s !== 1);
    $('#s2').hidden = (s !== 2);
    $('#s3').hidden = (s !== 3);
    $('#s4').hidden = (s !== 4);

    if (s === 2) {
      updateStageUI();
      render2DPlan();
    } else if (s === 3) {
      state.currentStage = state.maxStage; // Ensure house is fully erected
      rebuild3DModel();
      refreshRoomsList();
    } else if (s === 4) {
      renderStep4Estimates();
    }
  }

  // --- Bootstrap Simulator ---
  function init() {
    init3D();
    setupChips();
    setupStep1UI();
    setupStep2UI();
    setupStep3UI();
    setupStep4UI();

    // Generate initial default plan
    generatePlan();
    goToStep(1);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

