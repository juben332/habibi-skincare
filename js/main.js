/* ============================================================
   Habibi Skincare — Main JavaScript
   ============================================================ */

'use strict';

const _mainScriptSrc = document.currentScript?.src;

let _fbCache = null;
function getFirebase() {
  if (_fbCache) return _fbCache;
  const configUrl = _mainScriptSrc
    ? new URL('./firebase-config.js', _mainScriptSrc).href
    : location.origin + '/js/firebase-config.js';
  _fbCache = import(configUrl);
  return _fbCache;
}

// ─── Page Loader ────────────────────────────────────────────
const _loaderStart = Date.now();
const _minLoaderMs = 1500;

window.addEventListener('load', () => {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;
  const elapsed = Date.now() - _loaderStart;
  const wait = Math.max(0, _minLoaderMs - elapsed);
  setTimeout(() => {
    loader.classList.add('loader-hidden');
    setTimeout(() => loader.remove(), 500);
  }, wait);
});

// ─── Toast ──────────────────────────────────────────────────
function showToast(html) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = html;
  document.body.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 2800);
}

// ─── Navigation ─────────────────────────────────────────────
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const update = () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 50);
    nav.classList.toggle('nav--transparent', window.scrollY <= 50);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();

  const burger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.nav__mobile');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      burger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        burger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
}

// ─── Scroll Animations ──────────────────────────────────────
function initScrollAnim() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.anim').forEach(el => observer.observe(el));
}

window.initScrollAnim = initScrollAnim;

// ─── Hero Parallax ──────────────────────────────────────────
function initParallax() {
  const bg = document.querySelector('.hero__bg');
  if (!bg) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY < window.innerHeight) {
      bg.style.transform = `scale(1.06) translateY(${window.scrollY * 0.25}px)`;
    }
  }, { passive: true });
}

// ─── Filter Tabs (Shop) ─────────────────────────────────────
function initFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.product-card');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.category;
      cards.forEach(card => {
        const show = cat === 'all' || card.dataset.category === cat;
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        if (show) {
          card.style.display = '';
          requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = ''; });
        } else {
          card.style.opacity = '0';
          setTimeout(() => { if (card.style.opacity === '0') card.style.display = 'none'; }, 300);
        }
      });
    });
  });
}

// ─── Sort (Shop) ────────────────────────────────────────────
function initSort() {
  const select = document.querySelector('.shop-sort select');
  if (!select) return;
  select.addEventListener('change', () => {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.product-card')];
    cards.sort((a, b) => {
      const pa = +a.dataset.price, pb = +b.dataset.price;
      if (select.value === 'low') return pa - pb;
      if (select.value === 'high') return pb - pa;
      return 0;
    });
    cards.forEach(c => grid.appendChild(c));
  });
}

// ─── Product Gallery ────────────────────────────────────────
function initGallery() {
  const thumbs = document.querySelectorAll('.gallery-thumb');
  const mainImg = document.querySelector('.gallery-main img');
  if (!thumbs.length || !mainImg) return;
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const src = thumb.querySelector('img')?.src;
      if (src) { mainImg.style.opacity = '0'; setTimeout(() => { mainImg.src = src; mainImg.style.opacity = '1'; }, 180); }
    });
  });
  mainImg.style.transition = 'opacity 0.2s ease';
}

// ─── Product Tabs ───────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`[data-panel="${panel}"]`)?.classList.add('active');
    });
  });
}

// ─── Size Buttons ───────────────────────────────────────────
function initSizeBtns() {
  document.querySelectorAll('.size-options').forEach(group => {
    group.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });
}

// ─── Newsletter (saves to Firestore) ────────────────────────
function initNewsletter() {
  document.querySelectorAll('.newsletter__form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const input = form.querySelector('.newsletter__input');
      const btn   = form.querySelector('.btn');
      const email = input?.value?.trim();
      if (!email) return;

      const orig = btn.textContent;
      btn.textContent = 'Joining...';
      btn.disabled = true;

      try {
        const { db } = await getFirebase();
        const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
        await addDoc(collection(db, 'subscribers'), { email, subscribedAt: serverTimestamp() });
      } catch (_) {}

      btn.textContent = 'Welcome!';
      btn.style.background = '#4a9c6d';
      input.value = '';
      input.placeholder = 'Check your email for your code ✓';
      setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 4000);
    });
  });
}

