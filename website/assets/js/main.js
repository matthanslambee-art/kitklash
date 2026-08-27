/* KITKLASH shared front-end logic: layout injection, cart, search, nav, product cards. */

const CART_KEY = "kitklash_cart";
const ADMIN_KEY_STORAGE = "kitklash_admin_key";

function formatPrice(n) {
  return "R" + n.toLocaleString("en-ZA");
}

/* The admin gate (admin.html) stores the entered password here after a
   successful login; every admin-only API call sends it as the X-Admin-Key
   header, which the Worker checks server-side. Empty string on any page
   where the visitor never unlocked admin (harmless — the server just
   rejects the request). */
function getAdminKey() {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) || "";
}

/* ---------- Layout injection ---------- */

function getActivePage() {
  const file = location.pathname.split("/").pop() || "index.html";
  const params = new URLSearchParams(location.search);
  if (file === "" || file === "index.html") return "home";
  if (file === "shop.html") {
    const cat = params.get("category");
    if (cat === "vintage") return "vintage";
    if (cat === "modern") return "modern";
    return "shop";
  }
  if (file === "on-hand.html") return "on-hand";
  if (file === "about.html") return "about";
  if (file === "admin.html") return "admin";
  return "";
}

async function loadLayout() {
  await initProducts();
  const headerHost = document.getElementById("site-header");
  const footerHost = document.getElementById("site-footer");
  const [headerHtml, footerHtml] = await Promise.all([
    fetch("partials/header.html").then(r => r.text()),
    fetch("partials/footer.html").then(r => r.text())
  ]);
  if (headerHost) headerHost.innerHTML = headerHtml;
  if (footerHost) footerHost.innerHTML = footerHtml;

  const active = getActivePage();
  document.querySelectorAll(".nav-link").forEach(a => {
    if (a.dataset.path === active) {
      a.classList.add("text-primary", "border-b", "border-primary");
      a.classList.remove("text-on-surface-variant");
    }
  });

  initHeaderBehavior();
  updateCartUI();
}

function initHeaderBehavior() {
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileClose = document.getElementById("mobile-menu-close");
  mobileToggle?.addEventListener("click", () => {
    mobileMenu.classList.remove("hidden");
    mobileMenu.classList.add("flex");
  });
  mobileClose?.addEventListener("click", () => {
    mobileMenu.classList.add("hidden");
    mobileMenu.classList.remove("flex");
  });
  mobileMenu?.querySelectorAll("a").forEach(a =>
    a.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
      mobileMenu.classList.remove("flex");
    })
  );

  const searchToggle = document.getElementById("search-toggle");
  const searchOverlay = document.getElementById("search-overlay");
  const searchClose = document.getElementById("search-close");
  const searchInput = document.getElementById("search-input");
  searchToggle?.addEventListener("click", () => {
    searchOverlay.classList.remove("hidden");
    searchOverlay.classList.add("flex");
    searchInput.value = "";
    renderSearchResults("");
    setTimeout(() => searchInput.focus(), 50);
  });
  searchClose?.addEventListener("click", () => {
    searchOverlay.classList.add("hidden");
    searchOverlay.classList.remove("flex");
  });
  searchInput?.addEventListener("input", e => renderSearchResults(e.target.value));

  const sizeGuideOverlay = document.getElementById("size-guide-overlay");
  document.getElementById("size-guide-close")?.addEventListener("click", () => {
    sizeGuideOverlay.classList.add("hidden");
    sizeGuideOverlay.classList.remove("flex");
  });
  sizeGuideOverlay?.addEventListener("click", e => {
    if (e.target === sizeGuideOverlay) {
      sizeGuideOverlay.classList.add("hidden");
      sizeGuideOverlay.classList.remove("flex");
    }
  });
  document.addEventListener("click", e => {
    if (e.target.closest(".size-guide-trigger")) {
      e.preventDefault();
      sizeGuideOverlay.classList.remove("hidden");
      sizeGuideOverlay.classList.add("flex");
    }
  });

  const cartToggle = document.getElementById("cart-toggle");
  const cartClose = document.getElementById("cart-close");
  const cartOverlay = document.getElementById("cart-overlay");
  cartToggle?.addEventListener("click", openCart);
  cartClose?.addEventListener("click", closeCart);
  cartOverlay?.addEventListener("click", closeCart);
  document.getElementById("cart-checkout")?.addEventListener("click", () => {
    if (!cartCount()) return;
    window.location.href = "checkout.html";
  });

  const newsletterForm = document.getElementById("newsletter-form");
  newsletterForm?.addEventListener("submit", e => {
    e.preventDefault();
    const msg = document.getElementById("newsletter-msg");
    msg.textContent = "Subscribed — welcome to the Ultra.";
    msg.classList.remove("hidden", "text-kit-accent-red");
    msg.classList.add("text-primary");
    newsletterForm.querySelector("input").value = "";
  });
}

