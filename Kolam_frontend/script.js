/* ==========================================================================
   KOLAM — Where Mathematics Becomes Art
   Master Frontend Logic (Vanilla JS)
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. Global State & Configuration
// --------------------------------------------------------------------------
const API_BASE_URL = "https://project-k-o-l-a-m-backend.onrender.com";
const DEMO_MODE = false; 

let isBackendOnline = false;
let currentPromptHistory = [];
let selectedImageFile = null;
let compressedImageDataUrl = null;
let currentResultImageDataUrl = null;

let speechRecognition = null;
let isListening = false;
let currentVoiceTranscript = "";

let kolamFacts = [];
let factIntervalTimer = null;
let loadingTimeoutTimer = null;

let communitySelectedImageDataUrl = null;
const COMMUNITY_STORAGE_KEY = 'kolam_community_state';

// --- Advanced Hinglish & English Number Dictionary ---
const wordToNum = {
  "one": 1, "ek": 1, "two": 2, "do": 2, "three": 3, "teen": 3,
  "four": 4, "char": 4, "five": 5, "paanch": 5, "six": 6, "chhe": 6,
  "seven": 7, "saat": 7, "eight": 8, "aath": 8, "nine": 9, "nau": 9,
  "ten": 10, "das": 10, "twelve": 12, "sixteen": 16, "twenty": 20, 
  "twenty four": 24, "chaubis": 24, "chobis": 24, "twenty-four": 24,
  "thirty": 30, "thirty six": 36, "forty": 40
};

// --- Helper: Convert Base64 to Binary Blob for FastAPI Uploads ---
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

// --------------------------------------------------------------------------
// 2. Application Initialization
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initIntroSplash();
  initNavigation();
  initHeroCanvas();
  initVoiceChat();
  initCommunity();
  loadFacts();
  checkBackendHealth();
  initMagneticGrid('magnetic-canvas', '.kolam-nodes-container', '#C85A32');
  initMagneticGrid('magnetic-canvas-text', '#workspace-text', '#D4AF37');
  initScrollEffects(); 
  initScrollSpyNav();
  
  setInterval(checkBackendHealth, 15000);
});

const SPLASH_DURATION_MS = 10000;

function initIntroSplash() {
  const splash = document.getElementById('intro-splash');
  if (!splash) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dotsGroup = document.getElementById('splash-dots');
  const linesGroup = document.getElementById('splash-lines');
  const statusText = document.getElementById('intro-splash-status-text');
  const titleWord = document.getElementById('intro-splash-title-word');

  // ---- 0. Center title: KOLAM cycles English → Hindi → Tamil every 3.33s ----
  const titleCycle = [
    { text: 'KOLAM', lang: 'en' },
    { text: 'कोलम्', lang: 'hi' },
    { text: 'கோலம்', lang: 'ta' },
  ];
  let titleIndex = 0;
  let titleTimer = null;
  if (titleWord && !prefersReducedMotion) {
    titleTimer = setInterval(() => {
      titleIndex = (titleIndex + 1) % titleCycle.length;
      titleWord.classList.add('is-switching');
      setTimeout(() => {
        titleWord.textContent = titleCycle[titleIndex].text;
        titleWord.setAttribute('lang', titleCycle[titleIndex].lang);
        titleWord.classList.remove('is-switching');
      }, 280);
    }, 3333);
  }

  // ---- 1. Build a 5x5 Pulli (dot) grid, in the order a Kolam artist places them ----
  const GRID = [60, 105, 150, 195, 240];
  const dots = [];
  GRID.forEach(y => GRID.forEach(x => dots.push({ x, y })));

  // Center-outward placement order feels more like a hand actually drawing it
  dots.sort((a, b) => {
    const da = Math.hypot(a.x - 150, a.y - 150);
    const db = Math.hypot(b.x - 150, b.y - 150);
    return da - db;
  });

  const DOT_PHASE_START = 0.9;   // seconds
  const DOT_PHASE_END = 3.2;     // seconds
  const dotStep = (DOT_PHASE_END - DOT_PHASE_START) / dots.length;

  dots.forEach((d, i) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', d.x);
    circle.setAttribute('cy', d.y);
    circle.setAttribute('r', 3.4);
    circle.setAttribute('fill', 'var(--gold)');
    circle.classList.add('splash-dot');
    circle.style.animationDelay = `${(DOT_PHASE_START + i * dotStep).toFixed(2)}s`;
    dotsGroup.appendChild(circle);
  });

  // ---- 2. Trace the continuous looping line (Kambi) around the dots ----
  // Four petal loops radiating from the center dot, then an outer border loop
  // that ties the whole pulli grid together — the way a real Kolam is closed.
  const kolamPaths = [
    { d: 'M 150 150 C 108 138, 84 90, 150 60 C 216 90, 192 138, 150 150', color: 'var(--terracotta)', width: 3 },
    { d: 'M 150 150 C 162 108, 210 84, 240 150 C 210 216, 162 192, 150 150', color: 'var(--terracotta)', width: 3 },
    { d: 'M 150 150 C 192 162, 216 210, 150 240 C 84 210, 108 162, 150 150', color: 'var(--terracotta)', width: 3 },
    { d: 'M 150 150 C 138 192, 90 216, 60 150 C 90 84, 138 108, 150 150', color: 'var(--terracotta)', width: 3 },
    { d: 'M 60 60 Q 150 20 240 60 Q 280 150 240 240 Q 150 280 60 240 Q 20 150 60 60 Z', color: 'var(--maroon)', width: 2.5 },
  ];

  const LINE_PHASE_START = 3.4;  // seconds, right after the last dot lands
  const LINE_PHASE_END = 8.6;    // seconds
  const perPathDuration = 1.15;
  const lineStep = (LINE_PHASE_END - LINE_PHASE_START - perPathDuration) / (kolamPaths.length - 1);

  kolamPaths.forEach((p, i) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', p.d);
    path.setAttribute('pathLength', '1');
    path.setAttribute('stroke', p.color);
    path.setAttribute('stroke-width', p.width);
    path.classList.add('splash-path');
    const delay = LINE_PHASE_START + i * lineStep;
    path.style.animationDelay = `${delay.toFixed(2)}s`;
    path.style.animationDuration = `${perPathDuration}s`;
    linesGroup.appendChild(path);
  });

  // ---- 2b. Four corner Kolam motifs — a small looped flower around a mini pulli grid ----
  const cornerSvgs = document.querySelectorAll('.intro-corner-svg');
  const CORNER_GRID = [20, 60, 100];
  const cornerDots = [];
  CORNER_GRID.forEach(y => CORNER_GRID.forEach(x => cornerDots.push({ x, y })));
  const cornerPaths = [
    'M 60 60 C 40 52, 30 30, 60 20 C 90 30, 80 52, 60 60',
    'M 60 60 C 68 40, 90 30, 100 60 C 90 90, 68 80, 60 60',
    'M 60 60 C 80 68, 90 90, 60 100 C 30 90, 40 68, 60 60',
    'M 60 60 C 52 80, 30 90, 20 60 C 30 30, 52 40, 60 60',
    'M 20 20 Q 60 6 100 20 Q 114 60 100 100 Q 60 114 20 100 Q 6 60 20 20 Z',
  ];

  cornerSvgs.forEach((svg, ci) => {
    const dotsG = svg.querySelector('.corner-dots');
    const linesG = svg.querySelector('.corner-lines');
    const baseDelay = 4.6 + ci * 0.35;

    cornerDots.forEach((d, i) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', d.x);
      c.setAttribute('cy', d.y);
      c.setAttribute('r', 2.2);
      c.setAttribute('fill', 'var(--gold)');
      c.classList.add('corner-dot');
      c.style.animationDelay = `${(baseDelay + i * 0.09).toFixed(2)}s`;
      dotsG.appendChild(c);
    });

    const lineStart = baseDelay + cornerDots.length * 0.09 + 0.15;
    cornerPaths.forEach((d, i) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      p.setAttribute('pathLength', '1');
      p.setAttribute('stroke', i === cornerPaths.length - 1 ? 'var(--maroon)' : 'var(--terracotta)');
      p.setAttribute('stroke-width', i === cornerPaths.length - 1 ? 2 : 2.2);
      p.classList.add('corner-path');
      p.style.animationDelay = `${(lineStart + i * 0.32).toFixed(2)}s`;
      p.style.animationDuration = '0.55s';
      linesG.appendChild(p);
    });
  });

  // ---- 3. Narrate the drawing as it happens ----
  const statusBeats = [
    { t: 0,    msg: 'Placing the pulli…' },
    { t: DOT_PHASE_END + 0.1, msg: 'Tracing the first loop…' },
    { t: LINE_PHASE_START + perPathDuration + lineStep, msg: 'Closing the pattern…' },
    { t: LINE_PHASE_END, msg: 'Kolam complete.' },
  ];
  const statusTimers = statusBeats.map(b =>
    setTimeout(() => { if (statusText) statusText.textContent = b.msg; }, b.t * 1000)
  );

  // ---- 4. Pulli progress trail — one dot lights per second across the 10s ----
  const dotsRow = document.getElementById('intro-splash-dots');
  const PROGRESS_DOT_COUNT = 10;
  const progressDots = [];
  if (dotsRow) {
    for (let i = 0; i < PROGRESS_DOT_COUNT; i++) {
      const d = document.createElement('span');
      d.classList.add('intro-splash-progress-dot');
      dotsRow.appendChild(d);
      progressDots.push(d);
    }
  }
  let dotProgressTimer = null;
  if (prefersReducedMotion) {
    progressDots.forEach(d => d.classList.add('is-lit'));
  } else {
    let litCount = 0;
    dotProgressTimer = setInterval(() => {
      if (litCount < progressDots.length) {
        progressDots[litCount].classList.add('is-lit');
        litCount++;
      }
    }, SPLASH_DURATION_MS / PROGRESS_DOT_COUNT);
  }

  // ---- 5. Falling flower petals — ambient, continuous for the life of the splash ----
  const petalContainer = document.getElementById('intro-splash-petals');
  if (petalContainer && !prefersReducedMotion) {
    const petalColors = ['var(--terracotta)', 'var(--gold)', 'var(--maroon)', 'var(--saffron)'];
    const rand = (min, max) => Math.random() * (max - min) + min;
    for (let i = 0; i < 14; i++) {
      const petal = document.createElement('span');
      petal.classList.add('intro-petal');
      petal.style.setProperty('--left', `${rand(2, 96)}%`);
      petal.style.setProperty('--size', `${rand(8, 15).toFixed(1)}px`);
      petal.style.setProperty('--duration', `${rand(5, 9).toFixed(2)}s`);
      petal.style.setProperty('--delay', `${rand(0, 5).toFixed(2)}s`);
      petal.style.setProperty('--rot', `${rand(0, 360).toFixed(0)}deg`);
      petal.style.setProperty('--sway', `${rand(-45, 45).toFixed(0)}px`);
      petal.style.background = petalColors[i % petalColors.length];
      petalContainer.appendChild(petal);
    }
  }

  // ---- 6. Cursor parallax on the center kolam + a trailing shimmer of gold dust ----
  const canvasWrap = document.getElementById('intro-splash-canvas-wrap');
  let parallaxRAF = null;
  let pointerHandler = null;
  if (!prefersReducedMotion) {
    const target = { nx: 0, ny: 0 };
    const current = { nx: 0, ny: 0 };
    let lastDustTime = 0;

    const spawnGoldDust = (x, y) => {
      const p = document.createElement('span');
      p.className = 'gold-dust-particle';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      splash.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    };

    pointerHandler = (e) => {
      const rect = splash.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.nx = (x / rect.width - 0.5) * 2;
      target.ny = (y / rect.height - 0.5) * 2;

      const now = performance.now();
      if (now - lastDustTime > 55) {
        lastDustTime = now;
        spawnGoldDust(x, y);
      }
    };
    splash.addEventListener('pointermove', pointerHandler);

    const parallaxLoop = () => {
      current.nx += (target.nx - current.nx) * 0.08;
      current.ny += (target.ny - current.ny) * 0.08;
      if (canvasWrap) {
        canvasWrap.style.transform =
          `translate(${(current.nx * 8).toFixed(2)}px, ${(current.ny * 8).toFixed(2)}px) rotate(${(current.nx * 1.5).toFixed(2)}deg)`;
      }
      parallaxRAF = requestAnimationFrame(parallaxLoop);
    };
    parallaxRAF = requestAnimationFrame(parallaxLoop);
  }

  // ---- 7. Finish the ritual, then open the village door ----
  const totalDelay = prefersReducedMotion ? 2000 : SPLASH_DURATION_MS;
  setTimeout(() => {
    splash.classList.add('is-hiding');
    if (titleTimer) clearInterval(titleTimer);
    if (dotProgressTimer) clearInterval(dotProgressTimer);
    if (parallaxRAF) cancelAnimationFrame(parallaxRAF);
    if (pointerHandler) splash.removeEventListener('pointermove', pointerHandler);
    setTimeout(() => {
      splash.remove();
      statusTimers.forEach(clearTimeout);
      openVillageDoor();
    }, 720);
  }, totalDelay);

  // Safety net: the intro can never permanently trap the app.
  setTimeout(() => {
    const activeSplash = document.getElementById('intro-splash');
    if (activeSplash) {
      activeSplash.classList.add('is-hiding');
      setTimeout(() => activeSplash.remove(), 850);
    }
    openVillageDoor();
  }, Math.max(totalDelay + 1800, 4000));
}

function openVillageDoor() {
  const door = document.getElementById('village-door-reveal');
  if (!door || door.dataset.opened === 'true') return;

  door.dataset.opened = 'true';
  document.body.classList.add('village-door-active');

  requestAnimationFrame(() => {
    door.classList.add('is-entering');
    setTimeout(() => door.classList.add('is-opening'), 180);
  });

  const label = document.getElementById('door-reveal-text');
  if (label) {
    setTimeout(() => { label.textContent = 'Welcome to the Kolam courtyard…'; }, 950);
    setTimeout(() => { label.textContent = 'The village wakes. Your pattern begins.'; }, 1800);
  }

  setTimeout(() => {
    door.classList.add('is-open');
    document.body.classList.remove('splash-locked');
  }, 1750);

  setTimeout(() => door.classList.add('is-leaving'), 2750);

  setTimeout(() => {
    door.remove();
    document.body.classList.remove('village-door-active');
  }, 3500);
}

// --------------------------------------------------------------------------
// 3. Navigation & Health Check Logic
// --------------------------------------------------------------------------
function initNavigation() {
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    link.addEventListener('click', function() {
      links.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  const toggleBtn = document.getElementById('nav-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const navLinks = document.querySelector('.nav-links');
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '70px';
      navLinks.style.right = '20px';
      navLinks.style.background = 'var(--bg-card)';
      navLinks.style.padding = '20px';
      navLinks.style.borderRadius = 'var(--radius-md)';
      navLinks.style.boxShadow = 'var(--shadow-lg)';
    });
  }
}

async function checkBackendHealth() {
  const badge = document.getElementById('health-badge');
  const badgeText = document.getElementById('health-text');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      isBackendOnline = true;
      if (badge) badge.classList.remove('offline');
      if (badgeText) badgeText.textContent = "Engine Online";
    } else {
      throw new Error("Backend non-200 response");
    }
  } catch (err) {
    isBackendOnline = false;
    if (badge) badge.classList.add('offline');
    if (badgeText) badgeText.textContent = "Offline (Local Engine Active)";
  }
}

function selectNode(nodeType) {
  document.querySelectorAll('.kolam-node').forEach(node => node.classList.remove('active'));
  const activeNode = document.getElementById(`node-${nodeType}`);
  if (activeNode) activeNode.classList.add('active');

  document.querySelectorAll('.workspace-panel').forEach(panel => panel.classList.remove('active'));
  const targetPanel = document.getElementById(`workspace-${nodeType}`);
  if (targetPanel) {
    targetPanel.classList.add('active');
    targetPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  updateInteractiveNavLink();
}

// --------------------------------------------------------------------------
// 3b. Scroll-Spy Navigation — moving underline (Home / Create / Restore / Community)
// --------------------------------------------------------------------------
function updateInteractiveNavLink() {
  const navCreate = document.getElementById('nav-create');
  const navRestore = document.getElementById('nav-restore');
  const interactiveSection = document.getElementById('interactive-nodes');
  if (!navCreate || !navRestore || !interactiveSection) return;

  // Only steal the underline for Create/Restore if that section is actually
  // the one currently in view — otherwise scrolling elsewhere should win.
  const rect = interactiveSection.getBoundingClientRect();
  const inView = rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.2;
  if (!inView) return;

  const restorePanel = document.getElementById('workspace-restore');
  const isRestoreActive = restorePanel && restorePanel.classList.contains('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  (isRestoreActive ? navRestore : navCreate).classList.add('active');
}

function initScrollSpyNav() {
  const navHome = document.getElementById('nav-home');
  const navCreate = document.getElementById('nav-create');
  const navRestore = document.getElementById('nav-restore');
  const navCommunity = document.getElementById('nav-community');
  const navLinks = [navHome, navCreate, navRestore, navCommunity].filter(Boolean);
  if (!navLinks.length || !('IntersectionObserver' in window)) return;

  const sectionMap = [
    { el: document.getElementById('hero'), getLink: () => navHome },
    { el: document.getElementById('interactive-nodes'), getLink: () => {
        const restorePanel = document.getElementById('workspace-restore');
        const isRestoreActive = restorePanel && restorePanel.classList.contains('active');
        return isRestoreActive ? navRestore : navCreate;
      } },
    { el: document.getElementById('community'), getLink: () => navCommunity }
  ].filter(s => s.el);

  const setActiveLink = (link) => {
    if (!link) return;
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const match = sectionMap.find(s => s.el === visible.target);
    if (match) setActiveLink(match.getLink());
  }, { threshold: [0.25, 0.5, 0.75], rootMargin: '-90px 0px -35% 0px' });

  sectionMap.forEach(s => observer.observe(s.el));
}

// --------------------------------------------------------------------------
// 4. Hero Canvas Animation ("THE FIRST DOT")
// --------------------------------------------------------------------------
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let time = 0;
  function animate() {
    time += 0.015;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const gridSize = 5;
    const spacing = Math.min(canvas.width, canvas.height) * 0.08;

    // Draw Grid Dots
    ctx.fillStyle = 'rgba(200, 90, 50, 0.4)';
    for (let r = -Math.floor(gridSize/2); r <= Math.floor(gridSize/2); r++) {
      for (let c = -Math.floor(gridSize/2); c <= Math.floor(gridSize/2); c++) {
        const x = centerX + c * spacing;
        const y = centerY + r * spacing;
        const pulse = Math.sin(time * 2 + (r + c)) * 2;
        
        ctx.beginPath();
        ctx.arc(x, y, 4 + pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Symmetrical Animated Curves
    ctx.strokeStyle = 'rgba(107, 29, 47, 0.35)';
    ctx.lineWidth = 2.5;

    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i + time * 0.2;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      
      const wave = Math.sin(time * 1.5) * 30;
      ctx.bezierCurveTo(
        spacing * 1.2, spacing * 0.5 + wave,
        spacing * 1.8, spacing * 1.5 - wave,
        spacing * 2, 0
      );
      ctx.bezierCurveTo(
        spacing * 1.8, -spacing * 1.5 + wave,
        spacing * 1.2, -spacing * 0.5 - wave,
        0, 0
      );
      ctx.stroke();

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.beginPath();
      ctx.arc(spacing * 1.5, 0, spacing * 0.7 + Math.sin(time) * 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// --------------------------------------------------------------------------
// 5. Voice Chat Mode (Web Speech API)
// --------------------------------------------------------------------------
function initVoiceChat() {
  const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognitionApi) {
    const statusText = document.getElementById('voice-status');
    if (statusText) statusText.textContent = "Speech recognition unavailable in browser";
    return;
  }

  speechRecognition = new SpeechRecognitionApi();
  speechRecognition.continuous = false;
  speechRecognition.interimResults = true;
  speechRecognition.lang = 'en-IN';

  speechRecognition.onstart = () => {
    isListening = true;
    updateVoiceUI(true);
  };

  speechRecognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    currentVoiceTranscript = transcript;
    const box = document.getElementById('voice-transcript');
    if (box) box.innerHTML = `<strong>Transcript:</strong> "${transcript}"`;
  };

  speechRecognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    stopVoiceRecognition();
    showToast("Voice recognition error: " + event.error, "error");
  };

  speechRecognition.onend = () => {
    isListening = false;
    updateVoiceUI(false);
  };
}

function toggleVoiceRecognition() {
  if (isListening) stopVoiceRecognition();
  else startVoiceRecognition();
}

function startVoiceRecognition() {
  if (!speechRecognition) {
    showToast("Web Speech API is not supported in this browser.", "error");
    return;
  }
  try {
    currentVoiceTranscript = "";
    speechRecognition.start();
  } catch (err) {
    console.warn(err);
  }
}

function stopVoiceRecognition() {
  if (speechRecognition && isListening) speechRecognition.stop();
  isListening = false;
  updateVoiceUI(false);
}

function updateVoiceUI(listening) {
  const btn = document.getElementById('mic-btn');
  const icon = document.getElementById('mic-icon');
  const status = document.getElementById('voice-status');
  const ring1 = document.getElementById('mic-ring-1');
  const ring2 = document.getElementById('mic-ring-2');

  if (listening) {
    if (btn) btn.classList.add('listening');
    if (icon) icon.className = "fa-solid fa-microphone-slash";
    if (status) status.textContent = "◉ LISTENING...";
    if (ring1) ring1.classList.add('pulsing');
    if (ring2) ring2.classList.add('pulsing');
  } else {
    if (btn) btn.classList.remove('listening');
    if (icon) icon.className = "fa-solid fa-microphone";
    if (status) status.textContent = currentVoiceTranscript ? "✓ TRANSCRIPT READY" : "● READY TO LISTEN";
    if (ring1) ring1.classList.remove('pulsing');
    if (ring2) ring2.classList.remove('pulsing');
  }
}

function submitVoicePrompt() {
  if (!currentVoiceTranscript) {
    showToast("Please speak a prompt first!", "error");
    return;
  }
  generateKolamFlow(currentVoiceTranscript, 'voice');
}

// --------------------------------------------------------------------------
// 6. Text Chat Mode
// --------------------------------------------------------------------------
function applySuggestion(text) {
  const textarea = document.getElementById('text-prompt');
  if (textarea) textarea.value = text;
}

function submitTextPrompt() {
  const textarea = document.getElementById('text-prompt');
  if (!textarea || !textarea.value.trim()) {
    showToast("Please enter a prompt first!", "error");
    return;
  }
  
  const prompt = textarea.value.trim();
  appendChatBubble(prompt, 'user');
  textarea.value = '';
  
  generateKolamFlow(prompt, 'text');
}

function appendChatBubble(text, sender) {
  const historyContainer = document.getElementById('chat-history');
  if (!historyContainer) return;
  
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.textContent = text;
  historyContainer.appendChild(bubble);
  historyContainer.scrollTop = historyContainer.scrollHeight;
}

// --------------------------------------------------------------------------
// 7. Upload & Restore Mode (Client-Side Compression)
// --------------------------------------------------------------------------
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) processSelectedImage(file);
}

const dropzone = document.getElementById('restore-dropzone');
if (dropzone) {
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) processSelectedImage(file);
  });
}

function processSelectedImage(file) {
  if (!file.type.startsWith('image/')) {
    showToast("Please select a valid image file.", "error");
    return;
  }

  selectedImageFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1024;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      compressedImageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      const previewImg = document.getElementById('restore-preview-img');
      const previewContainer = document.getElementById('restore-preview-container');
      const submitBtn = document.getElementById('btn-restore-submit');

      if (previewImg) previewImg.src = compressedImageDataUrl;
      if (previewContainer) previewContainer.style.display = 'block';
      if (submitBtn) submitBtn.style.display = 'inline-flex';
      
      showToast("Damaged Kolam image loaded successfully!", "success");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearSelectedImage() {
  selectedImageFile = null;
  compressedImageDataUrl = null;
  const previewContainer = document.getElementById('restore-preview-container');
  const submitBtn = document.getElementById('btn-restore-submit');
  if (previewContainer) previewContainer.style.display = 'none';
  if (submitBtn) submitBtn.style.display = 'none';
}

function submitImageRestoration() {
  if (!compressedImageDataUrl) {
    showToast("Please upload an image first!", "error");
    return;
  }
  restoreKolamFlow(compressedImageDataUrl);
}

// --------------------------------------------------------------------------
// 8. Main API Client & Workflow Orchestration
// --------------------------------------------------------------------------
async function loadFacts() {
  try {
    const res = await fetch('data/kolam-facts.json');
    if (res.ok) {
      kolamFacts = await res.json();
    }
  } catch (err) {
    kolamFacts = [
      { fact: "Kolams are traditionally drawn at dawn using rice flour to feed small birds and insects." },
      { fact: "Dots (Pullis) serve as coordinate reference frames in ethnomathematics." },
      { fact: "Sikku Kolams form single unbroken Eulerian loops that never intersect the dots." },
      { fact: "Kolam designs exhibit 8-way (D4) dihedral symmetry and rotational invariance." }
    ];
  }
}

function startFactsRotator() {
  const textElem = document.getElementById('fact-text');
  if (!textElem || kolamFacts.length === 0) return;
  
  let index = 0;
  textElem.textContent = kolamFacts[index].fact;

  factIntervalTimer = setInterval(() => {
    index = (index + 1) % kolamFacts.length;
    textElem.style.opacity = 0;
    setTimeout(() => {
      textElem.textContent = kolamFacts[index].fact;
      textElem.style.opacity = 1;
    }, 300);
  }, 3500);
}

function stopFactsRotator() {
  if (factIntervalTimer) clearInterval(factIntervalTimer);
}

function showLoadingState(title = "THE PATTERN IS FORMING...") {
  const overlay = document.getElementById('loading-overlay');
  const titleElem = document.getElementById('loading-title');
  const warning = document.getElementById('timeout-warning');

  if (titleElem) titleElem.textContent = title;
  if (warning) warning.style.display = 'none';
  if (overlay) overlay.classList.add('active');

  startFactsRotator();

  loadingTimeoutTimer = setTimeout(() => {
    if (warning) warning.style.display = 'block';
  }, 35000);
}

function hideLoadingState() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('active');
  stopFactsRotator();
  if (loadingTimeoutTimer) clearTimeout(loadingTimeoutTimer);
}

// --- FLOW 1: Voice & Text Mathematical Generation ---
async function generateKolamFlow(promptText, sourceMode = 'text') {
  showLoadingState("SYNTHESIZING GEOMETRY...");
  let resultImageSrc = null;

  // 1. Parse prompt text using Hinglish & number replacements
  let parsedPrompt = promptText.toLowerCase();
  for (const [word, num] of Object.entries(wordToNum)) {
    parsedPrompt = parsedPrompt.replace(new RegExp(`\\b${word}\\b`, "gi"), num.toString());
  }
  
  // 2. Extract Dot Count and Grid Geometry
  let dotCount = 16;
  const dotMatch = parsedPrompt.match(/(\d+)\s*(?:dot|x)/i);
  if (dotMatch) dotCount = parseInt(dotMatch[1]);

  let gridType = "diamond";
  if (parsedPrompt.includes("square") || parsedPrompt.includes("matrix")) {
    gridType = "square";
  }

  // 3. Immediately synthesize the procedural mathematical Kolam
  resultImageSrc = renderAlgorithmicKolamDataUrl(dotCount, gridType);

  if (isBackendOnline && !DEMO_MODE) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: parsedPrompt, dot_count: dotCount, symmetry_type: "D4_Square" })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.image_base64) {
          resultImageSrc = data.image_base64;
        }
      }
      currentPromptHistory.push({ role: 'user', content: promptText });
      appendChatBubble(`Generated ${dotCount}-dot ${gridType} Kolam pattern for: "${promptText}"`, 'ai');
    } catch (err) {
      console.warn("Backend logging skipped, frontend math engine rendered output:", err);
      appendChatBubble(`Constructed ${dotCount}-dot ${gridType} pattern mathematically.`, 'ai');
    }
  } else {
    await new Promise(r => setTimeout(r, 600));
    appendChatBubble(`Constructed ${dotCount}-dot ${gridType} pattern mathematically.`, 'ai');
  }

  hideLoadingState();
  displayGeneratedResult(resultImageSrc, promptText, sourceMode);
}

// --- FLOW 2: Damaged Kolam AI Vision & Reconstruction ---
async function restoreKolamFlow(base64Image) {
  showLoadingState("ANALYZING & RECONSTRUCTING...");
  let restoredImageSrc = null;
  let estimatedDots = 16;

  if (isBackendOnline && !DEMO_MODE) {
    try {
      const blob = dataURItoBlob(base64Image);
      const formData = new FormData();
      formData.append("file", blob, "damaged_kolam.jpg");

      const response = await fetch(`${API_BASE_URL}/api/generate/reconstruct`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      const data = await response.json();
      
      if (data.status === "success") {
        if (data.image_base64) {
          restoredImageSrc = data.image_base64;
        }

        // Extract reconstructed dot count from AI inference logs
        if (data.log) {
          const match = data.log.match(/~(\d+)\s*dots/);
          if (match && match[1]) estimatedDots = parseInt(match[1]);
          appendChatBubble(data.log, 'ai');
        }

        if (!restoredImageSrc) {
          restoredImageSrc = renderAlgorithmicKolamDataUrl(estimatedDots, "diamond");
        }
        showToast("Kolam pattern restored successfully!", "success");
      } else {
        throw new Error("Invalid payload format");
      }
    } catch (err) {
      console.warn("API call failed, generating procedural reconstruction:", err);
      showToast("Offline mode: Pattern mathematically reconstructed.", "info");
      restoredImageSrc = renderAlgorithmicKolamDataUrl(16, "diamond");
      appendChatBubble("Reconstructed damaged pattern with mathematical symmetry.", 'ai');
    }
  } else {
    await new Promise(r => setTimeout(r, 1000));
    restoredImageSrc = renderAlgorithmicKolamDataUrl(16, "diamond");
    appendChatBubble("Reconstructed damaged pattern using procedural symmetry.", 'ai');
  }

  hideLoadingState();
  displayRestorationResult(base64Image, restoredImageSrc);
}

function displayGeneratedResult(imageSrc, promptText, sourceMode = 'text') {
  currentResultImageDataUrl = imageSrc;
  
  const container = document.getElementById('results-visual-container');
  const resultsSection = document.getElementById('section-results');
  const titleText = document.getElementById('results-title-text');
  const metaText = document.getElementById('results-meta-text');

  if (container) {
    container.innerHTML = `<img src="${imageSrc}" alt="Generated Kolam Artwork" class="results-image" id="results-img">`;
  }
  if (titleText) titleText.textContent = "Generated Kolam Pattern";
  if (metaText) metaText.textContent = `Specification: "${promptText}"`;

  renderResultsSignificance(sourceMode, promptText);

  if (resultsSection) {
    resultsSection.classList.add('active');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  showRocketSurprise();
}

function displayRestorationResult(originalImage, restoredImage) {
  currentResultImageDataUrl = restoredImage;

  const container = document.getElementById('results-visual-container');
  const resultsSection = document.getElementById('section-results');
  const titleText = document.getElementById('results-title-text');
  const metaText = document.getElementById('results-meta-text');

  if (container) {
    container.innerHTML = `
      <div class="comparison-slider" id="comparison-slider">
        <img src="${originalImage}" class="before-image" alt="Original Damaged Kolam">
        <img src="${restoredImage}" class="after-image" id="after-img" alt="Restored Kolam">
        <div class="slider-handle" id="slider-handle"></div>
      </div>
    `;
    initComparisonSliderLogic();
  }

  if (titleText) titleText.textContent = "Heritage Restoration Complete";
  if (metaText) metaText.textContent = "Original Damaged Photo vs Reconstructed Geometry (Drag slider to inspect)";

  renderResultsSignificance('restore');

  if (resultsSection) {
    resultsSection.classList.add('active');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  showRocketSurprise();
}

// --------------------------------------------------------------------------
// 8b. Significance & Real-Life Applications Side Box
// --------------------------------------------------------------------------

// Reads grid size / fold count out of a natural-language prompt so the box
// can reference the specific pattern that was just made, when possible.
function buildPatternReading(promptText) {
  if (!promptText) return null;
  const gridMatch = promptText.match(/(\d+)\s*[x×]\s*(\d+)/i);
  const foldMatch = promptText.match(/(\d+)[\s-]*fold/i);
  const bits = [];
  if (gridMatch) bits.push(`a ${gridMatch[1]}×${gridMatch[2]} pulli (dot) grid`);
  if (foldMatch) bits.push(`${foldMatch[1]}-fold rotational symmetry`);
  if (!bits.length) return null;
  return `This design traces ${bits.join(' with ')} — the larger the grid or fold count, the more intricate the unbroken loop becomes.`;
}

function renderResultsSignificance(mode, promptText) {
  const box = document.getElementById('results-significance');
  if (!box) return;

  const shared = [
    {
      icon: 'fa-solid fa-om',
      heading: 'Cultural Significance',
      text: 'Kolams are traditionally drawn by hand at dawn on thresholds across South India using rice flour — a daily ritual believed to invite prosperity, welcome guests, and feed birds and ants before the day begins.'
    },
    {
      icon: 'fa-solid fa-diagram-project',
      heading: 'The Mathematics Behind It',
      text: 'Each pattern is built on a grid of dots (pulli) traced by one continuous, unbroken loop (kambi) — a real-world example of Eulerian paths, rotational/reflective symmetry, and tessellation from graph theory.'
    }
  ];

  const modeSpecific = mode === 'restore'
    ? [
        {
          icon: 'fa-solid fa-landmark',
          heading: 'Why Restoration Matters',
          text: 'Kolams are ephemeral by tradition — swept away and redrawn every morning. Reconstructing damaged or faded photographs helps preserve fading heritage for family archives, researchers, and museums.'
        },
        {
          icon: 'fa-solid fa-people-roof',
          heading: 'Real-Life Uses',
          text: 'Restored patterns support ethnomathematics research, help conservators studying temple murals and textile motifs, and let families digitally preserve designs passed down through generations.'
        }
      ]
    : [
        {
          icon: 'fa-solid fa-palette',
          heading: 'Real-Life Applications',
          text: 'This kind of symmetry-driven geometry inspires generative art & computer graphics, textile and tile pattern design, architectural ornamentation, and logo/branding design.'
        },
        {
          icon: 'fa-solid fa-graduation-cap',
          heading: 'Learning & Wellbeing',
          text: 'Creating Kolams is used to teach symmetry, geometry, and combinatorics in classrooms, and is practiced as a mindful, meditative art form for focus and stress relief.'
        }
      ];

  if (mode === 'voice') {
    modeSpecific.push({
      icon: 'fa-solid fa-microphone-lines',
      heading: 'Voice-to-Geometry',
      text: 'Speech-to-pattern generation makes this art form accessible to visually impaired users and hands-free makers, and mirrors how Kolam knowledge was historically passed down orally between generations.'
    });
  }

  const items = [...shared, ...modeSpecific];
  const reading = mode === 'restore' ? null : buildPatternReading(promptText);

  box.innerHTML = `
    <h4 class="significance-title"><i class="fa-solid fa-circle-info"></i> Significance &amp; Real-World Applications</h4>
    ${reading ? `<p class="significance-reading">${escapeHTML(reading)}</p>` : ''}
    <div class="significance-list">
      ${items.map(it => `
        <div class="significance-item">
          <div class="significance-icon"><i class="${it.icon}"></i></div>
          <div>
            <h5>${escapeHTML(it.heading)}</h5>
            <p>${escapeHTML(it.text)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// --------------------------------------------------------------------------
// Rocket Surprise — playful reveal shown after every Kolam creation
// --------------------------------------------------------------------------
function showRocketSurprise() {
  const modal = document.getElementById('rocket-modal');
  if (!modal) return;
  setTimeout(() => {
    modal.classList.add('active');
  }, 500);
}

function closeRocketModal() {
  const modal = document.getElementById('rocket-modal');
  if (modal) modal.classList.remove('active');
}

// --------------------------------------------------------------------------
// 9. Interactive Split Comparison Drag Slider Logic
// --------------------------------------------------------------------------
function initComparisonSliderLogic() {
  const slider = document.getElementById('comparison-slider');
  const handle = document.getElementById('slider-handle');
  const afterImg = document.getElementById('after-img');

  if (!slider || !handle || !afterImg) return;

  let isDragging = false;

  function updateSlider(x) {
    const rect = slider.getBoundingClientRect();
    let position = (x - rect.left) / rect.width;
    if (position < 0) position = 0;
    if (position > 1) position = 1;

    const percentage = position * 100;
    handle.style.left = `${percentage}%`;
    afterImg.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
  }

  handle.addEventListener('mousedown', () => isDragging = true);
  window.addEventListener('mouseup', () => isDragging = false);
  slider.addEventListener('mousemove', (e) => {
    if (isDragging) updateSlider(e.clientX);
  });

  handle.addEventListener('touchstart', () => isDragging = true);
  window.addEventListener('touchend', () => isDragging = false);
  slider.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches[0]) updateSlider(e.touches[0].clientX);
  });
}

// --------------------------------------------------------------------------
// 10. Mathematical Kolam Generator Engine (Truchet Tile Algorithm)
// --------------------------------------------------------------------------
function renderAlgorithmicKolamDataUrl(totalDots, gridType = "diamond") {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  // 1. Terracotta Foundation Surface
  ctx.fillStyle = "#7A2018"; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Thick White Rice Powder Styling
  ctx.strokeStyle = "#FDFBF7";
  ctx.fillStyle = "#FDFBF7";
  ctx.lineWidth = 5.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = 8;
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";

  ctx.save();

  // 45-degree rotation for diamond orientation
  if (gridType === "diamond") {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 4);
    ctx.scale(0.72, 0.72);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  // Calculate proportional grid matrix dimension
 // Calculate proportional grid matrix dimension
  let tnumber = Math.ceil(Math.sqrt(totalDots * 2));
  if (tnumber < 3) tnumber = 3;
  if (tnumber > 30) tnumber = 30; // Increased limit to support up to ~450 dots

  // Link Matrix with 8-Way Dihedral (D4) Symmetry
  let nlink = [];
  for (let i = 0; i < (tnumber + 1); i++) {
    let row = [];
    for (let j = 0; j < (tnumber + 1); j++) row.push(1);
    nlink.push(row);
  }

  let limit = 0.52; 
  for (let i = 0; i < nlink.length; i++) {
    for (let j = 0; j < nlink.length / 2; j++) {
      let l = Math.random() > limit ? 1 : 0;
      nlink[i][j] = l;
      nlink[i][nlink.length - j - 1] = l;
      nlink[j][i] = l;
      nlink[nlink.length - j - 1][i] = l;
      nlink[nlink.length - 1 - i][j] = l;
      nlink[nlink.length - 1 - i][nlink.length - j - 1] = l;
      nlink[j][nlink.length - 1 - i] = l;
      nlink[nlink.length - 1 - j][nlink.length - 1 - i] = l;
    }
  }

  const margin = 70;
  const tsize = (canvas.width - (margin * 2)) / tnumber;

  // Render Interlocking Tiles & Center Pulli Dots
  for (let i = 0; i < tnumber; i++) {
    for (let j = 0; j < tnumber; j++) {
      if ((i + j) % 2 === 0) { 
        let tl = (tsize / 2) * nlink[i][j];
        let tr = (tsize / 2) * nlink[i + 1][j];
        let br = (tsize / 2) * nlink[i + 1][j + 1];
        let bl = (tsize / 2) * nlink[i][j + 1];

        let x = margin + i * tsize;
        let y = margin + j * tsize;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, tsize, tsize, [tl, tr, br, bl]);
        } else {
          ctx.rect(x, y, tsize, tsize);
        }
        ctx.stroke();

        // Pulli Dot
        ctx.beginPath();
        ctx.arc(x + tsize / 2, y + tsize / 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();

  // Subtle traditional border line
  ctx.strokeStyle = "rgba(253, 251, 247, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  return canvas.toDataURL('image/png');
}

// --------------------------------------------------------------------------
// 11. Community Wall — "Kolam of the Day"
// --------------------------------------------------------------------------
function generateKolamSVG({ folds = 6, dotRings = 3, petalCurve = 55, color1 = '#C85A32', color2 = '#6B1D2F', color3 = '#D4AF37', bg = '#F5EFE6' } = {}) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;

  let dots = '';
  for (let ring = 1; ring <= dotRings; ring++) {
    const r = ring * (size * 0.15);
    const count = ring * 6;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const x = (cx + Math.cos(angle) * r).toFixed(1);
      const y = (cy + Math.sin(angle) * r).toFixed(1);
      dots += `<circle cx="${x}" cy="${y}" r="2.4" fill="${color2}" />`;
    }
  }

  let petals = '';
  for (let f = 0; f < folds; f++) {
    const angle = (360 / folds) * f;
    petals += `<g transform="rotate(${angle} ${cx} ${cy})">
      <path d="M ${cx} ${cy} Q ${cx + petalCurve} ${cy - petalCurve * 0.9} ${cx + petalCurve * 1.5} ${cy} Q ${cx + petalCurve} ${cy + petalCurve * 0.9} ${cx} ${cy}" fill="none" stroke="${color1}" stroke-width="3" />
      <circle cx="${(cx + petalCurve * 1.4).toFixed(1)}" cy="${cy}" r="4" fill="${color3}" />
    </g>`;
  }

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="kolam-generated-svg">
    <rect width="${size}" height="${size}" fill="${bg}" />
    <circle cx="${cx}" cy="${cy}" r="${size * 0.44}" fill="none" stroke="${color1}" stroke-width="2" stroke-dasharray="4 5" />
    ${dots}
    ${petals}
    <circle cx="${cx}" cy="${cy}" r="6" fill="${color1}" />
  </svg>`;
}

const KOLAM_SAMPLES = [
  { id: 'sample-1', title: 'Lotus Bloom Kolam', author: 'Meena R.', caption: 'Drawn fresh this morning with rice flour — 6-fold lotus symmetry.', svg: generateKolamSVG({ folds: 6, dotRings: 3, petalCurve: 55 }) },
  { id: 'sample-2', title: '8-Fold Mandala', author: 'Priya K.', caption: 'My grandmother taught me this mandala style Kolam.', svg: generateKolamSVG({ folds: 8, dotRings: 2, petalCurve: 45, color1: '#6B1D2F', color3: '#C85A32' }) },
  { id: 'sample-3', title: 'Classic Pulli Grid', author: 'Lakshmi S.', caption: 'A traditional grid style Kolam, simple and elegant.', svg: generateKolamSVG({ folds: 4, dotRings: 4, petalCurve: 65 }) },
  { id: 'sample-4', title: 'Sunburst Sikku Loop', author: 'Anitha V.', caption: 'Continuous loop, no lifted hand — a proper Sikku Kolam!', svg: generateKolamSVG({ folds: 12, dotRings: 2, petalCurve: 35, color1: '#D4AF37', color3: '#6B1D2F' }) },
  { id: 'sample-5', title: 'Five-Fold Star Kolam', author: 'Divya N.', caption: 'Festival special design for this Pongal.', svg: generateKolamSVG({ folds: 5, dotRings: 3, petalCurve: 50 }) },
  { id: 'sample-6', title: 'Emerald Chikku Kolam', author: 'Radha M.', caption: 'A cooler palette today — inspired by the temple pond lotuses near home.', svg: generateKolamSVG({ folds: 10, dotRings: 3, petalCurve: 42, color1: '#3F6B4A', color2: '#6B1D2F', color3: '#D4AF37' }) },
  { id: 'sample-7', title: 'Three-Ring Pongal Kolam', author: 'Kavitha J.', caption: 'Kept it minimal this year — three rings for prosperity, health, and harvest.', svg: generateKolamSVG({ folds: 3, dotRings: 3, petalCurve: 70, color1: '#C85A32', color3: '#6B1D2F' }) },
  { id: 'sample-8', title: 'Indigo Rangoli Wheel', author: 'Sundari P.', caption: 'Tried a deep indigo accent alongside the usual terracotta — happy with how it turned out!', svg: generateKolamSVG({ folds: 16, dotRings: 2, petalCurve: 30, color1: '#2E4374', color3: '#D4AF37' }) },
  { id: 'sample-9', title: 'Nine-Petal Navaratri Kolam', author: 'Geetha R.', caption: 'One petal for each night of Navaratri — a family tradition.', svg: generateKolamSVG({ folds: 9, dotRings: 4, petalCurve: 48, color1: '#6B1D2F', color3: '#C85A32' }) },
  { id: 'sample-10', title: 'Twin-Ring Courtyard Kolam', author: 'Bhavani T.', caption: 'Simple twin-ring design my mother drew every single morning.', svg: generateKolamSVG({ folds: 7, dotRings: 2, petalCurve: 58, color1: '#D4AF37', color2: '#3C1F1A', color3: '#C85A32' }) },
  { id: 'sample-11', title: 'Marigold Mandala Kolam', author: 'Yamuna S.', caption: 'Marigold-orange palette for the harvest festival — 14-fold radial symmetry.', svg: generateKolamSVG({ folds: 14, dotRings: 3, petalCurve: 38, color1: '#E08423', color3: '#6B1D2F' }) }
];

const KOLAM_SAMPLE_BASE_LIKES = {
  'sample-1': 24, 'sample-2': 41, 'sample-3': 17, 'sample-4': 33, 'sample-5': 29,
  'sample-6': 19, 'sample-7': 22, 'sample-8': 37, 'sample-9': 26, 'sample-10': 15, 'sample-11': 31
};

// Seed comments so the Kolam of the Day and Community Wall don't open empty —
// visitors can still add their own on top of these starter conversations.
const KOLAM_SAMPLE_SEED_COMMENTS = {
  'sample-1': [
    { author: 'Kavya S.', text: 'The lotus symmetry on this is so clean — beautiful work!' },
    { author: 'Arjun P.', text: 'Rice flour patterns always look best in morning light.' }
  ],
  'sample-2': [
    { author: 'Ramesh N.', text: 'This mandala style reminds me of the ones near my grandmother\'s house.' },
    { author: 'Sowmya K.', text: 'Love the maroon and terracotta combo here.' }
  ],
  'sample-3': [
    { author: 'Divya M.', text: 'Simple and elegant — perfect for everyday practice.' }
  ],
  'sample-4': [
    { author: 'Harini V.', text: 'A true unbroken Sikku loop, that takes real practice!' },
    { author: 'Vikram T.', text: 'The sunburst colors really make this one pop.' }
  ],
  'sample-5': [
    { author: 'Meera D.', text: 'Perfect festival design — saving this for next Pongal.' }
  ],
  'sample-6': [
    { author: 'Anand R.', text: 'The green accent is such a refreshing change from the usual palette.' }
  ],
  'sample-7': [
    { author: 'Priyanka L.', text: 'Minimal but still full of meaning — love the three rings.' },
    { author: 'Suresh B.', text: 'Clean lines, great for beginners to learn from.' }
  ],
  'sample-8': [
    { author: 'Nithya G.', text: 'Indigo and gold together look regal!' }
  ],
  'sample-9': [
    { author: 'Kalyani R.', text: 'Nine petals for nine nights — such a lovely tradition to keep.' }
  ],
  'sample-10': [
    { author: 'Deepa S.', text: 'Reminds me of the one my mother used to draw at our doorstep.' }
  ],
  'sample-11': [
    { author: 'Rajesh K.', text: 'That marigold orange is perfect for harvest season.' },
    { author: 'Lavanya P.', text: '14-fold symmetry drawn freehand — impressive!' }
  ]
};

function getCommunityState() {
  let state = JSON.parse(localStorage.getItem(COMMUNITY_STORAGE_KEY) || 'null');
  if (!state) {
    state = { likes: {}, comments: {}, userPosts: [] };
    KOLAM_SAMPLES.forEach(s => {
      state.likes[s.id] = { count: KOLAM_SAMPLE_BASE_LIKES[s.id] || 15, liked: false };
      state.comments[s.id] = (KOLAM_SAMPLE_SEED_COMMENTS[s.id] || []).slice();
    });
    saveCommunityState(state);
  } else {
    // Migrate any newly added samples into an existing saved state so
    // returning visitors also see the new Kolam art and its comments.
    let changed = false;
    KOLAM_SAMPLES.forEach(s => {
      if (!state.likes[s.id]) {
        state.likes[s.id] = { count: KOLAM_SAMPLE_BASE_LIKES[s.id] || 15, liked: false };
        changed = true;
      }
      if (!state.comments[s.id]) {
        state.comments[s.id] = (KOLAM_SAMPLE_SEED_COMMENTS[s.id] || []).slice();
        changed = true;
      }
    });
    if (changed) saveCommunityState(state);
  }
  return state;
}

function saveCommunityState(state) {
  localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(state));
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function getKolamOfTheDay() {
  const dayIndex = Math.floor(Date.now() / 86400000) % KOLAM_SAMPLES.length;
  return KOLAM_SAMPLES[dayIndex];
}

function initCommunity() {
  renderKolamOfTheDay();
  renderCommunityFeed();
  setupCommunityDropzone();
}

function renderKolamOfTheDay() {
  const container = document.getElementById('kotd-hero');
  if (!container) return;

  const featured = getKolamOfTheDay();
  const state = getCommunityState();
  const likeData = state.likes[featured.id] || { count: 0, liked: false };
  const commentCount = (state.comments[featured.id] || []).length;
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  container.innerHTML = `
    <div class="kotd-badge"><i class="fa-solid fa-star"></i> Today's Pick — ${dateStr}</div>
    <div class="kotd-card">
      <div class="post-image-frame kotd-image-frame">${featured.svg}</div>
      <div class="post-body kotd-info">
        <h3>${escapeHTML(featured.title)}</h3>
        <p class="post-author"><i class="fa-solid fa-user"></i> ${escapeHTML(featured.author)}</p>
        <p class="post-caption">${escapeHTML(featured.caption)}</p>
        <div class="post-actions">
          <button class="like-btn ${likeData.liked ? 'liked' : ''}" onclick="toggleLike('${featured.id}')" id="like-btn-${featured.id}">
            <i class="fa-solid fa-heart"></i> <span id="like-count-${featured.id}">${likeData.count}</span>
          </button>
          <button class="comment-toggle-btn" onclick="toggleComments('${featured.id}')">
            <i class="fa-solid fa-comment"></i> <span id="comment-count-${featured.id}">${commentCount}</span>
          </button>
        </div>
        <div class="post-comments" id="comments-${featured.id}"></div>
      </div>
    </div>
  `;
}

function buildPostCard(post, isUserPost) {
  const state = getCommunityState();
  const likeData = state.likes[post.id] || { count: 0, liked: false };
  const commentCount = (state.comments[post.id] || []).length;
  const imageContent = isUserPost
    ? `<img src="${post.image}" alt="${escapeHTML(post.title)}" class="post-uploaded-img">`
    : post.svg;

  return `
    <div class="community-post-card">
      <div class="post-image-frame">${imageContent}</div>
      <div class="post-body">
        <p class="post-author"><i class="fa-solid fa-user"></i> ${escapeHTML(post.author)} <span class="post-date">• ${escapeHTML(post.date || 'Today')}</span></p>
        ${post.caption ? `<p class="post-caption">${escapeHTML(post.caption)}</p>` : ''}
        <div class="post-actions">
          <button class="like-btn ${likeData.liked ? 'liked' : ''}" onclick="toggleLike('${post.id}')" id="like-btn-${post.id}">
            <i class="fa-solid fa-heart"></i> <span id="like-count-${post.id}">${likeData.count}</span>
          </button>
          <button class="comment-toggle-btn" onclick="toggleComments('${post.id}')">
            <i class="fa-solid fa-comment"></i> <span id="comment-count-${post.id}">${commentCount}</span>
          </button>
        </div>
        <div class="post-comments" id="comments-${post.id}"></div>
      </div>
    </div>
  `;
}

function renderCommunityFeed() {
  const feedEl = document.getElementById('community-feed');
  if (!feedEl) return;

  const featuredId = getKolamOfTheDay().id;
  const state = getCommunityState();

  const userPostsHTML = state.userPosts.map(p => buildPostCard(p, true)).join('');
  const sampleHTML = KOLAM_SAMPLES.filter(s => s.id !== featuredId).map(s => buildPostCard(s, false)).join('');

  feedEl.innerHTML = userPostsHTML + sampleHTML || '<p style="color: var(--text-muted);">No posts yet.</p>';
}

function toggleLike(postId) {
  const state = getCommunityState();
  if (!state.likes[postId]) state.likes[postId] = { count: 0, liked: false };

  const data = state.likes[postId];
  data.liked = !data.liked;
  data.count += data.liked ? 1 : -1;
  saveCommunityState(state);

  const btn = document.getElementById(`like-btn-${postId}`);
  const countEl = document.getElementById(`like-count-${postId}`);
  if (btn) btn.classList.toggle('liked', data.liked);
  if (countEl) countEl.textContent = data.count;
}

function toggleComments(postId) {
  const panel = document.getElementById(`comments-${postId}`);
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  if (isOpen) renderCommentPanel(postId);
}

function renderCommentPanel(postId) {
  const panel = document.getElementById(`comments-${postId}`);
  if (!panel) return;

  const state = getCommunityState();
  const comments = state.comments[postId] || [];

  panel.innerHTML = `
    <div class="comment-list">
      ${comments.length === 0
        ? '<p class="no-comments">No comments yet. Be the first!</p>'
        : comments.map(c => `<div class="comment-item"><strong>${escapeHTML(c.author)}:</strong> ${escapeHTML(c.text)}</div>`).join('')}
    </div>
    <div class="comment-input-row">
      <input type="text" class="comment-input" id="comment-input-${postId}" placeholder="Add a comment..." onkeydown="if(event.key==='Enter') addComment('${postId}')">
      <button class="btn-secondary comment-send-btn" onclick="addComment('${postId}')"><i class="fa-solid fa-paper-plane"></i></button>
    </div>
  `;
}

function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  if (!input || !input.value.trim()) return;

  const state = getCommunityState();
  if (!state.comments[postId]) state.comments[postId] = [];
  state.comments[postId].push({ author: 'You', text: input.value.trim() });
  saveCommunityState(state);

  input.value = '';
  renderCommentPanel(postId);

  const countEl = document.getElementById(`comment-count-${postId}`);
  if (countEl) countEl.textContent = state.comments[postId].length;

  showToast('Comment added!', 'success');
}

function setupCommunityDropzone() {
  const dropzone = document.getElementById('community-dropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) processCommunityImage(file);
  });
}

function handleCommunityFileSelect(event) {
  const file = event.target.files[0];
  if (file) processCommunityImage(file);
}

function processCommunityImage(file) {
  if (!file.type.startsWith('image/')) {
    showToast("Please select a valid image file.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 800;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      communitySelectedImageDataUrl = canvas.toDataURL('image/jpeg', 0.75);

      const previewImg = document.getElementById('community-preview-img');
      const previewContainer = document.getElementById('community-preview-container');
      const submitBtn = document.getElementById('btn-community-submit');

      if (previewImg) previewImg.src = communitySelectedImageDataUrl;
      if (previewContainer) previewContainer.style.display = 'block';
      if (submitBtn) submitBtn.style.display = 'inline-flex';

      showToast("Image ready to share!", "success");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearCommunitySelectedImage() {
  communitySelectedImageDataUrl = null;
  const previewContainer = document.getElementById('community-preview-container');
  const submitBtn = document.getElementById('btn-community-submit');
  const fileInput = document.getElementById('community-file-input');
  if (previewContainer) previewContainer.style.display = 'none';
  if (submitBtn) submitBtn.style.display = 'none';
  if (fileInput) fileInput.value = '';
}

function submitCommunityPost() {
  if (!communitySelectedImageDataUrl) {
    showToast("Please select an image to share!", "error");
    return;
  }

  const captionInput = document.getElementById('community-caption');
  const caption = captionInput ? captionInput.value.trim() : '';

  const newPost = {
    id: `user-${Date.now()}`,
    title: 'Community Kolam',
    author: 'You',
    caption: caption,
    image: communitySelectedImageDataUrl,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  };

  const state = getCommunityState();
  state.userPosts.unshift(newPost);
  state.likes[newPost.id] = { count: 0, liked: false };
  state.comments[newPost.id] = [];
  saveCommunityState(state);

  clearCommunitySelectedImage();
  if (captionInput) captionInput.value = '';

  renderCommunityFeed();
  showToast("Your Kolam has been shared with the community!", "success");
}

// --------------------------------------------------------------------------
// 12. Utilities: Toast, Downloads & Local Storage Gallery
// --------------------------------------------------------------------------
function showToast(message, type = "info") {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function downloadCurrentResult() {
  if (!currentResultImageDataUrl) {
    showToast("No generated pattern to download yet!", "error");
    return;
  }

  const link = document.createElement('a');
  link.download = 'kolam-pattern.png';
  link.href = currentResultImageDataUrl;
  link.click();
  showToast("Downloading Kolam pattern...", "success");
}

function saveCurrentToGallery() {
  if (!currentResultImageDataUrl) {
    showToast("No pattern available to save!", "error");
    return;
  }

  let gallery = JSON.parse(localStorage.getItem('kolam_gallery') || '[]');
  gallery.push({
    image: currentResultImageDataUrl,
    timestamp: new Date().toLocaleDateString()
  });

  localStorage.setItem('kolam_gallery', JSON.stringify(gallery));
  showToast("Saved to Local Gallery!", "success");
}

function openGalleryModal() {
  const modal = document.getElementById('gallery-modal');
  const grid = document.getElementById('gallery-grid');

  if (!modal || !grid) return;

  let gallery = JSON.parse(localStorage.getItem('kolam_gallery') || '[]');

  if (gallery.length === 0) {
    grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">No saved patterns yet. Generate or restore a Kolam to save it here!</p>`;
  } else {
    grid.innerHTML = gallery.map(item => `
      <div class="gallery-item">
        <img src="${item.image}" alt="Saved Kolam">
        <p style="padding: 8px; font-size: 0.8rem; color: var(--text-muted); text-align: center;">${item.timestamp}</p>
      </div>
    `).join('');
  }

  modal.classList.add('active');
}

function closeGalleryModal() {
  const modal = document.getElementById('gallery-modal');
  if (modal) modal.classList.remove('active');
}

function retryLastOperation() {
  hideLoadingState();
  showToast("Retrying generation...", "info");
}

// --------------------------------------------------------------------------
// 15. Unique UI Interactions: Magnetic Grid & Scroll Effects
// --------------------------------------------------------------------------
function initMagneticGrid(canvasId = 'magnetic-canvas', containerSelector = '.kolam-nodes-container', dotColor = '#C85A32') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let dots = [];
  const spacing = 40; 
  let mouse = { x: -1000, y: -1000 };

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    createGrid();
  }

  function createGrid() {
    dots = [];
    const cols = Math.floor(canvas.width / spacing);
    const rows = Math.floor(canvas.height / spacing);
    
    const offsetX = (canvas.width - cols * spacing) / 2;
    const offsetY = (canvas.height - rows * spacing) / 2;

    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        dots.push({
          baseX: offsetX + i * spacing,
          baseY: offsetY + j * spacing,
          x: offsetX + i * spacing,
          y: offsetY + j * spacing,
        });
      }
    }
  }

  window.addEventListener('resize', resize);
  
  const container = document.querySelector(containerSelector);
  if(container) {
      container.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });

      container.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
      });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = dotColor; 

    for (let i = 0; i < dots.length; i++) {
      let dot = dots[i];
      
      let dx = mouse.x - dot.baseX;
      let dy = mouse.y - dot.baseY;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      let pullRadius = 120;
      
      if (distance < pullRadius) {
        let force = (pullRadius - distance) / pullRadius;
        dot.x = dot.baseX + (dx * force * 0.4);
        dot.y = dot.baseY + (dy * force * 0.4);
      } else {
        dot.x += (dot.baseX - dot.x) * 0.1;
        dot.y += (dot.baseY - dot.y) * 0.1;
      }

      ctx.beginPath();
      let radius = distance < pullRadius ? 3 : 1.5;
      ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(animate);
  }

  resize();
  animate();
}

function initScrollEffects() {
  const svgBg = document.querySelector('.nodes-svg-bg');
  if (!svgBg) return;

  window.addEventListener('scroll', () => {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    const rotation = scrollPercent * 90;
    const scale = 1 + (scrollPercent * 0.2);

    svgBg.style.transform = `rotate(${rotation}deg) scale(${scale})`;
  });
}
