/* ============================================================
   Habibi Skincare — Main JavaScript
   ============================================================ */

'use strict';

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
          <div class="cart-item__price">₱${(item.price * item.qty).toLocaleString()}</div>
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

// ─── Cart Events ────────────────────────────────────────────
function initCartEvents() {
  document.querySelector('.cart-overlay')?.addEventListener('click', CartUI.close);
  document.querySelector('.cart-close')?.addEventListener('click', CartUI.close);
  document.querySelectorAll('[data-cart-open]').forEach(el => el.addEventListener('click', CartUI.open));

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
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
function initWishlist() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.wishlist-btn');
    if (!btn) return;
    btn.classList.toggle('wished');
    const icon = btn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fas', btn.classList.contains('wished'));
      icon.classList.toggle('far', !btn.classList.contains('wished'));
    }
    if (btn.classList.contains('wished')) {
      showToast('<i class="fas fa-heart"></i> Added to wishlist');
    }
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
        const { db } = await import('./firebase-config.js');
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

// ─── Checkout (saves order to Firestore) ────────────────────
function initCheckout() {
  document.querySelector('.cart-checkout')?.addEventListener('click', async () => {
    if (!Cart.items.length) return;

    const name    = prompt('Your full name:');
    if (!name) return;
    const email   = prompt('Your email:');
    if (!email) return;
    const phone   = prompt('Your phone number:');
    const address = prompt('Delivery address:');
    const payment = prompt('Payment method (GCash / COD / Card):') || 'COD';

    const order = {
      items:   Cart.items,
      total:   Cart.subtotal,
      customer: { name, email, phone: phone||'', address: address||'' },
      paymentMethod: payment,
      status:  'pending',
      createdAt: new Date(),
    };

    try {
      const { db } = await import('./firebase-config.js');
      const { collection, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      order.createdAt = serverTimestamp();
      await addDoc(collection(db, 'orders'), order);
    } catch (_) { /* Firebase not configured yet */ }

    Cart.items = [];
    Cart.save();
    CartUI.close();
    showToast('<i class="fas fa-check-circle"></i> Order placed! We\'ll contact you soon.');
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
  initAnchorLinks();
});
