/* ============================================================
   Habibi Skincare — Main JavaScript
   ============================================================ */

'use strict';

// Capture script URL immediately (only works during sync execution)
const _mainScriptSrc = document.currentScript?.src;

// Cached firebase-config importer — resolves path unambiguously from script URL
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
window.addEventListener('load', () => {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;
  loader.classList.add('loader-hidden');
  setTimeout(() => loader.remove(), 500);
});

// ─── Cart ───────────────────────────────────────────────────
const Cart = {
  items: JSON.parse(localStorage.getItem('habibi_cart') || '[]'),

  save() {
    localStorage.setItem('habibi_cart', JSON.stringify(this.items));
    this.updateBadges();
    CartUI.render();
  },

  add(product) {
    const existing = this.items.find(i => i.id === product.id && i.size === product.size);
    if (existing) {
      existing.qty += 1;
    } else {
      this.items.push({ ...product, qty: 1 });
    }
    this.save();
    CartUI.open();
    showToast(`<i class="fas fa-check-circle"></i> ${product.name} added to cart`);
  },

  remove(id, size) {
    this.items = this.items.filter(i => !(i.id === id && i.size === size));
    this.save();
  },

  setQty(id, size, qty) {
    const item = this.items.find(i => i.id === id && i.size === size);
    if (item) {
      if (qty < 1) { this.remove(id, size); return; }
      item.qty = qty;
      this.save();
    }
  },

  get count() { return this.items.reduce((s, i) => s + i.qty, 0); },
  get subtotal() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); },

  updateBadges() {
    const count = this.count;
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.classList.toggle('visible', count > 0);
    });
  }
};

// ─── Cart UI ────────────────────────────────────────────────
const CartUI = {
  open() {
    document.querySelector('.cart-overlay')?.classList.add('open');
    document.querySelector('.cart-sidebar')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },
  close() {
    document.querySelector('.cart-overlay')?.classList.remove('open');
    document.querySelector('.cart-sidebar')?.classList.remove('open');
    document.body.style.overflow = '';
  },
  render() {
    const container = document.querySelector('.cart-sidebar__items');
    const subtotalEl = document.querySelector('.cart-subtotal strong');
    if (!container) return;

    if (!Cart.items.length) {
      container.innerHTML = `
        <div class="cart-empty">
          <i class="fas fa-shopping-bag"></i>
          <p>Your cart is empty</p>
          <a href="shop.html" class="btn btn-primary btn-sm" onclick="CartUI.close()">Start Shopping</a>
        </div>`;
    } else {
      container.innerHTML = Cart.items.map(item => `
        <div class="cart-item">
          <img class="cart-item__img" src="${item.image}" alt="${item.name}"
            onerror="this.style.background='var(--beige)';this.removeAttribute('src')">
          <div class="cart-item__info">
            <div class="cart-item__name">${item.name}</div>
            <div class="cart-item__size">${item.size}</div>
            <div class="cart-item__controls">
              <div class="cart-item__qty">
                <button class="qty-btn" onclick="Cart.setQty('${item.id}','${item.size}',${item.qty - 1})"
                  ${item.qty <= 1 ? 'disabled' : ''}>
                  <i class="fas fa-minus"></i>
                </button>
                <span class="qty-num">${item.qty}</span>
                <button class="qty-btn" onclick="Cart.setQty('${item.id}','${item.size}',${item.qty + 1})">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <button class="cart-item__remove" onclick="Cart.remove('${item.id}','${item.size}')">
                <i class="fas fa-times"></i> Remove
              </button>
            </div>
          </div>
          <div class="cart-item__price">
            <span style="font-size:0.78rem;color:var(--muted);display:block;text-align:right">₱${item.price.toLocaleString()} each</span>
            ₱${(item.price * item.qty).toLocaleString()}
          </div>
        </div>`).join('');
    }

    if (subtotalEl) subtotalEl.textContent = `₱${Cart.subtotal.toLocaleString()}`;
  }
};

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

  // Mobile menu
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

