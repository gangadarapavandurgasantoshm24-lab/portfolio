/* =============================
   PARTICLE CANVAS (OPTIMIZED)
   ============================= */
const canvas = document.getElementById('particle-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

let particles = [];
const PARTICLE_COUNT = 75;
const MAX_DISTANCE = 110;
const MAX_DIST_SQ = MAX_DISTANCE * MAX_DISTANCE;
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let isCanvasRunning = false;
let resizeTimeout = null;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resizeCanvas() {
  if (!canvas || prefersReducedMotion) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }
}

function createParticle() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    radius: Math.random() * 1.4 + 0.6,
    alpha: Math.random() * 0.45 + 0.15,
  };
}

function initParticles() {
  if (!canvas || prefersReducedMotion) return;
  resizeCanvas();
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle());
  }
}

function drawParticles() {
  if (!ctx || prefersReducedMotion || document.hidden) {
    isCanvasRunning = false;
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  ctx.clearRect(0, 0, width, height);

  // Update & Draw Particles
  const len = particles.length;
  for (let i = 0; i < len; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) p.x = width;
    else if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    else if (p.y > height) p.y = 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
    ctx.fill();
  }

  // Draw Interconnecting Lines with Squared-Distance Optimization
  for (let i = 0; i < len; i++) {
    const p1 = particles[i];
    for (let j = i + 1; j < len; j++) {
      const p2 = particles[j];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < MAX_DIST_SQ) {
        const dist = Math.sqrt(distSq);
        const lineAlpha = 0.08 * (1 - dist / MAX_DISTANCE);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 212, 255, ${lineAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  isCanvasRunning = true;
  requestAnimationFrame(drawParticles);
}

if (!prefersReducedMotion && canvas) {
  initParticles();
  drawParticles();

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeCanvas();
    }, 150);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !isCanvasRunning) {
      drawParticles();
    }
  });
}

/* =============================
   NAVBAR & SCROLL HANDLING (THROTTLED)
   ============================= */
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');
let isScrolling = false;

function updateNavbar() {
  const scrollY = window.scrollY;

  // Toggle scrolled navbar state
  if (navbar) {
    if (scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }

  // Determine current active section
  let current = 'home';
  const scrollBottom = window.innerHeight + scrollY;
  const docHeight = document.documentElement.scrollHeight;

  if (scrollBottom >= docHeight - 120) {
    current = 'contact';
  } else {
    sections.forEach(sec => {
      const top = sec.offsetTop - 140;
      if (scrollY >= top) {
        current = sec.id;
      }
    });
  }

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', () => {
  if (!isScrolling) {
    window.requestAnimationFrame(() => {
      updateNavbar();
      isScrolling = false;
    });
    isScrolling = true;
  }
}, { passive: true });

// Run initial check
updateNavbar();

/* =============================
   ACCESSIBLE HAMBURGER MENU
   ============================= */
const hamburger = document.getElementById('hamburger');
const navLinksEl = document.getElementById('nav-links');

function toggleMenu(forceState) {
  if (!hamburger || !navLinksEl) return;
  const isOpen = typeof forceState === 'boolean'
    ? forceState
    : !navLinksEl.classList.contains('open');

  navLinksEl.classList.toggle('open', isOpen);
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

if (hamburger && navLinksEl) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking any nav link
  navLinksEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => toggleMenu(false));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (navLinksEl.classList.contains('open') &&
      !navLinksEl.contains(e.target) &&
      !hamburger.contains(e.target)) {
      toggleMenu(false);
    }
  });

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinksEl.classList.contains('open')) {
      toggleMenu(false);
      hamburger.focus();
    }
  });
}

/* =============================
   TYPED TEXT ANIMATION
   ============================= */
const roles = [
  'Software Development Engineer',
  'Full Stack Developer',
  'AI/ML & Computer Vision Researcher',
  'Intelligent Systems & Optimization',
];
let roleIdx = 0, charIdx = 0, deleting = false;
const typedEl = document.getElementById('typed-text');

function typeText() {
  if (!typedEl) return;
  const current = roles[roleIdx];

  if (!deleting) {
    typedEl.textContent = current.slice(0, charIdx + 1);
    charIdx++;
    if (charIdx === current.length) {
      setTimeout(() => { deleting = true; typeText(); }, 1800);
      return;
    }
  } else {
    typedEl.textContent = current.slice(0, charIdx - 1);
    charIdx--;
    if (charIdx === 0) {
      deleting = false;
      roleIdx = (roleIdx + 1) % roles.length;
    }
  }
  setTimeout(typeText, deleting ? 45 : 75);
}

if (typedEl && !prefersReducedMotion) {
  typeText();
} else if (typedEl) {
  typedEl.textContent = roles[0];
}

/* =============================
   INTERSECTION OBSERVER — FADE UP
   ============================= */
const fadeEls = document.querySelectorAll(
  '.about-card, .skill-category, .project-card, .timeline-item, .achievement-card, .contact-info-card, .contact-form'
);

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  fadeEls.forEach(el => el.classList.add('fade-up'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), Math.min(i * 60, 240));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  fadeEls.forEach(el => observer.observe(el));
} else {
  fadeEls.forEach(el => el.classList.add('visible'));
}

/* =============================
   CONTACT FORM SUBMISSION
   ============================= */
const form = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (form && formStatus) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.elements['name']?.value.trim() || '';
    const email = form.elements['email']?.value.trim() || '';
    const subject = form.elements['subject']?.value.trim() || 'Portfolio Inquiry';
    const message = form.elements['message']?.value.trim() || '';

    // Basic Validation
    if (!name || !email || !message) {
      formStatus.className = 'form-status show error';
      formStatus.textContent = 'Please fill out all required fields.';
      return;
    }

    const btn = document.getElementById('send-message-btn');
    if (btn) {
      btn.innerHTML = '<span>Preparing...</span>';
      btn.disabled = true;
    }

    // Direct mailto dispatch to ensure communication reaches Santosh immediately
    setTimeout(() => {
      const mailtoUrl = `mailto:santhoshgangadhar416@gmail.com?subject=${encodeURIComponent(
        `[Portfolio] ${subject}`
      )}&body=${encodeURIComponent(
        `Hi Santosh,\n\n${message}\n\nFrom: ${name} (${email})`
      )}`;

      window.location.href = mailtoUrl;

      if (btn) {
        btn.innerHTML = '<span>Send Message</span><span class="btn-icon">→</span>';
        btn.disabled = false;
      }

      formStatus.className = 'form-status show success';
      formStatus.textContent = '✅ Message prepared! Opening your mail client to send directly to Santosh.';
      form.reset();

      setTimeout(() => {
        formStatus.classList.remove('show');
      }, 7000);
    }, 600);
  });
}

/* =============================
   SMOOTH ANCHOR SCROLL
   ============================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* =============================
   DYNAMIC COPYRIGHT YEAR
   ============================= */
const yearEl = document.getElementById('current-year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
