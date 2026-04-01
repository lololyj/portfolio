/* ===================================================
   Yoonjae Lee Portfolio — script.js
   =================================================== */

/* ── IndexedDB ── */
const IDB_NAME = 'yj-portfolio';
const IDB_STORE = 'projects';

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE))
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGetAll() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/* ── Default projects (shown when localStorage is empty) ── */
const DEFAULT_PROJECTS = [
  {
    id: 'default-1',
    title: '스마트 장바구니 UX 개선',
    year: '2025',
    role: 'UX Research / Flow Design / Prototype',
    tools: 'Figma, FigJam',
    tags: ['UX', 'UI', 'Prototype'],
    summary: '장바구니 이탈 원인을 정리하고, 결제 전 확신 요소를 강화한 리디자인입니다. 이탈 지점 식별, 핵심 혜택 카드 구조화, 단계별 피드백을 통해 전환율을 개선했습니다.',
    accent: '#7c3aed',
    accent2: '#22c55e',
    thumbnail: null,
    slides: []
  },
  {
    id: 'default-2',
    title: '모바일 결제 UI 컴포넌트',
    year: '2025',
    role: 'Design System / Component Design',
    tools: 'Figma',
    tags: ['UI', 'Design System'],
    summary: '결제 화면에서 반복되는 UI 패턴을 컴포넌트로 정리해 일관성을 높인 프로젝트입니다. 컬러/타이포 스케일 정리, 상태 표준화, 토큰 기반 확장을 구현했습니다.',
    accent: '#2563eb',
    accent2: '#06b6d4',
    thumbnail: null,
    slides: []
  },
  {
    id: 'default-3',
    title: '헬스케어 앱 온보딩 리디자인',
    year: '2024',
    role: 'Onboarding UX / Prototype',
    tools: 'Figma, FigJam',
    tags: ['UX', 'Prototype'],
    summary: '신규 사용자의 첫 주 이탈을 줄이기 위한 온보딩 흐름과 커뮤니케이션을 재구성했습니다. 목표 선택 2단계 단순화, 기대값 명확화, 마이크로카피 정교화.',
    accent: '#f97316',
    accent2: '#ec4899',
    thumbnail: null,
    slides: []
  },
  {
    id: 'default-4',
    title: '예약 서비스 정보 구조 재설계',
    year: '2024',
    role: 'IA / Screen Design',
    tools: 'Figma',
    tags: ['UX', 'UI'],
    summary: '복잡한 옵션을 이해하기 쉽게 재정렬하고, 검색-선택-확정의 흐름을 최적화했습니다. 필터 용어 표준화, 옵션 그룹 시각화, 예외 케이스 UX 보강.',
    accent: '#10b981',
    accent2: '#3b82f6',
    thumbnail: null,
    slides: []
  },
  {
    id: 'default-5',
    title: '교육 플랫폼 프로토타입',
    year: '2023',
    role: 'Prototype / UI Design',
    tools: 'Figma',
    tags: ['UI', 'Prototype'],
    summary: '학습 목표 기반 경로를 보여주는 대시보드 UX와 인터랙션을 설계한 프로젝트입니다. 경로 시각화, 진행률 의미 재정의, 핵심 기능 위주 스크린 설계.',
    accent: '#1d4ed8',
    accent2: '#22c55e',
    thumbnail: null,
    slides: []
  },
  {
    id: 'default-6',
    title: '커뮤니티 대시보드 리디자인',
    year: '2023',
    role: 'UX/UI / Component Design',
    tools: 'Figma, FigJam',
    tags: ['UX', 'UI', 'Design System'],
    summary: '정보 밀도가 높은 화면에서 우선순위를 명확히 보여주도록 레이아웃과 컴포넌트를 재정리했습니다. 카드 기반 우선순위 모델, 필터 가시성 개선.',
    accent: '#8b5cf6',
    accent2: '#f59e0b',
    thumbnail: null,
    slides: []
  }
];

