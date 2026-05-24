
// ── Canvas setup ──
const canvas = document.getElementById('sim');
const ctx = canvas.getContext('2d');

function resize() {
  const wrap = document.getElementById('canvas-wrap');
  canvas.width = wrap.clientWidth || 600;
  canvas.height = wrap.clientHeight || 500;
}
resize();
window.addEventListener('resize', () => { resize(); genStars(); });

// ── Physics state ──
const G = 1.0, C = 1.0, STEP = 0.5;
let M = 400, relFactor = 1.0, photonSpeed = 2.0;
let rayCount = 16, raySpacing = 26, rayBrightness = 0.8;
let bhX = canvas.width / 2, bhY = canvas.height / 2;
let RS = 2 * G * M / (C * C * 80);
let paused = false, singularity = false;
let frameCount = 0;
let totalPh = 0, capPh = 0, escPh = 0, maxDefl = 0;
let accAngle = 0;

// Display flags
const show = { grid: true, stars: true, accretion: false, trails: false, einstein: false };

// Trail buffer
const TRAIL_MAX = 5000;
let trails = [];

// Graph data
const GLEN = 60;
const graphData = new Array(GLEN).fill(0);

// FPS
let lastTime = performance.now(), fps = 0, fpsTimer = 0;

// ── Stars ──
let stars = [];
function genStars() {
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random() * 0.65 + 0.15,
      tw: Math.random() * Math.PI * 2
    });
  }
}
genStars();

// ── Mouse ──
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  bhX = (e.clientX - r.left) * scaleX;
  bhY = (e.clientY - r.top) * scaleY;
  document.getElementById('bx').textContent = Math.round(bhX);
  document.getElementById('by').textContent = Math.round(bhY);
});

// ── RK4 Physics ──
function derivs(x, y, vx, vy, out) {
  const dx = x - bhX, dy = y - bhY;
  const r2 = dx*dx + dy*dy, r = Math.sqrt(r2);
  if (r < RS) { out[0] = 0; out[1] = 0; return; }
  const Meff = M / 80; // match display scale of RS
  const fN = G * Meff / (r2 * r);
  const L = dx * vy - dy * vx;
  const fR = relFactor * 3 * G * Meff * L * L / (C * C * r2 * r2 * r);
  const f = fN + fR;
  out[0] = -f * dx;
  out[1] = -f * dy;
}

function stepPhoton(p) {
  const dx = p.x - bhX, dy = p.y - bhY;
  if (Math.sqrt(dx*dx + dy*dy) <= RS) { p.dead = 1; return; }
  const a = [0,0];
  derivs(p.x, p.y, p.vx, p.vy, a);
  const ax1=a[0], ay1=a[1];
  derivs(p.x+.5*STEP*p.vx, p.y+.5*STEP*p.vy, p.vx+.5*STEP*ax1, p.vy+.5*STEP*ay1, a);
  const ax2=a[0], ay2=a[1];
  derivs(p.x+.5*STEP*(p.vx+.5*STEP*ax1), p.y+.5*STEP*(p.vy+.5*STEP*ay1), p.vx+.5*STEP*ax2, p.vy+.5*STEP*ay2, a);
  const ax3=a[0], ay3=a[1];
  derivs(p.x+STEP*(p.vx+.5*STEP*ax2), p.y+STEP*(p.vy+.5*STEP*ay2), p.vx+STEP*ax3, p.vy+STEP*ay3, a);
  const ax4=a[0], ay4=a[1];
  p.x  += STEP/6*(p.vx + 2*(p.vx+.5*STEP*ax1) + 2*(p.vx+.5*STEP*ax2) + (p.vx+STEP*ax3));
  p.y  += STEP/6*(p.vy + 2*(p.vy+.5*STEP*ay1) + 2*(p.vy+.5*STEP*ay2) + (p.vy+STEP*ay3));
  p.vx += STEP/6*(ax1 + 2*ax2 + 2*ax3 + ax4);
  p.vy += STEP/6*(ay1 + 2*ay2 + 2*ay3 + ay4);
  if (p.x < -80 || p.x > canvas.width+80 || p.y < -80 || p.y > canvas.height+80) p.dead = 2;
}