function renderSearchResults(query) {
  const host = document.getElementById("search-results");
  if (!host) return;
  if (!query.trim()) {
    host.innerHTML = "";
    return;
  }
  const matches = searchProducts(query);
  if (!matches.length) {
    host.innerHTML = `<p class="font-body-md text-body-md text-on-surface-variant">No archives match "${query}".</p>`;
    return;
  }
  host.innerHTML =
    `<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">${matches.length} result${matches.length === 1 ? "" : "s"}</p>` +
    matches
      .map(
        p => `
    <a href="product.html?slug=${p.slug}" class="flex items-center justify-between gap-4 border-b border-stadium-grey pb-4 group">
      <div class="flex flex-col">
        <span class="font-body-lg text-body-lg text-primary group-hover:text-surface-tint transition-colors">${p.name}</span>
        <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">${p.team} · ${p.year}${p.league ? " · " + getLeagueLabel(p.league) : ""}</span>
      </div>
      <span class="font-price-display text-price-display text-primary whitespace-nowrap">${formatPrice(p.price)}</span>
    </a>`
      )
      .join("");
}

/* ---------- Cart ---------- */

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

function addToCart(slug, size, qty = 1, version = null, sleeve = null, patch = null, customization = null) {
  const cart = getCart();
  const key = i =>
    JSON.stringify([i.slug, i.size, i.version || null, i.sleeve || null, i.patch || null, i.customization || null]);
  const newItem = { slug, size, qty, version: version || null, sleeve: sleeve || null, patch: patch || null, customization: customization || null };
  const existing = cart.find(i => key(i) === key(newItem));
  if (existing) existing.qty += qty;
  else cart.push(newItem);
  saveCart(cart);
  openCart();
}

/* Per-unit price for a cart line: customizable products price by version+sleeve
   rather than a flat `price`, plus flat add-on surcharges for patch/customization. */
function cartItemUnitPrice(item) {
  const p = getProductBySlug(item.slug);
  if (!p) return 0;
  let base = isCustomizable(p) ? getBasePrice(p, item.version, item.sleeve) : p.price;
  if (item.patch) base += 50;
  if (item.customization) base += 100;
  return base;
}

function cartItemOptionsLabel(item) {
  const parts = [`Size ${item.size}`];
  if (item.version) parts.push(versionLabel(item.version));
  if (item.sleeve) parts.push(sleeveLabel(item.sleeve));
  if (item.patch) parts.push(`Patch: ${item.patch.description}`);
  if (item.customization) parts.push(`Name/Number: ${item.customization.name} / ${item.customization.number}`);
  parts.push(`Qty ${item.qty}`);
  return parts.join(" · ");
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function cartCount() {
  return getCart().reduce((n, i) => n + i.qty, 0);
}

function cartSubtotal() {
  return getCart().reduce((sum, i) => sum + cartItemUnitPrice(i) * i.qty, 0);
}

function updateCartUI() {
  const countEl = document.getElementById("cart-count");
  if (countEl) countEl.textContent = cartCount();

  const itemsHost = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("cart-subtotal");
  if (!itemsHost) return;

  const cart = getCart();
  if (!cart.length) {
    itemsHost.innerHTML = `<p class="font-body-md text-body-md text-on-surface-variant">Your bag is empty. The archive awaits.</p>`;
  } else {
    itemsHost.innerHTML = cart
      .map((item, idx) => {
        const p = getProductBySlug(item.slug);
        if (!p) return "";
        return `
        <div class="flex gap-4">
          <div class="w-20 h-24 bg-surface-container-low overflow-hidden border border-stadium-grey shrink-0">
            <img src="${p.img}" class="w-full h-full object-cover" alt="${p.name}"/>
          </div>
          <div class="flex-1 flex flex-col gap-1">
            <div class="flex justify-between gap-2">
              <span class="font-body-md text-body-md text-primary">${p.name}</span>
              <span class="font-price-display text-price-display text-primary whitespace-nowrap">${formatPrice(cartItemUnitPrice(item) * item.qty)}</span>
            </div>
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">${cartItemOptionsLabel(item)}</span>
            <button data-idx="${idx}" class="cart-remove font-label-sm text-label-sm text-on-surface-variant hover:text-kit-accent-red uppercase tracking-widest w-fit mt-1">Remove</button>
          </div>
        </div>`;
      })
      .join("");
    itemsHost.querySelectorAll(".cart-remove").forEach(btn =>
      btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.idx)))
    );
  }
  if (subtotalEl) subtotalEl.textContent = formatPrice(cartSubtotal());
}

function openCart() {
  document.getElementById("cart-drawer")?.classList.remove("translate-x-full");
  document.getElementById("cart-overlay")?.classList.remove("hidden");
}
function closeCart() {
  document.getElementById("cart-drawer")?.classList.add("translate-x-full");
  document.getElementById("cart-overlay")?.classList.add("hidden");
}

/* ---------- Product card renderers ---------- */

function badgeLabel(p) {
  if (p.soldOut) return "Sold Out";
  return p.badge;
}