/* ── Load projects from folder structure ── */
async function loadProjects() {
  // 1) Try folder-based structure: projects/index.json + projects/{folder}/meta.json
  try {
    const idxRes = await fetch('projects/index.json', { cache: 'no-cache' });
    if (idxRes.ok) {
      const folders = await idxRes.json();
      const metas = await Promise.all(
        folders.map(async folder => {
          try {
            const metaRes = await fetch(`projects/${folder}/meta.json`, { cache: 'no-cache' });
            if (!metaRes.ok) return null;
            const meta = await metaRes.json();
            return { ...meta, _folder: folder, id: folder };
          } catch { return null; }
        })
      );
      const valid = metas.filter(Boolean);
      if (valid.length > 0) return valid;
    }
  } catch { /* fall through */ }

  // 2) Fall back to IndexedDB (admin panel edits)
  try {
    const stored = await idbGetAll();
    if (Array.isArray(stored) && stored.length > 0) return stored;
  } catch { /* fall through */ }

  // 3) Default placeholder projects
  return DEFAULT_PROJECTS;
}

/* ── Resolve image path ── */
function projImgUrl(proj, filename) {
  if (!filename) return null;
  if (proj._folder) return `projects/${proj._folder}/${filename}`;
  return filename; // base64 or absolute URL (IndexedDB path)
}

/* ── Render project cards into horizontal track ── */
async function renderProjectCards() {
  const track = document.getElementById('hScrollTrack');
  if (!track) return;
  const projects = await loadProjects();

  /* update Projects stat counter dynamically */
  const projStatEl = document.querySelector('.hero-stats .stat-n[data-count]');
  if (projStatEl) projStatEl.dataset.count = projects.length;

  track.innerHTML = projects.map(p => {
    const thumbUrl = projImgUrl(p, p.thumbnail);
    const thumbHtml = thumbUrl
      ? `<div class="proj-thumb-wrap"><img src="${thumbUrl}" alt="${p.title}" loading="lazy"></div>`
      : `<div class="proj-thumb-wrap"><div class="proj-thumb-placeholder" style="--c1:${p.accent};--c2:${p.accent2 || '#06b6d4'}"></div></div>`;
    const tagsHtml = (p.tags || []).map(t => `<span class="proj-tag">${t}</span>`).join('');
    return `
      <article class="proj-card" data-id="${p.id}">
        ${thumbHtml}
        <div class="proj-body">
          <div class="proj-tags">${tagsHtml}</div>
          <h3 class="proj-title">${p.title}</h3>
          <p class="proj-desc">${(p.summary || '').substring(0, 80)}…</p>
          <div class="proj-footer">
            <span class="proj-year">${p.year}</span>
            <div class="proj-arrow">→</div>
          </div>
        </div>
      </article>`;
  }).join('');

  /* click → open modal */
  track.querySelectorAll('.proj-card').forEach(card => {
    card.addEventListener('click', () => {
      const proj = projects.find(p => p.id === card.dataset.id);
      if (proj) openProjectModal(proj);
    });
  });
}

