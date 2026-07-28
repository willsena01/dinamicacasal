// Modal helpers
function openModal(modal) {
  modal.hidden = false;
}

function closeModal(modal) {
  modal.hidden = true;
}

document.querySelectorAll('.modal-close').forEach((btn) => {
  btn.addEventListener('click', () => {
    const modal = document.getElementById(btn.dataset.close);
    if (modal) closeModal(modal);
  });
});

document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay);
  });
});

// Basic plan click → show premium upsell offer first
(function basicUpsell() {
  const btn = document.getElementById('checkout-btn-basic');
  const modal = document.getElementById('upsell-modal');
  if (!btn || !modal) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(modal);
  });
})();

// Exit-intent → show a last-chance offer before the lead leaves
(function exitIntent() {
  const modal = document.getElementById('exit-modal');
  if (!modal) return;
  let shown = false;

  function trigger() {
    if (shown) return;
    shown = true;
    openModal(modal);
  }

  // Desktop: mouse leaves toward the top of the viewport (closing tab / address bar)
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 0) trigger();
  });

  // Mobile: intercept the back button once
  history.pushState({ exitGuard: true }, '');
  window.addEventListener('popstate', () => {
    if (!shown) {
      trigger();
      history.pushState({ exitGuard: true }, '');
    }
  });
})();

// Live viewer counter — cosmetic fluctuation
(function liveCounter() {
  const el = document.getElementById('live-count');
  if (!el) return;
  const MIN = 348;
  const MAX = 387;
  let count = 365;
  setInterval(() => {
    count += Math.floor(Math.random() * 5) - 2;
    if (count < MIN) count = MIN;
    if (count > MAX) count = MAX;
    el.textContent = count.toLocaleString('pt-BR');
  }, 3000);
})();

// Hero video player
(function videoPlayer() {
  const player = document.getElementById('video-player');
  const video = document.getElementById('hero-video');
  const playBtn = document.getElementById('play-btn');
  const status = document.getElementById('video-status');
  const progressBar = document.getElementById('progress-bar');
  const timeBadge = document.getElementById('video-time');
  if (!player || !video || !playBtn || !status || !progressBar) return;

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }

  video.addEventListener('loadedmetadata', () => {
    if (timeBadge) timeBadge.textContent = formatTime(video.duration);
  });

  video.addEventListener('play', () => {
    player.classList.add('is-playing');
    status.textContent = 'REPRODUZINDO';
  });

  video.addEventListener('pause', () => {
    player.classList.remove('is-playing');
    status.textContent = 'PAUSADO';
  });

  video.addEventListener('ended', () => {
    player.classList.remove('is-playing');
    status.textContent = 'PAUSADO';
    progressBar.style.width = '0%';
  });

  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    progressBar.style.width = (video.currentTime / video.duration) * 100 + '%';
  });

  function togglePlay() {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  playBtn.addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);
})();

// Games carousels — smooth continuous auto-scroll
(function carousels() {
  const SPEED = 40; // pixels per second
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const controls = new Map();

  document.querySelectorAll('.carousel-track').forEach((track) => {
    // Duplicate the slides once so the track can loop seamlessly.
    Array.from(track.children).forEach((slide) => {
      const clone = slide.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    let paused = prefersReducedMotion;
    let resumeTimer = null;
    let lastTs = null;

    function pause() {
      paused = true;
    }

    function resume(delay) {
      if (prefersReducedMotion) return;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        paused = false;
      }, delay || 0);
    }

    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', () => resume(400));
    track.addEventListener('touchstart', pause, { passive: true });
    track.addEventListener('touchend', () => resume(2500));

    function frame(ts) {
      if (lastTs === null) lastTs = ts;
      const delta = ts - lastTs;
      lastTs = ts;
      if (!paused) {
        const halfWidth = track.scrollWidth / 2;
        track.scrollLeft += (SPEED * delta) / 1000;
        if (track.scrollLeft >= halfWidth) {
          track.scrollLeft -= halfWidth;
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    controls.set(track.id, { pause, resume });
  });

  document.querySelectorAll('.carousel-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const track = document.getElementById(btn.dataset.target);
      if (!track) return;
      const slide = track.querySelector('.carousel-slide');
      const distance = slide ? slide.getBoundingClientRect().width + 14 : 200;
      const ctrl = controls.get(track.id);
      if (ctrl) {
        ctrl.pause();
        ctrl.resume(3000);
      }
      track.scrollBy({
        left: btn.classList.contains('next') ? distance : -distance,
        behavior: 'smooth',
      });
    });
  });
})();

// Testimonial carousel — one slide at a time, auto-advancing
(function testimonialCarousel() {
  const track = document.getElementById('testimonial-track');
  const dotsWrap = document.getElementById('testimonial-dots');
  if (!track || !dotsWrap) return;

  const slides = Array.from(track.children);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let paused = prefersReducedMotion;
  let resumeTimer = null;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Ir para depoimento ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' });
    dots.forEach((d, di) => d.classList.toggle('active', di === index));
  }

  function pause() {
    paused = true;
  }

  function resume(delay) {
    if (prefersReducedMotion) return;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      paused = false;
    }, delay || 0);
  }

  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', () => resume(500));
  track.addEventListener('touchstart', pause, { passive: true });
  track.addEventListener('touchend', () => resume(4000));

  document.querySelectorAll('.testimonial-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      pause();
      resume(4000);
      goTo(index + (btn.classList.contains('next') ? 1 : -1));
    });
  });

  setInterval(() => {
    if (!paused) goTo(index + 1);
  }, 4500);
})();

// FAQ accordion
(function faqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach((i) => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
})();
