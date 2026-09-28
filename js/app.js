// ====================================================================
// L'ÉLIXIR ROYALE - STOREFRONT APPLICATION JAVASCRIPT
// Direct In-Website Ordering, Luxury Cart, Notes Modal, & Order Tracking
// ====================================================================

// Application State
const AppState = {
  perfumes: [],
  cart: [],
  currentCategory: "all",
  searchQuery: "",
  freeSampleSelected: "Sapphire Nocturne (3ml Flaconette)",
  luxuryPackaging: true
};

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  loadLocalCart();
  setupEventListeners();
  await loadPerfumes();
  renderFreeSamplesOptions();
  renderCart();
  checkSupabaseBadge();
});

// Check Supabase connection health badge in navbar
async function checkSupabaseBadge() {
  const conn = await window.DB.checkConnection();
  const indicator = document.getElementById("supabase-status-indicator");
  if (indicator) {
    if (conn.connected) {
      indicator.title = conn.message;
      indicator.style.color = "#38BDF8";
    } else {
      indicator.title = "Supabase local mode active";
      indicator.style.color = "#94A3B8";
    }
  }
}

// 1. Load and Render Perfumes
async function loadPerfumes() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
      <div style="width: 48px; height: 48px; border: 2px solid var(--silver-light); border-top-color: var(--sapphire-neon); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
      <p style="font-family: var(--font-serif); letter-spacing: 0.15em; color: var(--silver-light);">Curating Royal Vault...</p>
    </div>
  `;

  try {
    AppState.perfumes = await window.DB.getPerfumes();
    renderFilteredPerfumes();
  } catch (err) {
    console.error("Error loading perfumes:", err);
    grid.innerHTML = `<p style="text-align: center; color: var(--danger-color); grid-column: 1/-1;">Could not load perfumes. Please refresh.</p>`;
  }
}

function renderFilteredPerfumes() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  let filtered = AppState.perfumes;

  // Filter by category
  if (AppState.currentCategory !== "all") {
    filtered = filtered.filter(p => p.category.toLowerCase().includes(AppState.currentCategory.toLowerCase()));
  }

  // Filter by search query
  if (AppState.searchQuery.trim() !== "") {
    const q = AppState.searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(q)) ||
      (p.top_notes && p.top_notes.toLowerCase().includes(q)) ||
      (p.heart_notes && p.heart_notes.toLowerCase().includes(q)) ||
      (p.base_notes && p.base_notes.toLowerCase().includes(q))
    );
  }

  if (AppState.perfumes.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4.5rem 1.5rem; background: var(--bg-card); border: 1px dashed var(--silver-border); border-radius: var(--radius-lg); max-width: 650px; margin: 0 auto;">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(6, 13, 30, 0.8) 70%); border: 1px solid var(--silver-light); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: var(--silver-pure);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <h3 style="font-family: var(--font-serif); font-size: 1.4rem; color: #FFF; margin-bottom: 0.6rem; letter-spacing: 0.1em;">The Royal Vault is Ready</h3>
        <p style="font-size: 0.9rem; color: var(--silver-muted); margin-bottom: 1.8rem; line-height: 1.6;">
          Abhi isme koi product add nahi hai. Aap apne perfumes, prices, packaging, aur images <strong>Admin Panel</strong> se khud add kar sakte hain.
        </p>
        <a href="admin.html" class="btn btn-silver">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Go to Admin Panel to Add Products
        </a>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
        <p style="font-family: var(--font-serif); font-size: 1.1rem; color: var(--silver-light); margin-bottom: 0.8rem;">No Fragrances Found</p>
        <p style="font-size: 0.85rem; color: var(--silver-muted);">Try selecting another category or clear your search criteria.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(perfume => `
    <div class="product-card" data-id="${perfume.id}">
      <div class="product-img-box">
        <img src="${perfume.image_url}" alt="${perfume.name}" class="product-img" loading="lazy" />
        ${perfume.badge ? `<span class="product-badge">${perfume.badge}</span>` : ''}
        <span class="product-volume-tag">${perfume.volume || '100ml Extrait'}</span>
      </div>

      <div class="product-info">
        <div class="product-category-row">
          <span class="product-category">${perfume.category}</span>
          <div class="product-rating">
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>${perfume.rating || '4.9'}</span>
          </div>
        </div>

        <h3 class="product-name">${perfume.name}</h3>
        <p class="product-subtitle">${perfume.subtitle || 'Exquisite royal extrait crafted with precious silver accents.'}</p>

        <!-- Notes Accord Preview -->
        <div class="product-notes-preview">
          <span class="notes-label">Olfactory Signature</span>
          <div>${perfume.top_notes ? perfume.top_notes.split(',').slice(0, 2).join(' • ') : 'Iced Bergamot • Silver Oud'}</div>
        </div>

        <div class="product-price-row">
          <div class="product-price-box">
            ${perfume.old_price ? `<span class="product-old-price">Rs. ${Number(perfume.old_price).toLocaleString()}</span>` : ''}
            <span class="product-price">Rs. ${Number(perfume.price).toLocaleString()}</span>
          </div>

          <div class="product-actions-btn-group">
            <button class="btn-icon-view" onclick="openQuickView('${perfume.id}')" title="Fragrance Notes & Packaging Details">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <button class="btn btn-silver" onclick="addToCart('${perfume.id}')" style="padding: 0.6rem 1.1rem; font-size: 0.76rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              Acquire
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// 2. Olfactory Quick View & Packaging Modal
function openQuickView(perfumeId) {
  const perfume = AppState.perfumes.find(p => p.id === perfumeId);
  if (!perfume) return;

  const modalBody = document.getElementById("quickview-modal-body");
  if (!modalBody) return;

  modalBody.innerHTML = `
    <div class="quickview-grid">
      <div>
        <img src="${perfume.image_url}" alt="${perfume.name}" class="quickview-img" />
        <div style="margin-top: 1rem; text-align: center;">
          <span class="badge-silver" style="font-size: 0.72rem; padding: 0.35rem 0.9rem; border-radius: var(--radius-full); border: 1px solid var(--silver-light); background: rgba(226,232,240,0.1);">
            100% Authentic Handcrafted Haute Parfumerie
          </span>
        </div>
      </div>

      <div>
        <span class="product-category">${perfume.category}</span>
        <h2 style="font-size: 1.8rem; margin: 0.3rem 0 0.6rem; color: #FFF;">${perfume.name}</h2>
        <p style="font-size: 0.92rem; color: var(--silver-muted); line-height: 1.6; margin-bottom: 1.2rem;">${perfume.subtitle || ''}</p>

        <div style="display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem;">
          <span style="font-family: var(--font-serif); font-size: 1.6rem; font-weight: 700; color: #FFF;">Rs. ${Number(perfume.price).toLocaleString()}</span>
          ${perfume.old_price ? `<span style="text-decoration: line-through; color: var(--silver-dark); font-size: 0.95rem;">Rs. ${Number(perfume.old_price).toLocaleString()}</span>` : ''}
          <span style="font-size: 0.75rem; background: rgba(56, 189, 248, 0.15); color: var(--sapphire-neon); padding: 0.2rem 0.6rem; border-radius: 4px;">In Stock (${perfume.stock || 'Vault Stock'} left)</span>
        </div>

        <!-- Olfactory Pyramid -->
        <h4 style="font-size: 0.85rem; letter-spacing: 0.12em; color: var(--silver-light); margin-bottom: 0.6rem;">Olfactory Pyramid</h4>
        <div class="olfactory-pyramid">
          <div class="olfactory-tier">
            <div class="tier-title">Top Notes (First Impression)</div>
            <div class="tier-notes">${perfume.top_notes || 'Frosted Bergamot, Crisp Cardamom'}</div>
          </div>
          <div class="olfactory-tier">
            <div class="tier-title">Heart Notes (Character & Sillage)</div>
            <div class="tier-notes">${perfume.heart_notes || 'Royal Blue Iris, Turkish Damask Rose'}</div>
          </div>
          <div class="olfactory-tier">
            <div class="tier-title">Base Notes (Enduring Longevity)</div>
            <div class="tier-notes">${perfume.base_notes || 'Rare Silver Oud, Ambergris, Cashmere Woods'}</div>
          </div>
        </div>

        <!-- Expensive Packaging Presentation Details -->
        <div class="packaging-highlight-box">
          <strong style="color: #FFF; display: block; margin-bottom: 0.3rem;">👑 The Packaging Experience:</strong>
          ${perfume.packaging || 'Delivered in a handcrafted midnight navy wooden chest with polished silver crest, lined with crush-resistant royal sapphire velvet, custom silver wax certificate, and magnetic flacon collar.'}
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button class="btn btn-silver" onclick="addToCart('${perfume.id}'); closeQuickView();" style="flex: 1;">
            Add to Luxury Bag
          </button>
          <button class="btn btn-sapphire" onclick="addToCart('${perfume.id}'); closeQuickView(); openCheckout();" style="flex: 1;">
            Acquire Now
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("quickview-modal").classList.add("open");
}

function closeQuickView() {
  const modal = document.getElementById("quickview-modal");
  if (modal) modal.classList.remove("open");
}

// 3. Cart Management
function loadLocalCart() {
  const saved = localStorage.getItem(STORAGE_KEYS.CART);
  AppState.cart = saved ? JSON.parse(saved) : [];
  updateCartBadge();
}

function saveLocalCart() {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(AppState.cart));
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const count = AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById("cart-badge-count");
  if (badge) {
    badge.innerText = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
}

function addToCart(perfumeId) {
  const perfume = AppState.perfumes.find(p => p.id === perfumeId);
  if (!perfume) return;

  const existing = AppState.cart.find(item => item.id === perfumeId);
  if (existing) {
    existing.quantity += 1;
  } else {
    AppState.cart.push({
      id: perfume.id,
      name: perfume.name,
      price: perfume.price,
      volume: perfume.volume || "100ml Extrait",
      image_url: perfume.image_url,
      quantity: 1
    });
  }

  saveLocalCart();
  showToast(`Added "${perfume.name}" to your luxury bag.`);
  openCartDrawer();
}

function updateCartQty(perfumeId, delta) {
  const item = AppState.cart.find(i => i.id === perfumeId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    AppState.cart = AppState.cart.filter(i => i.id !== perfumeId);
  }
  saveLocalCart();
}

function removeCartItem(perfumeId) {
  AppState.cart = AppState.cart.filter(i => i.id !== perfumeId);
  saveLocalCart();
}

function renderCart() {
  const container = document.getElementById("cart-items-container");
  const subtotalEl = document.getElementById("cart-subtotal-val");
  const totalEl = document.getElementById("cart-total-val");
  const checkoutBtn = document.getElementById("cart-checkout-btn");

  if (!container) return;

  if (AppState.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        <p style="font-family: var(--font-serif); font-size: 1.1rem; color: #FFF; margin-bottom: 0.5rem;">Your Luxury Bag is Empty</p>
        <p style="font-size: 0.85rem; color: var(--silver-muted);">Select from our royal flacon collection to begin your experience.</p>
      </div>
    `;
    if (subtotalEl) subtotalEl.innerText = "Rs. 0";
    if (totalEl) totalEl.innerText = "Rs. 0";
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;

  let subtotal = 0;
  container.innerHTML = AppState.cart.map(item => {
    subtotal += item.price * item.quantity;
    return `
      <div class="cart-item">
        <img src="${item.image_url}" alt="${item.name}" class="cart-item-img" />
        <div class="cart-item-details">
          <h4 class="cart-item-name">${item.name}</h4>
          <p class="cart-item-volume">${item.volume}</p>
          <div class="cart-item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</div>
          
          <div class="cart-item-qty-row">
            <div class="qty-control">
              <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)">−</button>
              <span class="qty-display">${item.quantity}</span>
              <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeCartItem('${item.id}')" title="Remove Item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (subtotalEl) subtotalEl.innerText = `Rs. ${subtotal.toLocaleString()}`;
  if (totalEl) totalEl.innerText = `Rs. ${subtotal.toLocaleString()}`;
}

function renderFreeSamplesOptions() {
  const select = document.getElementById("free-sample-select");
  if (!select) return;

  select.innerHTML = LUXURY_FREE_SAMPLES.map(s => `
    <option value="${s.name}">${s.name}</option>
  `).join('');
}

function openCartDrawer() {
  document.getElementById("cart-drawer-overlay").classList.add("open");
  document.getElementById("cart-drawer").classList.add("open");
}

function closeCartDrawer() {
  document.getElementById("cart-drawer-overlay").classList.remove("open");
  document.getElementById("cart-drawer").classList.remove("open");
}

// 4. In-Website Direct Checkout Flow (NO WhatsApp!)
function openCheckout() {
  if (AppState.cart.length === 0) {
    showToast("Your cart is empty. Please select a perfume first.");
    return;
  }
  closeCartDrawer();
  renderCheckoutSummary();
  document.getElementById("checkout-modal").classList.add("open");
}

function closeCheckout() {
  document.getElementById("checkout-modal").classList.remove("open");
}

function renderCheckoutSummary() {
  const container = document.getElementById("checkout-items-list");
  const subtotalEl = document.getElementById("checkout-subtotal-val");
  const totalEl = document.getElementById("checkout-total-val");
  const sampleNoteEl = document.getElementById("checkout-sample-note");

  if (!container) return;

  let subtotal = 0;
  container.innerHTML = AppState.cart.map(item => {
    subtotal += item.price * item.quantity;
    return `
      <div class="checkout-item-mini">
        <span>${item.name} × ${item.quantity}</span>
        <strong style="color: #FFF;">Rs. ${(item.price * item.quantity).toLocaleString()}</strong>
      </div>
    `;
  }).join('');

  const sampleSelect = document.getElementById("free-sample-select");
  const sampleName = sampleSelect ? sampleSelect.value : "Complimentary 3ml Flaconette";
  if (sampleNoteEl) {
    sampleNoteEl.innerText = sampleName;
  }

  if (subtotalEl) subtotalEl.innerText = `Rs. ${subtotal.toLocaleString()}`;
  if (totalEl) totalEl.innerText = `Rs. ${subtotal.toLocaleString()}`;
}

// Select Payment Method in Checkout
let selectedPaymentMethod = "Cash on Delivery (COD)";
function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  document.querySelectorAll(".payment-method-card").forEach(c => c.classList.remove("active"));
  const activeCard = document.querySelector(`.payment-method-card[data-method="${method}"]`);
  if (activeCard) activeCard.classList.add("active");

  const bankBox = document.getElementById("bank-details-box");
  if (bankBox) {
    bankBox.style.display = method.includes("Bank") ? "block" : "none";
  }
}

// Handle Order Submission (Straight into Supabase / local backup)
async function submitOrder(event) {
  event.preventDefault();

  const nameInput = document.getElementById("order-name");
  const emailInput = document.getElementById("order-email");
  const phoneInput = document.getElementById("order-phone");
  const addressInput = document.getElementById("order-address");
  const cityInput = document.getElementById("order-city");
  const postalInput = document.getElementById("order-postal");
  const notesInput = document.getElementById("order-notes");
  const giftMsgInput = document.getElementById("order-gift-msg");
  const refInput = document.getElementById("order-payment-ref");

  if (!nameInput.value.trim() || !phoneInput.value.trim() || !addressInput.value.trim() || !cityInput.value.trim()) {
    showToast("Please complete all required shipping fields.");
    return;
  }

  const subtotal = AppState.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const sampleSelect = document.getElementById("free-sample-select");
  const sampleVal = sampleSelect ? sampleSelect.value : "";
  const giftPackagingCheck = document.getElementById("luxury-gift-toggle");

  const submitBtn = document.getElementById("order-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div style="width: 18px; height: 18px; border: 2px solid #FFF; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      Securing Order...
    `;
  }

  const orderData = {
    customer_name: nameInput.value.trim(),
    customer_email: emailInput.value.trim() || "guest@jcdperfumes.com",
    customer_phone: phoneInput.value.trim(),
    address: addressInput.value.trim(),
    city: cityInput.value.trim(),
    postal_code: postalInput ? postalInput.value.trim() : "",
    delivery_notes: notesInput ? notesInput.value.trim() : "",
    gift_message: giftMsgInput ? giftMsgInput.value.trim() : "",
    luxury_packaging: giftPackagingCheck ? giftPackagingCheck.checked : true,
    free_sample: sampleVal,
    items: AppState.cart,
    subtotal: subtotal,
    shipping_cost: 0,
    total_amount: subtotal,
    payment_method: selectedPaymentMethod,
    payment_reference: refInput ? refInput.value.trim() : ""
  };

  try {
    const result = await window.DB.createOrder(orderData);
    
    // Clear Cart
    AppState.cart = [];
    saveLocalCart();

    // Show Confirmation Screen
    showOrderSuccess(result.orderNumber, orderData, result.savedToSupabase);
  } catch (err) {
    console.error("Order processing error:", err);
    showToast("There was an issue processing your order. Please try again.");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Place Royal Order";
    }
  }
}