/* ── Project Modal ── */
function openProjectModal(proj) {
  let overlay = document.getElementById('projModal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'projModal';
    overlay.className = 'proj-modal-overlay';
    document.body.appendChild(overlay);
  }

  const thumbUrl = projImgUrl(proj, proj.thumbnail);
  const demoBtn = proj.demoLink
    ? `<a class="demo-link-btn" href="${proj.demoLink}" target="_blank" rel="noopener">🔗 프로토타입 보기</a>`
    : '';
  const thumbHtml = thumbUrl
    ? `<div class="modal-thumb">${demoBtn}<img src="${thumbUrl}" alt="${proj.title}"></div>`
    : `<div class="modal-thumb-placeholder" style="--mc1:${proj.accent};--mc2:${proj.accent2 || '#06b6d4'}"></div>`;

  const tagsHtml = (proj.tags || []).map(t => `<span class="proj-tag">${t}</span>`).join('');

  const vimeoHtml = proj.vimeo
    ? (() => {
        const id = proj.vimeo.match(/vimeo\.com\/(\d+)/)?.[1];
        return id
          ? `<div class="vimeo-wrap"><iframe src="https://player.vimeo.com/video/${id}?color=C8FF00&title=0&byline=0&portrait=0" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`
          : '';
      })()
    : '';

  const slideUrls = (proj.slides || []).map(s => projImgUrl(proj, s));
  const slidesHtml = slideUrls.length > 0
    ? `<div class="slides-title">Project Slides (${slideUrls.length})</div>
       <div class="slides-list">${(proj.slides || []).map((s, i) => {
         const url = projImgUrl(proj, s);
         const link = proj.slideLinks?.[s];
         const btn = link ? `<a class="demo-link-btn slide-demo-btn" href="${link}" target="_blank" rel="noopener">🔗 프로토타입 보기</a>` : '';
         return link
           ? `<div class="slide-img-wrap">${btn}<img class="slide-img" src="${url}" alt="Slide ${i+1}" loading="lazy"></div>`
           : `<img class="slide-img" src="${url}" alt="Slide ${i+1}" loading="lazy">`;
       }).join('')}</div>`
    : '';

  overlay.innerHTML = `
    <button class="proj-modal-close" id="modalCloseBtn">×</button>
    <div class="proj-modal-inner">
      ${thumbHtml}
      <div class="modal-tags">${tagsHtml}</div>
      <h2 class="modal-title">${proj.title}</h2>
      <p class="modal-summary">${proj.summary || ''}</p>
      <div class="modal-meta-grid">
        <div class="modal-meta-cell"><span class="meta-label">Year</span><span class="meta-val">${proj.year}</span></div>
        <div class="modal-meta-cell"><span class="meta-label">Role</span><span class="meta-val">${proj.role}</span></div>
        <div class="modal-meta-cell"><span class="meta-label">Tools</span><span class="meta-val">${proj.tools}</span></div>
      </div>
      ${proj.videoPosition === 'bottom' ? slidesHtml + vimeoHtml : vimeoHtml + slidesHtml}
    </div>`;

  requestAnimationFrame(() => overlay.classList.add('open'));
  document.body.style.overflow = 'hidden';

  overlay.querySelector('#modalCloseBtn').addEventListener('click', closeProjectModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeProjectModal(); });
  document.addEventListener('keydown', escClose);
}

function closeProjectModal() {
  const overlay = document.getElementById('projModal');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', escClose);
}

function escClose(e) {
  if (e.key === 'Escape') closeProjectModal();
}

/* ============================================================
   CURSOR
   ============================================================ */
function initCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let rx = 0, ry = 0, dx = 0, dy = 0;

  document.addEventListener('mousemove', e => { dx = e.clientX; dy = e.clientY; });
  document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
  document.addEventListener('mouseup', () => document.body.classList.remove('cursor-click'));

  function updateHoverables() {
    document.querySelectorAll('a, button, [data-magnetic], .proj-card').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }
  updateHoverables();

  function loop() {
    rx += (dx - rx) * 0.1;
    ry += (dy - ry) * 0.1;
    dot.style.left = dx + 'px';
    dot.style.top  = dy + 'px';
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(loop);
  }
  loop();
}

/* ============================================================
   THREE.JS HERO PARTICLES
   ============================================================ */