// ── Grid ──
function drawGrid() {
  const CELL = 42;
  ctx.save();
  ctx.lineWidth = 0.5;
  for (let gx = 0; gx <= canvas.width + CELL; gx += CELL) {
    ctx.beginPath();
    let first = true;
    for (let gy = 0; gy <= canvas.height; gy += 5) {
      const dx = gx - bhX, dy = gy - bhY;
      const r = Math.sqrt(dx*dx + dy*dy) || 1;
      const disp = Math.min(RS * RS * 0.15 / Math.max(r, RS * 0.5), 20);
      const ox = gx - (dx/r)*disp, oy = gy - (dy/r)*disp;
      first ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy);
      first = false;
    }
    ctx.strokeStyle = 'rgba(0,140,170,0.13)';
    ctx.stroke();
  }
  for (let gy = 0; gy <= canvas.height + CELL; gy += CELL) {
    ctx.beginPath();
    let first = true;
    for (let gx = 0; gx <= canvas.width; gx += 5) {
      const dx = gx - bhX, dy = gy - bhY;
      const r = Math.sqrt(dx*dx + dy*dy) || 1;
      const disp = Math.min(RS * RS * 0.15 / Math.max(r, RS * 0.5), 20);
      const ox = gx - (dx/r)*disp, oy = gy - (dy/r)*disp;
      first ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy);
      first = false;
    }
    ctx.strokeStyle = 'rgba(0,140,170,0.09)';
    ctx.stroke();
  }
  ctx.restore();
}