function showOrderSuccess(orderNumber, orderData, savedToSupabase) {
  const modalBody = document.querySelector("#checkout-modal .modal-body");
  if (!modalBody) return;

  modalBody.innerHTML = `
    <div class="order-success-box">
      <div class="order-success-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>

      <span class="section-subtitle">Royal Acquisition Confirmed</span>
      <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem; color: #FFF;">Thank You, ${orderData.customer_name}</h2>
      <p style="font-size: 0.9rem; color: var(--silver-muted); max-width: 500px; margin: 0 auto;">
        Your bespoke order has been registered in our vault. Your fragrances will be carefully prepared in our signature midnight velvet casket.
      </p>

      <div class="order-number-display">
        ${orderNumber}
      </div>
      <p style="font-size: 0.78rem; color: var(--silver-light); margin-bottom: 1.8rem;">
        Keep this Order Number to track your insured delivery at any time.
        ${savedToSupabase ? '<br><span style="color: var(--sapphire-neon); font-size: 0.72rem;">● Synchronized with Supabase Cloud Database</span>' : ''}
      </p>

      <div style="background: rgba(6, 13, 30, 0.7); border: 1px solid var(--silver-border); border-radius: var(--radius-md); padding: 1.4rem; text-align: left; max-width: 500px; margin: 0 auto 2rem; font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--silver-muted);">Shipping Address:</span>
          <span style="color: #FFF; text-align: right;">${orderData.address}, ${orderData.city}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--silver-muted);">Payment Method:</span>
          <span style="color: #FFF;">${orderData.payment_method}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--silver-muted);">Free Sample Included:</span>
          <span style="color: var(--sapphire-neon);">${orderData.free_sample || 'Included'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(148, 163, 184, 0.2); padding-top: 0.6rem; margin-top: 0.6rem; font-weight: 700;">
          <span style="color: #FFF;">Total Amount:</span>
          <span style="color: var(--silver-pure); font-size: 1.05rem;">Rs. ${Number(orderData.total_amount).toLocaleString()}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: center; gap: 1rem;">
        <button class="btn btn-silver" onclick="closeCheckout(); window.location.reload();">
          Return to Boutique
        </button>
        <button class="btn btn-outline-silver" onclick="printInvoice('${orderNumber}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Print Receipt
        </button>
      </div>
    </div>
  `;
}