/* Compact card used on Home + On Hand pages */
function productCardCompact(p) {
  const badge = badgeLabel(p);
  return `
  <a href="product.html?slug=${p.slug}" class="group flex flex-col gap-4">
    <div class="relative aspect-[3/4] bg-surface-container-low overflow-hidden shadow-lg border border-transparent group-hover:border-stadium-grey transition-all duration-500">
      ${badge ? `<div class="absolute top-4 left-4 z-10 border border-stadium-grey bg-pitch-black/80 backdrop-blur-sm px-3 py-1 font-label-sm text-label-sm text-primary uppercase tracking-widest shadow-sm">${badge}</div>` : ""}
      ${p.soldOut ? `<div class="absolute inset-0 bg-pitch-black/40 z-10 flex items-center justify-center"><span class="font-headline-md text-headline-md text-primary uppercase tracking-widest transform -rotate-12 bg-pitch-black border border-stadium-grey px-4 py-2">Sold Out</span></div>` : ""}
      <img alt="${p.name}" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out ${p.soldOut ? "grayscale" : ""}" src="${p.img}"/>
    </div>
    <div class="flex flex-col gap-1">
      <div class="flex justify-between items-start gap-4">
        <h3 class="font-body-md text-body-md text-primary truncate">${p.name}</h3>
        <span class="font-price-display text-price-display text-primary whitespace-nowrap">${isCustomizable(p) ? "From " + formatPrice(getDisplayFromPrice(p)) : formatPrice(p.price)}</span>
      </div>
      <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">${[p.player, p.condition].filter(Boolean).join(" • ")}</p>
    </div>
  </a>`;
}

/* Large "artifact" card used on Shop page */
function productCardArtifact(p) {
  const badge = badgeLabel(p);
  return `
  <div class="group border-b md:border-r border-stadium-grey flex flex-col relative overflow-hidden bg-charcoal-depth h-full min-h-[440px] hover:bg-surface-container-low transition-colors duration-500">
    ${p.soldOut ? `<div class="absolute inset-0 bg-pitch-black/60 z-20 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"><span class="font-headline-md text-headline-md text-primary uppercase tracking-widest border border-primary px-6 py-3 bg-pitch-black/80">Sold Out</span></div>` : ""}
    <div class="absolute top-4 left-4 z-10 flex gap-2">
      <span class="px-2 py-1 border border-stadium-grey bg-pitch-black/50 backdrop-blur font-label-sm text-label-sm text-primary uppercase tracking-widest text-[10px]">${p.year}</span>
      ${badge ? `<span class="px-2 py-1 border border-kit-accent-red text-kit-accent-red bg-pitch-black/50 backdrop-blur font-label-sm text-label-sm uppercase tracking-widest text-[10px]">${badge}</span>` : ""}
    </div>
    <a href="product.html?slug=${p.slug}" class="flex-1 w-full relative overflow-hidden flex items-center justify-center p-8 mix-blend-screen ${p.soldOut ? "opacity-50 grayscale" : "opacity-90 group-hover:opacity-100"} transition-opacity">
      <img class="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-700 ease-out" src="${p.img}" alt="${p.name}"/>
    </a>
    <div class="p-6 border-t border-stadium-grey bg-pitch-black flex flex-col gap-2 z-10 relative ${p.soldOut ? "opacity-50" : ""}">
      <div class="flex justify-between items-start">
        <a href="product.html?slug=${p.slug}" class="flex-1 min-w-0"><h3 class="font-headline-md text-headline-md text-primary uppercase leading-tight line-clamp-2 break-words hover:text-surface-tint transition-colors">${p.team}</h3></a>
        <span class="font-price-display text-price-display text-primary shrink-0">${isCustomizable(p) ? "From " + formatPrice(getDisplayFromPrice(p)) : formatPrice(p.price)}</span>
      </div>
      <div class="flex justify-between items-end mt-2">
        <div class="flex flex-col">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">${p.player}</span>
          <span class="font-body-md text-body-md text-on-surface-variant mt-1 text-sm">Size ${p.sizes.length > 1 ? p.sizes[0] + "-" + p.sizes[p.sizes.length - 1] : p.sizes[0]} • ${p.condition}</span>
        </div>
        ${
          p.soldOut || isCustomizable(p)
            ? ""
            : `<button data-slug="${p.slug}" class="quick-add w-10 h-10 border border-stadium-grey flex items-center justify-center rounded-full hover:border-primary hover:bg-primary hover:text-pitch-black transition-all group/btn">
          <span class="material-symbols-outlined text-[18px] group-hover/btn:scale-110 transition-transform">add</span>
        </button>`
        }
      </div>
    </div>
  </div>`;
}

function wireQuickAdd(container) {
  container.querySelectorAll(".quick-add").forEach(btn =>
    btn.addEventListener("click", e => {
      e.preventDefault();
      const p = getProductBySlug(btn.dataset.slug);
      if (p) addToCart(p.slug, p.sizes[0], 1);
    })
  );
}

document.addEventListener("DOMContentLoaded", loadLayout);