// ── Accretion ──
function drawAccretion() {
  accAngle += 0.01;
  ctx.save();
  ctx.translate(bhX, bhY);
  for (let i = 0; i < 4; i++) {
    const ir = RS * (1.25 + i * 0.3), or2 = RS * (1.55 + i * 0.3);
    const bright = 1 - i * 0.22;
    ctx.save();
    ctx.rotate(accAngle * (i % 2 === 0 ? 1 : -0.7));
    ctx.scale(1, 0.3);
    const g = ctx.createRadialGradient(0, 0, ir, 0, 0, or2);
    g.addColorStop(0, `rgba(255,${130 - i*22},10,${0.35 * bright})`);
    g.addColorStop(0.6, `rgba(200,60,0,${0.15 * bright})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(0, 0, or2, 0, Math.PI * 2);
    ctx.arc(0, 0, ir, 0, Math.PI * 2, true);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ── Ray colour ──
function rayCol(t, alpha) {
  // t: 0=direct blue, 1=heavily lensed green
  const r = Math.round(t * 80);
  const g2 = Math.round(120 + t * 100);
  const b = Math.round(255 - t * 140);
  return `rgba(${r},${g2},${b},${alpha})`;
}

// ── Main loop ──
function draw() {
  requestAnimationFrame(draw);
  if (!paused) frameCount++;

  const now = performance.now();
  const dt = now - lastTime; lastTime = now;
  fpsTimer += dt;
  if (fpsTimer > 500) {
    fps = Math.round(1000 / dt);
    document.getElementById('hFPS').textContent = fps;
    fpsTimer = 0;
  }

  RS = 2 * G * M / (C * C * 80);

  // Clear
  ctx.fillStyle = '#01010c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars
  if (show.stars) {
    const t = frameCount * 0.003;
    stars.forEach(s => {
      const tw = 0.5 + 0.5 * Math.sin(t + s.tw);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,225,255,${s.a * tw})`;
      ctx.fill();
    });
  }

  // Grid
  if (show.grid) drawGrid();

  // Trails
  if (show.trails && trails.length > 1) {
    ctx.save();
    for (let i = 0; i < trails.length; i++) {
      const p = trails[i];
      const a = (i / trails.length) * 0.06;
      ctx.fillStyle = `rgba(0,180,255,${a})`;
      ctx.fillRect(p.x, p.y, 1, 1);
    }
    ctx.restore();
  }

  // Accretion (behind BH)
  if (show.accretion) drawAccretion();

  // ── Trace rays ──
  let frameCap = 0, frameEsc = 0, frameDefl = 0;
  if (!paused) {
    for (let ri = 0; ri < rayCount; ri++) {
      const sy = (ri + 1) * raySpacing;
      if (sy > canvas.height + 20) continue;

      const p = { x: 0, y: sy, vx: photonSpeed * C, vy: 0, dead: 0 };
      const path = [{ x: p.x, y: p.y }];
      let steps = 0;
      const maxSteps = Math.max(400, Math.round(1800 / photonSpeed));
      while (!p.dead && steps++ < maxSteps) {
        stepPhoton(p);
        path.push({ x: p.x, y: p.y });
      }

      totalPh++;
      if (p.dead === 1) { frameCap++; capPh++; }
      else { frameEsc++; escPh++; }

      // Measure deflection
      if (path.length > 20) {
        const last = path[path.length - 1];
        const prev = path[Math.max(0, path.length - 25)];
        const ang = Math.abs(Math.atan2(last.y - prev.y, last.x - prev.x) * 180 / Math.PI);
        if (ang < 170 && ang > frameDefl) frameDefl = ang;
      }

      // Draw ray
      if (path.length > 1) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let j = 1; j < path.length; j++) ctx.lineTo(path[j].x, path[j].y);

        const endPt = path[path.length - 1];
        const startPt = path[0];
        const traveled = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);
        const deflT = p.dead === 1 ? 1 : Math.max(0, 1 - traveled / canvas.width);

        ctx.strokeStyle = p.dead === 1
          ? `rgba(255,80,0,${rayBrightness * 0.7})`
          : rayCol(deflT * 0.7, rayBrightness * 0.82);
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Trails
        if (show.trails) {
          const skip = Math.max(4, Math.round(rayCount / 4));
          for (let j = 0; j < path.length; j += skip) trails.push(path[j]);
          while (trails.length > TRAIL_MAX) trails.shift();
        }
      }
    }

    maxDefl = Math.max(maxDefl, frameDefl);
    graphData.push(frameCap);
    if (graphData.length > GLEN) graphData.shift();
  }

  // ── Einstein ring ──
  if (show.einstein) {
    const ER = RS * 2.5;
    ctx.beginPath();
    ctx.arc(bhX, bhY, ER, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(232,96,10,${0.3 + 0.1 * Math.sin(frameCount * 0.05)})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Black hole ──
  // Gravity shadow
  const shad = ctx.createRadialGradient(bhX, bhY, 0, bhX, bhY, RS * 3.5);
  shad.addColorStop(0, 'rgba(0,0,0,1)');
  shad.addColorStop(0.25, 'rgba(0,0,0,0.9)');
  shad.addColorStop(0.6, 'rgba(0,0,0,0.35)');
  shad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(bhX, bhY, RS * 3.5, 0, Math.PI * 2);
  ctx.fillStyle = shad;
  ctx.fill();

  // Glow
  const glow = ctx.createRadialGradient(bhX, bhY, RS * 0.8, bhX, bhY, RS * 1.8);
  glow.addColorStop(0, `rgba(255,70,0,${singularity ? 0.6 : 0.28})`);
  glow.addColorStop(0.5, `rgba(200,40,0,${singularity ? 0.3 : 0.12})`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(bhX, bhY, RS * 1.8, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Event horizon solid
  ctx.beginPath();
  ctx.arc(bhX, bhY, RS, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.strokeStyle = singularity ? '#ff2200' : '#e05000';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Photon sphere dashed
  ctx.beginPath();
  ctx.arc(bhX, bhY, RS * 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(200,168,75,0.2)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([4, 7]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels
  if (RS > 20) {
    ctx.save();
    ctx.font = '9px "Share Tech Mono"';
    ctx.fillStyle = 'rgba(200,168,75,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('PHOTON SPHERE', bhX, bhY - RS * 1.5 - 6);
    ctx.fillText('EVENT HORIZON', bhX, bhY - RS - 6);
    ctx.restore();
  }

  // Singularity extra rings
  if (singularity) {
    for (let k = 2; k <= 4; k++) {
      ctx.beginPath();
      ctx.arc(bhX, bhY, RS * k, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,${40 + k*15},0,${0.1 - k*0.015})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  // ── Update UI ──
  document.getElementById('hRS').textContent = Math.round(RS * 2) + 'px';
  document.getElementById('hMass').textContent = M;
  document.getElementById('hPh').textContent = totalPh;
  document.getElementById('rdFrame').textContent = frameCount;
  document.getElementById('mCap').textContent = capPh;
  document.getElementById('mEsc').textContent = escPh;
  document.getElementById('mDefl').textContent = maxDefl.toFixed(1) + '°';
  document.getElementById('mRS').textContent = Math.round(RS) + 'px';

  const rate = totalPh > 0 ? capPh / totalPh * 100 : 0;
  document.getElementById('bar-fill').style.width = Math.min(rate, 100) + '%';
  document.getElementById('capPct').textContent = rate.toFixed(1) + '%';

  // Photon graph
  const gc = document.getElementById('pgraph');
  gc.width = gc.offsetWidth || 170;
  gc.height = 64;
  const gctx = gc.getContext('2d');
  gctx.clearRect(0, 0, gc.width, gc.height);
  const maxV = Math.max(...graphData, 1);
  const gw = gc.width / GLEN;
  gctx.beginPath();
  graphData.forEach((v, i) => {
    const bx = i * gw;
    const by = gc.height - (v / maxV) * (gc.height - 6) - 3;
    i === 0 ? gctx.moveTo(bx, by) : gctx.lineTo(bx + gw / 2, by);
  });
  gctx.strokeStyle = 'rgba(0,212,255,0.75)';
  gctx.lineWidth = 1.5;
  gctx.stroke();
  for (let g = 0.25; g < 1; g += 0.25) {
    gctx.beginPath();
    gctx.moveTo(0, gc.height * g);
    gctx.lineTo(gc.width, gc.height * g);
    gctx.strokeStyle = 'rgba(200,168,75,0.08)';
    gctx.lineWidth = 0.5;
    gctx.stroke();
  }
}

// ── Sliders ──
function wire(id, fn) {
  document.getElementById(id).addEventListener('input', function() { fn(+this.value, this); });
}
wire('sMass',  (v) => { M = v; document.getElementById('lMass').textContent = v; });
wire('sRel',   (v) => { relFactor = v; document.getElementById('lRel').textContent = v.toFixed(1); });
wire('sSpd',   (v) => { photonSpeed = v; document.getElementById('lSpd').textContent = v.toFixed(1)+'c'; });
wire('sRays',  (v) => { rayCount = v; document.getElementById('lRays').textContent = v; });
wire('sSpace', (v) => { raySpacing = v; document.getElementById('lSpace').textContent = v+'px'; });
wire('sBright',(v) => { rayBrightness = v; document.getElementById('lBright').textContent = v.toFixed(2); });

// Toggle buttons
function toggle(id, key, onLabel, offLabel) {
  document.getElementById(id).addEventListener('click', function() {
    show[key] = !show[key];
    this.classList.toggle('on', show[key]);
    if (!show[key] && key === 'trails') trails = [];
  });
}
toggle('tGrid', 'grid');
toggle('tStars', 'stars');
toggle('tAccretion', 'accretion');
toggle('tTrails', 'trails');
toggle('tEinstein', 'einstein');

// Bottom buttons
document.getElementById('btnPause').addEventListener('click', function() {
  paused = !paused;
  this.textContent = paused ? '▶ Resume' : '⏸ Pause';
  this.classList.toggle('on', !paused);
});
document.getElementById('btnReset').addEventListener('click', () => {
  totalPh = capPh = escPh = frameCount = 0; maxDefl = 0; trails = [];
  graphData.fill(0);
  bhX = canvas.width / 2; bhY = canvas.height / 2;
  document.getElementById('bx').textContent = Math.round(bhX);
  document.getElementById('by').textContent = Math.round(bhY);
});
document.getElementById('btnCapture').addEventListener('click', () => {
  const a = document.createElement('a');
  a.download = 'event-horizon-' + Date.now() + '.png';
  a.href = canvas.toDataURL();
  a.click();
});
document.getElementById('btnSing').addEventListener('click', function() {
  singularity = !singularity;
  this.classList.toggle('on', singularity);
  if (singularity) {
    M = 5200; document.getElementById('sMass').value = 5200; document.getElementById('lMass').textContent = 5200;
    relFactor = 3.5; document.getElementById('sRel').value = 3.5; document.getElementById('lRel').textContent = '3.5';
  }
});

draw();