function printInvoice(orderNumber) {
  window.print();
}

// 5. Order Tracking by Order Number
async function trackOrder() {
  const input = document.getElementById("order-tracking-input");
  const resultBox = document.getElementById("tracking-result-box");
  if (!input || !resultBox) return;

  const orderNum = input.value.trim();
  if (!orderNum) {
    showToast("Please enter an Order Number (e.g. JCD-892415).");
    return;
  }

  resultBox.style.display = "block";
  resultBox.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div style="width: 32px; height: 32px; border: 2px solid var(--silver-light); border-top-color: var(--sapphire-neon); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem;"></div>
      <p style="font-size: 0.85rem; color: var(--silver-light);">Searching Royal Vault Dispatch records...</p>
    </div>
  `;

  try {
    const order = await window.DB.getOrderByNumber(orderNum);
    if (!order) {
      resultBox.innerHTML = `
        <div style="text-align: center; padding: 1.5rem;">
          <p style="color: var(--danger-color); font-weight: 600; margin-bottom: 0.4rem;">Order Number Not Found</p>
          <p style="font-size: 0.82rem; color: var(--silver-muted);">Please verify the reference code printed on your receipt or confirmation email.</p>
        </div>
      `;
      return;
    }

    // Determine status index
    const statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
    const currentIdx = Math.max(0, statuses.findIndex(s => s.toLowerCase() === (order.status || "pending").toLowerCase()));

    resultBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--silver-border); padding-bottom: 1rem; flex-wrap: gap;">
        <div>
          <span style="font-size: 0.72rem; color: var(--silver-muted); text-transform: uppercase;">Order Number</span>
          <h3 style="font-size: 1.25rem; color: var(--sapphire-neon); font-family: var(--font-serif);">${order.order_number}</h3>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.72rem; color: var(--silver-muted); text-transform: uppercase;">Status</span>
          <div><span class="badge-silver" style="font-size: 0.8rem; background: rgba(56, 189, 248, 0.15); color: #FFF; border: 1px solid var(--sapphire-neon); padding: 0.25rem 0.8rem; border-radius: var(--radius-full);">${order.status || 'Pending'}</span></div>
        </div>
      </div>

      <!-- Tracking Timeline -->
      <div class="tracking-timeline">
        <div class="timeline-step ${currentIdx >= 0 ? (currentIdx === 0 ? 'active' : 'completed') : ''}">
          <div class="timeline-dot">1</div>
          <div class="timeline-label">Order Placed</div>
        </div>
        <div class="timeline-step ${currentIdx >= 1 ? (currentIdx === 1 ? 'active' : 'completed') : ''}">
          <div class="timeline-dot">2</div>
          <div class="timeline-label">Confirmed</div>
        </div>
        <div class="timeline-step ${currentIdx >= 2 ? (currentIdx === 2 ? 'active' : 'completed') : ''}">
          <div class="timeline-dot">3</div>
          <div class="timeline-label">Casket Packaging</div>
        </div>
        <div class="timeline-step ${currentIdx >= 3 ? (currentIdx === 3 ? 'active' : 'completed') : ''}">
          <div class="timeline-dot">4</div>
          <div class="timeline-label">Dispatched</div>
        </div>
        <div class="timeline-step ${currentIdx >= 4 ? 'completed' : ''}">
          <div class="timeline-dot">5</div>
          <div class="timeline-label">Delivered</div>
        </div>
      </div>

      <div style="background: rgba(14, 28, 62, 0.4); border-radius: var(--radius-sm); padding: 1rem; font-size: 0.84rem; color: var(--silver-light); margin-top: 1.5rem;">
        <strong>Recipient:</strong> ${order.customer_name} • <strong>City:</strong> ${order.city} • <strong>Total:</strong> Rs. ${Number(order.total_amount).toLocaleString()}
      </div>
    `;
  } catch (err) {
    console.error("Tracking lookup error:", err);
    resultBox.innerHTML = `<p style="color: var(--danger-color); text-align: center;">Error retrieving tracking details.</p>`;
  }
}

// 6. Toast Notification Helper
function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span style="color: var(--sapphire-neon);">✦</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.35s ease";
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// 7. Event Listeners Setup
function setupEventListeners() {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("open");
    });
  }

  // Category Filter Buttons
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      AppState.currentCategory = btn.getAttribute("data-category") || "all";
      renderFilteredPerfumes();
    });
  });

  // Search input
  const searchInput = document.getElementById("catalog-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      AppState.searchQuery = e.target.value;
      renderFilteredPerfumes();
    });
  }
}

// Spin Animation Injection
const style = document.createElement("style");
style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style);