// ─── Auth Guard ──────────────────────────────────────────────
let _currentUser = undefined;
let _authResolve;
const _authReady = new Promise(resolve => { _authResolve = resolve; });

async function initAuthState() {
  try {
    // Build absolute URL so path resolution is unambiguous regardless of browser
    const { auth } = await getFirebase();
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    onAuthStateChanged(auth, user => {
      _currentUser = user || null;
      _authResolve();
      updateMobileAccountBtn(user);
    });
  } catch (e) { _currentUser = null; _authResolve(); }
}

function updateMobileAccountBtn(user) {
  const label  = document.getElementById('mobileAccountLabel');
  const avatar = document.getElementById('mobileAccountAvatar');
  if (!label || !avatar) return;
  if (user) {
    const name = user.displayName ? user.displayName.split(' ')[0] : 'Account';
    label.textContent = name;
    if (user.photoURL) {
      avatar.innerHTML = `<img src="${user.photoURL}" alt="${name}">`;
    } else {
      avatar.innerHTML = `<span style="font-family:var(--serif);font-size:1.2rem;font-weight:700">${name[0].toUpperCase()}</span>`;
    }
  } else {
    label.textContent = 'My Account';
    avatar.innerHTML = '<i class="fas fa-user"></i>';
  }
}

function showAuthPrompt(action) {
  let el = document.getElementById('authPrompt');
  if (!el) {
    el = document.createElement('div');
    el.id = 'authPrompt';
    el.className = 'auth-prompt';
    el.innerHTML = `
      <div class="auth-prompt__backdrop"></div>
      <div class="auth-prompt__card">
        <div class="auth-prompt__icon"><i class="fas fa-lock"></i></div>
        <h3 class="auth-prompt__title">Sign In to Continue</h3>
        <p class="auth-prompt__msg"></p>
        <a href="account.html" class="btn btn-primary auth-prompt__btn">
          <i class="fas fa-user-circle"></i> Sign In / Register
        </a>
        <button class="auth-prompt__cancel">Maybe Later</button>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('.auth-prompt__backdrop').addEventListener('click', closeAuthPrompt);
    el.querySelector('.auth-prompt__cancel').addEventListener('click', closeAuthPrompt);
  }
  const labels = {
    'cart':     'You need to be signed in to add items to your cart.',
    'wishlist': 'You need to be signed in to save items to your wishlist.',
    'checkout': 'You need to be signed in to place an order.'
  };
  el.querySelector('.auth-prompt__msg').textContent = labels[action] || 'Please sign in to continue.';
  requestAnimationFrame(() => {
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

function closeAuthPrompt() {
  const el = document.getElementById('authPrompt');
  if (!el) return;
  el.classList.remove('open');
  setTimeout(() => { document.body.style.overflow = ''; }, 300);
}

async function requireAuth(action) {
  if (_currentUser === undefined) await _authReady;
  if (_currentUser) return true;
  showAuthPrompt(action);
  return false;
}

// ─── Cart Events ────────────────────────────────────────────
function initCartEvents() {
  document.querySelector('.cart-overlay')?.addEventListener('click', CartUI.close);
  document.querySelector('.cart-close')?.addEventListener('click', CartUI.close);
  document.querySelectorAll('[data-cart-open]').forEach(el => el.addEventListener('click', CartUI.open));

  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    if (!await requireAuth('cart')) return;
    Cart.add({
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: +btn.dataset.price,
      image: btn.dataset.image || '',
      size: btn.dataset.size || '30ml'
    });
  });
}

// ─── Wishlist ───────────────────────────────────────────────
const Wishlist = {
  key: 'habibi_wishlist',
  items() { return JSON.parse(localStorage.getItem(this.key) || '[]'); },
  save(items) { localStorage.setItem(this.key, JSON.stringify(items)); },
  has(id) { return this.items().some(p => p.id === id); },
  add(product) {
    const items = this.items();
    if (!items.some(p => p.id === product.id)) { items.push(product); this.save(items); }
  },
  remove(id) { this.save(this.items().filter(p => p.id !== id)); },
  toggle(product) {
    if (this.has(product.id)) { this.remove(product.id); return false; }
    else { this.add(product); return true; }
  },
  count() { return this.items().length; },
  updateBadges() {
    const count = this.count();
    document.querySelectorAll('.wishlist-count').forEach(el => {
      el.textContent = count;
      el.classList.toggle('visible', count > 0);
    });
  }
};

function initWishlist() {
  // Mark already-wishlisted buttons on page load
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    const card = btn.closest('[data-id], .product-card');
    const id = card?.dataset?.id || btn.dataset?.id;
    if (id && Wishlist.has(id)) {
      btn.classList.add('wished');
      const icon = btn.querySelector('i');
      if (icon) { icon.classList.replace('far', 'fas'); }
    }
  });

  Wishlist.updateBadges();

  document.addEventListener('click', async e => {
    const btn = e.target.closest('.wishlist-btn');
    if (!btn) return;
    if (!await requireAuth('wishlist')) return;

    const card = btn.closest('.product-card');
    const product = {
      id:      card?.dataset?.id    || btn.dataset?.id    || 'p-' + Date.now(),
      name:    card?.querySelector('.product-card__name')?.textContent?.trim() || 'Product',
      price:   Number(card?.dataset?.price) || 0,
      image:   card?.querySelector('img')?.src || '',
      size:    card?.querySelector('.product-card__cat')?.textContent?.trim() || '',
      benefit: card?.querySelector('.product-card__benefit')?.textContent?.trim() || '',
      category:card?.dataset?.category || '',
    };

    // Try to get id and name from add-to-cart btn inside the same card
    const addBtn = card?.querySelector('[data-add-to-cart]');
    if (addBtn) {
      product.id    = addBtn.dataset.id    || product.id;
      product.name  = addBtn.dataset.name  || product.name;
      product.price = Number(addBtn.dataset.price) || product.price;
      product.image = addBtn.dataset.image || product.image;
      product.size  = addBtn.dataset.size  || product.size;
    }

    const added = Wishlist.toggle(product);
    btn.classList.toggle('wished', added);
    const icon = btn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fas', added);
      icon.classList.toggle('far', !added);
    }
    Wishlist.updateBadges();
    window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { added } }));
    showToast(added
      ? '<i class="fas fa-heart"></i> Added to wishlist'
      : '<i class="far fa-heart"></i> Removed from wishlist');
  });
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

// ─── Qty Wrap (Product Page) ────────────────────────────────
function initQtyWrap() {
  document.querySelectorAll('.qty-wrap').forEach(wrap => {
    const numEl = wrap.querySelector('.qty-wrap-num');
    if (!numEl) return;
    wrap.querySelector('[data-minus]')?.addEventListener('click', () => {
      const v = +numEl.value;
      if (v > 1) numEl.value = v - 1;
    });
    wrap.querySelector('[data-plus]')?.addEventListener('click', () => {
      numEl.value = +numEl.value + 1;
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

// ─── Sticky Bar (Product Page) ──────────────────────────────
function initStickyBar() {
  const target = document.querySelector('.product-actions');
  const bar = document.querySelector('.sticky-bar');
  if (!target || !bar) return;
  const observer = new IntersectionObserver(entries => {
    bar.classList.toggle('visible', !entries[0].isIntersecting);
  }, { threshold: 0 });
  observer.observe(target);
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
      } catch (_) { /* Firebase not configured yet — still show success UI */ }

      btn.textContent = 'Welcome!';
      btn.style.background = '#4a9c6d';
      input.value = '';
      input.placeholder = 'Check your email for your code ✓';
      setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 4000);
    });
  });
}

// ─── Checkout Modal ──────────────────────────────────────────
function createCheckoutModal() {
  if (document.getElementById('checkoutModal')) return;
  const m = document.createElement('div');
  m.id = 'checkoutModal';
  m.innerHTML = `
    <div class="co-backdrop"></div>
    <div class="co-modal">
      <button class="co-close" id="coClose"><i class="fas fa-times"></i></button>
      <div class="co-header">
        <h2>Complete Your Order</h2>
        <p>Fill in your details and we'll deliver to your door.</p>
      </div>
      <form id="coForm" autocomplete="on">
        <div class="co-section-title">Contact Information</div>
        <div class="co-row">
          <div class="co-field">
            <label>Full Name *</label>
            <input type="text" id="coName" placeholder="Juan dela Cruz" required autocomplete="name">
          </div>
          <div class="co-field">
            <label>Email *</label>
            <input type="email" id="coEmail" placeholder="juan@email.com" required autocomplete="email">
          </div>
        </div>
        <div class="co-field">
          <label>Phone Number *</label>
          <input type="tel" id="coPhone" placeholder="09XX XXX XXXX" required autocomplete="tel">
        </div>
        <div class="co-section-title">Delivery Address</div>
        <div class="co-field">
          <label>Street Address *</label>
          <input type="text" id="coAddress" placeholder="House/Unit No., Street Name" required autocomplete="street-address">
        </div>
        <div class="co-row">
          <div class="co-field">
            <label>City</label>
            <input type="text" id="coCity" placeholder="Davao City" autocomplete="address-level2">
          </div>
          <div class="co-field">
            <label>ZIP Code</label>
            <input type="text" id="coZip" placeholder="8000" autocomplete="postal-code">
          </div>
        </div>
        <div class="co-section-title">Payment Method</div>
        <div class="co-payment-opts">
          <label class="co-pay-opt">
            <input type="radio" name="payment" value="GCash" checked>
            <span><i class="fas fa-mobile-alt"></i> GCash</span>
          </label>
          <label class="co-pay-opt">
            <input type="radio" name="payment" value="COD">
            <span><i class="fas fa-money-bill-wave"></i> Cash on Delivery</span>
          </label>
          <label class="co-pay-opt">
            <input type="radio" name="payment" value="Card">
            <span><i class="fas fa-credit-card"></i> Card</span>
          </label>
        </div>
        <div class="co-note-field">
          <label>Order Notes (optional)</label>
          <textarea id="coNote" placeholder="Any special instructions for your order..."></textarea>
        </div>
        <div class="co-summary" id="coSummary"></div>
        <button type="submit" class="co-submit" id="coSubmit">
          <i class="fas fa-check-circle"></i> Place Order
        </button>
      </form>
    </div>`;
  document.body.appendChild(m);

  // Inject styles
  if (!document.getElementById('coStyles')) {
    const s = document.createElement('style');
    s.id = 'coStyles';
    s.textContent = `
      #checkoutModal { position:fixed;inset:0;z-index:9999;display:none; }
      #checkoutModal.open { display:flex;align-items:center;justify-content:center; }
      .co-backdrop { position:absolute;inset:0;background:rgba(61,26,34,0.55);backdrop-filter:blur(3px); }
      .co-modal {
        position:relative;z-index:1;background:#fff;border-radius:20px;
        padding:36px 40px;width:100%;max-width:560px;max-height:90vh;
        overflow-y:auto;box-shadow:0 24px 80px rgba(61,26,34,0.25);
        scrollbar-width:thin;
      }
      .co-close {
        position:absolute;top:16px;right:16px;background:var(--beige);border:none;
        width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:0.9rem;
        color:var(--brown);display:flex;align-items:center;justify-content:center;
        transition:background 0.2s;
      }
      .co-close:hover { background:var(--sand); }
      .co-header { margin-bottom:24px; }
      .co-header h2 { font-family:var(--serif);font-size:1.5rem;color:var(--brown);margin-bottom:4px; }
      .co-header p { font-size:0.85rem;color:var(--muted); }
      .co-section-title {
        font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
        color:var(--gold);margin:20px 0 10px;border-bottom:1px solid var(--border);padding-bottom:6px;
      }
      .co-row { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
      .co-field { display:flex;flex-direction:column;gap:5px;margin-bottom:12px; }
      .co-field label { font-size:0.78rem;font-weight:600;color:var(--brown); }
      .co-field input, .co-field textarea {
        padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;
        font-size:0.88rem;color:var(--brown);font-family:var(--sans);
        background:var(--cream);outline:none;transition:border 0.2s,box-shadow 0.2s;
      }
      .co-field input:focus, .co-field textarea:focus {
        border-color:var(--gold);box-shadow:0 0 0 3px rgba(212,104,122,0.12);background:#fff;
      }
      .co-note-field { margin-bottom:12px; }
      .co-note-field label { font-size:0.78rem;font-weight:600;color:var(--brown);display:block;margin-bottom:5px; }
      .co-note-field textarea { width:100%;resize:vertical;min-height:70px;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:0.88rem;color:var(--brown);font-family:var(--sans);background:var(--cream);outline:none;transition:border 0.2s; }
      .co-note-field textarea:focus { border-color:var(--gold);box-shadow:0 0 0 3px rgba(212,104,122,0.12);background:#fff; }
      .co-payment-opts { display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px; }
      .co-pay-opt { display:flex;align-items:center; cursor:pointer; }
      .co-pay-opt input { display:none; }
      .co-pay-opt span {
        padding:9px 16px;border:1.5px solid var(--border);border-radius:100px;
        font-size:0.82rem;font-weight:600;color:var(--muted);
        display:flex;align-items:center;gap:6px;transition:all 0.2s;
      }
      .co-pay-opt input:checked + span { border-color:var(--gold);background:var(--gold-light);color:var(--gold); }
      .co-summary {
        background:var(--cream);border-radius:12px;padding:14px 16px;
        margin:16px 0;font-size:0.85rem;color:var(--brown);
      }
      .co-summary-row { display:flex;justify-content:space-between;margin-bottom:6px; }
      .co-summary-row:last-child { margin-bottom:0;font-weight:700;font-size:0.95rem;border-top:1px solid var(--border);padding-top:8px;margin-top:4px; }
      .co-submit {
        width:100%;padding:14px;background:var(--gold);color:#fff;border:none;
        border-radius:100px;font-size:0.95rem;font-weight:700;font-family:var(--sans);
        cursor:pointer;transition:all 0.25s;display:flex;align-items:center;justify-content:center;gap:8px;
      }
      .co-submit:hover:not(:disabled) { background:var(--gold-dark);transform:translateY(-1px);box-shadow:0 6px 20px rgba(212,104,122,0.4); }
      .co-submit:disabled { opacity:0.65;cursor:not-allowed; }
      @media(max-width:500px){ .co-modal{padding:24px 18px;border-radius:14px 14px 0 0;max-height:95vh;} .co-row{grid-template-columns:1fr;} #checkoutModal.open{align-items:flex-end;} }
    `;
    document.head.appendChild(s);
  }

  // Close handlers
  document.querySelector('.co-backdrop').addEventListener('click', closeCheckoutModal);
  document.getElementById('coClose').addEventListener('click', closeCheckoutModal);

  // Form submit
  document.getElementById('coForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('coSubmit');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;width:16px;height:16px;border-width:2px;display:inline-block;border-radius:50%;animation:spin 0.7s linear infinite"></span> Placing order...';

    const order = {
      items: Cart.items,
      total: Cart.subtotal,
      customer: {
        name:    document.getElementById('coName').value.trim(),
        email:   document.getElementById('coEmail').value.trim(),
        phone:   document.getElementById('coPhone').value.trim(),
        address: [
          document.getElementById('coAddress').value.trim(),
          document.getElementById('coCity').value.trim(),
          document.getElementById('coZip').value.trim()
        ].filter(Boolean).join(', '),
      },
      paymentMethod: document.querySelector('input[name="payment"]:checked')?.value || 'COD',
      notes:  document.getElementById('coNote').value.trim(),
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      const { db, auth } = await getFirebase();
      const { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      order.createdAt = serverTimestamp();
      // Attach customer user ID if logged in
      const user = auth.currentUser;
      if (user) { order.userId = user.uid; order.customer.email = order.customer.email || user.email; }
      await addDoc(collection(db, 'orders'), order);

      // Decrease stock for each ordered item
      for (const item of order.items) {
        if (!item.id) continue;
        try {
          const productRef = doc(db, 'products', item.id);
          const snap = await getDoc(productRef);
          if (!snap.exists()) continue;
          const currentStock = snap.data().stock;
          if (currentStock == null) continue; // skip if no stock field
          const newStock = Math.max(0, currentStock - (item.qty || 1));
          await updateDoc(productRef, {
            stock: newStock,
            inStock: newStock > 0,
          });
        } catch (_) { /* skip individual product update errors */ }
      }
    } catch (_) { /* Firebase not configured */ }

    // Send admin email notification via EmailJS
    sendOrderNotification(order);

    Cart.items = [];
    Cart.save();
    closeCheckoutModal();
    CartUI.close();
    showToast('<i class="fas fa-check-circle"></i> Order placed! We\'ll contact you soon.');
  });
}

// ─── EmailJS order notification ──────────────────────────────
// Replace these 3 values with your own from emailjs.com
const EMAILJS_SERVICE_ID  = 'service_276np7v';
const EMAILJS_TEMPLATE_ID = 'template_hqkqnna';
const EMAILJS_PUBLIC_KEY  = 'tvLVIIrQWaEV5G0lC';

async function sendOrderNotification(order) {
  try {
    const itemsList = order.items
      .map(i => `${i.name} x ${i.qty} - P${(i.price * i.qty).toLocaleString()}`)
      .join('\n');

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id:     EMAILJS_PUBLIC_KEY,
        template_params: {
          name:             order.customer.name    || 'Customer',
          email:            order.customer.email   || 'N/A',
          customer_name:    order.customer.name    || 'N/A',
          customer_email:   order.customer.email   || 'N/A',
          customer_phone:   order.customer.phone   || 'N/A',
          customer_address: order.customer.address || 'N/A',
          order_items:      itemsList,
          order_total:      'P' + (order.total || 0).toLocaleString(),
          payment_method:   order.paymentMethod    || 'COD',
          order_notes:      order.notes            || 'None',
        }
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('EmailJS error:', res.status, text);
    }
  } catch (err) {
    console.error('Email notification failed:', err);
  }
}

function openCheckoutModal() {
  if (!Cart.items.length) return;
  createCheckoutModal();
  // Pre-fill from Firebase auth if logged in
  getFirebase().then(({ auth }) => {
    const user = auth.currentUser;
    if (user) {
      const nameEl  = document.getElementById('coName');
      const emailEl = document.getElementById('coEmail');
      if (nameEl && !nameEl.value)   nameEl.value  = user.displayName || '';
      if (emailEl && !emailEl.value) emailEl.value = user.email || '';
    }
  }).catch(() => {});

  // Render order summary
  const summary = document.getElementById('coSummary');
  if (summary) {
    summary.innerHTML = `
      ${Cart.items.map(i => `<div class="co-summary-row"><span>${i.name} × ${i.qty}</span><span>₱${(i.price * i.qty).toLocaleString()}</span></div>`).join('')}
      <div class="co-summary-row"><span>Total</span><span>₱${Cart.subtotal.toLocaleString()}</span></div>`;
  }
  document.getElementById('checkoutModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

function initCheckout() {
  document.querySelector('.cart-checkout')?.addEventListener('click', async () => {
    if (!await requireAuth('checkout')) return;
    openCheckoutModal();
  });
}

// ─── Search Overlay ─────────────────────────────────────────
function initSearch() {
  // Build overlay DOM
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

  // Wire up buttons — nav search icons + mobile menu search button
  document.querySelectorAll('[aria-label="Search"]').forEach(btn =>
    btn.addEventListener('click', () => {
      // Close mobile menu first if it's open
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
  initAuthState();
  Cart.updateBadges();
  CartUI.render();
  initNav();
  initScrollAnim();
  initParallax();
  initCartEvents();
  initWishlist();
  initFilterTabs();
  initSort();
  initGallery();
  initTabs();
  initQtyWrap();
  initSizeBtns();
  initStickyBar();
  initNewsletter();
  initCheckout();
  initSearch();
  initAnchorLinks();
});