function initThreeJS() {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 4;

  /* Particles */
  const COUNT = 1000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    speeds[i] = 0.2 + Math.random() * 0.8;

    /* mostly lime, some white */
    if (Math.random() > 0.35) {
      colors[i * 3] = 0.784; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 0;
    } else {
      const b = 0.4 + Math.random() * 0.6;
      colors[i * 3] = b; colors[i * 3 + 1] = b; colors[i * 3 + 2] = b;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({ size: 0.018, vertexColors: true, transparent: true, opacity: 0.45 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    points.rotation.y = t * 0.04;
    points.rotation.x = t * 0.015;
    camera.position.x += (mx * 0.3 - camera.position.x) * 0.04;
    camera.position.y += (my * 0.3 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
}

/* ============================================================
   LOADER + HERO REVEAL
   ============================================================ */
function initLoader() {
  const loader = document.getElementById('loader');
  const logo = loader?.querySelector('.loader-logo');
  const bar = document.getElementById('loaderBar');
  if (!loader || !logo || !bar) return;

  /* logo fade-in */
  gsap.to(logo, { opacity: 1, duration: 0.5, ease: 'power2.out' });

  /* progress bar */
  gsap.to(bar, {
    width: '100%',
    duration: 1.6,
    ease: 'power2.inOut',
    onComplete: () => {
      /* slide loader up */
      gsap.to(loader, {
        yPercent: -100,
        duration: 0.9,
        ease: 'power3.inOut',
        onComplete: () => {
          loader.style.display = 'none';
          heroReveal();
        }
      });
    }
  });
}

function heroReveal() {
  const tl = gsap.timeline();
  tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
    .to('.line-inner', { clipPath: 'inset(0% 0 -50% 0)', duration: 0.9, stagger: 0.1, ease: 'power4.out' }, '-=0.3')
    .to('.hero-tagline', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
    .to('.tagline-line', { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power3.out' }, '-=0.4')
    .to('.hero-actions', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
    .to('.hero-stats', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
    .to('.hero-scroll-hint', { opacity: 1, duration: 0.6 }, '-=0.2');

  /* counter */
  document.querySelectorAll('.stat-n').forEach(el => {
    const target = parseInt(el.dataset.count);
    gsap.to({ n: 0 }, {
      n: target,
      duration: 1.5,
      delay: 1.2,
      ease: 'power2.out',
      onUpdate() { el.textContent = Math.round(this.targets()[0].n); }
    });
  });
}

/* ============================================================
   NAV SCROLL BEHAVIOR
   ============================================================ */
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ============================================================
   HORIZONTAL SCROLL (GSAP ScrollTrigger)
   ============================================================ */
function initHorizontalScroll() {
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* 카드 개별 스크롤 reveal */
  document.querySelectorAll('.proj-card').forEach((card, i) => {
    const isOffset = (i % 3) === 1; // 각 행의 2번째 카드
    gsap.from(card, {
      opacity: 0,
      y: isOffset ? 80 : 50,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        toggleActions: 'play none none none'
      },
      delay: (i % 3) * 0.08
    });
  });
}

/* ============================================================
   ABOUT / BENTO ANIMATIONS (Intersection Observer)
   ============================================================ */
function initBentoAnimations() {
  const cells = document.querySelectorAll('.bento-cell');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = Array.from(cells).indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
          /* skill bars */
          entry.target.querySelectorAll('.sbar-fill').forEach(fill => {
            fill.style.width = fill.style.getPropertyValue('--w');
          });
        }, idx * 80);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  cells.forEach(c => io.observe(c));

  /* contact title */
  const contactH2 = document.querySelector('.contact-h2');
  if (contactH2) {
    const io2 = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { contactH2.classList.add('visible'); io2.disconnect(); }
    }, { threshold: 0.2 });
    io2.observe(contactH2);
  }

  /* section headers */
  document.querySelectorAll('.work-header, .about-inner > .section-tag, .contact-inner > .section-tag').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 30, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
  gsap.from('.section-h2', {
    opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.section-h2', start: 'top 85%' }
  });
}

/* ============================================================
   MAGNETIC BUTTONS
   ============================================================ */
function initMagneticButtons() {
  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width  / 2) * 0.35;
      const y = (e.clientY - rect.top  - rect.height / 2) * 0.35;
      gsap.to(btn, { x, y, duration: 0.4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    showToast('메시지가 전송됐습니다! 🎉');
    form.reset();
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ============================================================
   PARALLAX (hero text + about section bg)
   ============================================================ */
function initParallax() {
  if (typeof gsap === 'undefined') return;
  gsap.to('.hero-h1', {
    yPercent: 20,
    ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  await renderProjectCards();
  initCursor();
  initThreeJS();
  initNav();
});

window.addEventListener('load', () => {
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }
  initLoader();
  initMagneticButtons();
  initBentoAnimations();
  setTimeout(() => {
    initHorizontalScroll();
    initParallax();
  }, 100); /* small delay so loader animation can begin */
});