// ─── Search Overlay ─────────────────────────────────────────
function initSearch() {
  const overlay = document.createElement('div');
  overlay.id = 'searchOverlay';
  overlay.className = 'search-overlay';
  overlay.innerHTML = `
    <div class="search-overlay__backdrop"></div>
    <div class="search-overlay__box">
      <div class="search-overlay__header">
        <div class="search-overlay__input-wrap">
          <i class="fas fa-search search-overlay__icon"></i>
          <input type="text" id="searchInput" class="search-overlay__input"
            placeholder="Search products, categories..." autocomplete="off">
          <button class="search-overlay__clear" id="searchClear" aria-label="Clear">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <button class="search-overlay__close" id="searchClose">Cancel</button>
      </div>
      <div id="searchResults" class="search-overlay__results">
        <div class="search-empty">
          <i class="fas fa-search"></i>
          <p>Type to search products…</p>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  let cachedProducts = null;

  async function fetchProducts() {
    if (cachedProducts) return;
    try {
      const { db } = await getFirebase();
      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDocs(collection(db, 'products'));
      cachedProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (_) { cachedProducts = []; }
  }

  function openSearch() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('searchInput').focus(), 50);
    fetchProducts();
  }

  function closeSearch() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    document.getElementById('searchClear')?.classList.remove('visible');
    document.getElementById('searchResults').innerHTML =
      '<div class="search-empty"><i class="fas fa-search"></i><p>Type to search products…</p></div>';
  }

  function renderResults(q) {
    const el = document.getElementById('searchResults');
    if (!q.trim()) {
      el.innerHTML = '<div class="search-empty"><i class="fas fa-search"></i><p>Type to search products…</p></div>';
      return;
    }
    const term = q.toLowerCase();
    const hits = (cachedProducts || []).filter(p =>
      (p.name || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term) ||
      (p.benefit || '').toLowerCase().includes(term)
    );
    if (!hits.length) {
      el.innerHTML = `<div class="search-empty"><i class="fas fa-box-open"></i><p>No results for "<strong>${q}</strong>"</p></div>`;
      return;
    }
    el.innerHTML = hits.map(p => `
      <a href="product.html?id=${p.id}" class="search-result-item">
        <div class="search-result-img">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" onerror="this.onerror=null;this.style.display='none'">` : ''}
        </div>
        <div class="search-result-info">
          <span class="search-result-cat">${p.category || ''}</span>
          <div class="search-result-name">${p.name}</div>
          <div class="search-result-benefit">${p.benefit || ''}</div>
        </div>
        <span class="search-result-price">₱${(p.price || 0).toLocaleString()}</span>
      </a>`).join('');
    el.querySelectorAll('.search-result-item').forEach(a => a.addEventListener('click', closeSearch));
  }

  document.querySelectorAll('[aria-label="Search"]').forEach(btn =>
    btn.addEventListener('click', () => {
      document.getElementById('mobileMenu')?.classList.remove('open');
      document.querySelector('.nav__hamburger')?.classList.remove('open');
      document.body.style.overflow = '';
      openSearch();
    }));
  overlay.querySelector('.search-overlay__backdrop').addEventListener('click', closeSearch);
  document.getElementById('searchClose').addEventListener('click', closeSearch);

  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');

  input.addEventListener('input', async () => {
    const val = input.value;
    clearBtn.classList.toggle('visible', val.length > 0);
    await fetchProducts();
    renderResults(val);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.remove('visible');
    renderResults('');
    input.focus();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSearch();
  });
}

// ─── Smooth anchor links ─────────────────────────────────────
function initAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

// ─── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollAnim();
  initParallax();
  initFilterTabs();
  initSort();
  initGallery();
  initTabs();
  initSizeBtns();
  initNewsletter();
  initSearch();
  initAnchorLinks();
});
