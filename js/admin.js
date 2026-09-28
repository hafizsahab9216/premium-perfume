// ====================================================================
// JCD PREMIUM PERFUMES - ADMIN PANEL CONTROLLER
// Dashboard Analytics, Order Management, Product CRUD, Supabase Sync
// ====================================================================

const AdminState = {
  authenticated: false,
  orders: [],
  perfumes: [],
  selectedOrder: null,
  activeTab: "dashboard"
};

// 1. Authentication Lockscreen
document.addEventListener("DOMContentLoaded", async () => {
  const isAuth = sessionStorage.getItem("lelixir_admin_auth");
  if (isAuth === "true") {
    unlockAdmin();
  }

  setupAdminTabs();
});

function attemptUnlock() {
  const input = document.getElementById("admin-pin-input");
  const errorEl = document.getElementById("lockscreen-error");
  if (!input) return;

  const pin = input.value.trim();
  // Default password / pin is admin123
  if (pin === "admin123" || pin === "1234" || pin === "royale") {
    sessionStorage.setItem("lelixir_admin_auth", "true");
    unlockAdmin();
  } else {
    if (errorEl) {
      errorEl.style.display = "block";
      errorEl.innerText = "Invalid Key. Default access is 'admin123'.";
    }
  }
}

function unlockAdmin() {
  AdminState.authenticated = true;
  const lockscreen = document.getElementById("admin-lockscreen");
  if (lockscreen) lockscreen.style.display = "none";

  // Load initial data
  loadAdminDashboard();
}

function adminLogout() {
  sessionStorage.removeItem("lelixir_admin_auth");
  window.location.reload();
}

// 2. Navigation Tabs
function setupAdminTabs() {
  const links = document.querySelectorAll(".admin-menu-link");
  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute("data-tab");
      if (!targetTab) return;

      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      const targetPanel = document.getElementById(`tab-${targetTab}`);
      if (targetPanel) targetPanel.classList.add("active");

      AdminState.activeTab = targetTab;
      if (targetTab === "orders") loadAdminOrders();
      if (targetTab === "products") loadAdminProducts();
      if (targetTab === "supabase") checkSupabaseHealth();
    });
  });
}

// 3. Load Dashboard & Analytics
async function loadAdminDashboard() {
  try {
    AdminState.orders = await window.DB.getAllOrders();
    AdminState.perfumes = await window.DB.getPerfumes();

    // Calculate Analytics
    const totalOrders = AdminState.orders.length;
    const totalRevenue = AdminState.orders.reduce((sum, ord) => sum + Number(ord.total_amount || 0), 0);
    const activeProducts = AdminState.perfumes.length;
    const pendingOrders = AdminState.orders.filter(o => (o.status || "").toLowerCase() === "pending").length;

    document.getElementById("stat-orders-val").innerText = totalOrders;
    document.getElementById("stat-revenue-val").innerText = `Rs. ${totalRevenue.toLocaleString()}`;
    document.getElementById("stat-products-val").innerText = activeProducts;
    document.getElementById("stat-pending-val").innerText = pendingOrders;

    // Render Recent Orders in dashboard table
    renderRecentOrdersDashboard();
    renderInventoryPreviewDashboard();
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

function renderRecentOrdersDashboard() {
  const tbody = document.getElementById("dashboard-recent-orders-tbody");
  if (!tbody) return;

  const recent = AdminState.orders.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--silver-muted);">No orders recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(o => `
    <tr>
      <td><strong style="color: var(--sapphire-neon);">${o.order_number}</strong></td>
      <td>${o.customer_name}</td>
      <td>${o.city}</td>
      <td>Rs. ${Number(o.total_amount).toLocaleString()}</td>
      <td><span class="status-badge ${o.status || 'Pending'}">${o.status || 'Pending'}</span></td>
      <td>
        <button class="btn-admin btn-admin-outline" style="padding: 0.35rem 0.7rem; font-size: 0.72rem;" onclick="viewOrderDetails('${o.id}')">
          Inspect
        </button>
      </td>
    </tr>
  `).join('');
}

function renderInventoryPreviewDashboard() {
  const grid = document.getElementById("dashboard-inventory-preview");
  if (!grid) return;

  if (AdminState.perfumes.length === 0) {
    grid.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--silver-muted); font-size: 0.85rem; border: 1px dashed var(--silver-border); border-radius: 8px;">
        <p style="margin-bottom: 0.8rem; color: #FFF;">Abhi koi perfume add nahi hai.</p>
        <button class="btn-admin btn-admin-silver" style="font-size: 0.75rem; padding: 0.45rem 0.9rem;" onclick="openAddProductModal()">
          + Add First Perfume
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = AdminState.perfumes.slice(0, 4).map(p => `
    <div style="display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem; background: rgba(4, 8, 20, 0.4); border-radius: 8px; border: 1px solid var(--silver-border);">
      <img src="${p.image_url}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px;" />
      <div style="flex-grow: 1;">
        <h5 style="font-size: 0.82rem; color: #FFF;">${p.name}</h5>
        <span style="font-size: 0.7rem; color: var(--silver-muted);">${p.stock || 20} in stock • Rs. ${Number(p.price).toLocaleString()}</span>
      </div>
    </div>
  `).join('');
}

// 4. Orders Management Tab
async function loadAdminOrders() {
  const tbody = document.getElementById("orders-table-tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem;">Loading orders...</td></tr>`;

  AdminState.orders = await window.DB.getAllOrders();
  renderOrdersTable(AdminState.orders);
}

function renderOrdersTable(orderList) {
  const tbody = document.getElementById("orders-table-tbody");
  if (!tbody) return;

  if (orderList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--silver-muted);">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = orderList.map(order => `
    <tr>
      <td><strong style="color: var(--sapphire-neon); font-family: var(--font-serif);">${order.order_number}</strong></td>
      <td>${new Date(order.created_at).toLocaleDateString()}</td>
      <td>
        <div style="font-weight: 600; color: #FFF;">${order.customer_name}</div>
        <div style="font-size: 0.72rem; color: var(--silver-muted);">${order.customer_phone}</div>
      </td>
      <td>${order.city}</td>
      <td>${Array.isArray(order.items) ? order.items.length : 1} Flacon(s)</td>
      <td><strong>Rs. ${Number(order.total_amount).toLocaleString()}</strong></td>
      <td>
        <select class="admin-select" style="padding: 0.35rem 0.6rem; font-size: 0.75rem; width: auto;" onchange="changeOrderStatus('${order.id}', this.value)">
          <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td>
        <div style="display: flex; gap: 0.4rem;">
          <button class="btn-admin btn-admin-outline" style="padding: 0.35rem 0.65rem; font-size: 0.72rem;" onclick="viewOrderDetails('${order.id}')" title="Full Order Dossier">
            View
          </button>
          <button class="btn-admin btn-admin-outline" style="padding: 0.35rem 0.5rem; font-size: 0.72rem; color: var(--status-cancelled);" onclick="deleteOrder('${order.id}')" title="Delete">
            ✕
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterOrdersByStatus(status) {
  if (status === "all") {
    renderOrdersTable(AdminState.orders);
  } else {
    const filtered = AdminState.orders.filter(o => (o.status || "").toLowerCase() === status.toLowerCase());
    renderOrdersTable(filtered);
  }
}

function searchOrders(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderOrdersTable(AdminState.orders);
    return;
  }
  const filtered = AdminState.orders.filter(o => 
    o.order_number.toLowerCase().includes(q) ||
    o.customer_name.toLowerCase().includes(q) ||
    o.customer_phone.toLowerCase().includes(q) ||
    o.city.toLowerCase().includes(q)
  );
  renderOrdersTable(filtered);
}

async function changeOrderStatus(orderId, newStatus) {
  await window.DB.updateOrderStatus(orderId, newStatus);
  showAdminToast(`Order status updated to ${newStatus}`);
  loadAdminDashboard();
}

async function deleteOrder(orderId) {
  if (confirm("Are you certain you wish to purge this order from the vault ledger?")) {
    await window.DB.deleteOrder(orderId);
    showAdminToast("Order deleted.");
    loadAdminOrders();
    loadAdminDashboard();
  }
}

function viewOrderDetails(orderId) {
  const order = AdminState.orders.find(o => o.id === orderId);
  if (!order) return;

  const modalBody = document.getElementById("order-details-modal-body");
  if (!modalBody) return;

  const itemsList = Array.isArray(order.items) ? order.items : [];

  modalBody.innerHTML = `
    <div style="border-bottom: 1px solid var(--silver-border); padding-bottom: 1.2rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span style="font-size: 0.75rem; color: var(--silver-muted); text-transform: uppercase;">Royal Order Reference</span>
        <h2 style="color: var(--sapphire-neon); font-family: var(--font-serif); font-size: 1.5rem;">${order.order_number}</h2>
        <span style="font-size: 0.78rem; color: var(--silver-light);">${new Date(order.created_at).toLocaleString()}</span>
      </div>
      <div>
        <span class="status-badge ${order.status || 'Pending'}" style="font-size: 0.85rem; padding: 0.4rem 1rem;">${order.status || 'Pending'}</span>
      </div>
    </div>

    <!-- Customer & Shipping Dossier -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; background: rgba(4, 8, 20, 0.4); padding: 1.2rem; border-radius: 8px; border: 1px solid var(--silver-border);">
      <div>
        <h4 style="font-size: 0.8rem; color: var(--silver-muted); margin-bottom: 0.5rem;">Client Identity</h4>
        <p><strong>Name:</strong> ${order.customer_name}</p>
        <p><strong>Phone:</strong> ${order.customer_phone}</p>
        <p><strong>Email:</strong> ${order.customer_email || 'Not provided'}</p>
      </div>
      <div>
        <h4 style="font-size: 0.8rem; color: var(--silver-muted); margin-bottom: 0.5rem;">Delivery Destination</h4>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>City / Zip:</strong> ${order.city} ${order.postal_code || ''}</p>
        ${order.delivery_notes ? `<p><strong>Instructions:</strong> <em>${order.delivery_notes}</em></p>` : ''}
      </div>
    </div>

    <!-- Packaging & Addons -->
    <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(30, 64, 175, 0.15); border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.25);">
      <h4 style="font-size: 0.8rem; color: var(--sapphire-neon); margin-bottom: 0.4rem;">Luxury Packaging &amp; Sample</h4>
      <p><strong>Gift Packaging Casket:</strong> ${order.luxury_packaging ? 'Midnight Velvet Casket Included (Complimentary)' : 'Standard'}</p>
      <p><strong>Complimentary Sample:</strong> ${order.free_sample || 'Standard 3ml Selection'}</p>
      ${order.gift_message ? `<p style="margin-top: 0.5rem; font-style: italic; color: #FFF;">"Gift Card Note: ${order.gift_message}"</p>` : ''}
    </div>

    <!-- Items Ordered -->
    <h4 style="font-size: 0.85rem; margin-bottom: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em;">Flacons in Dispatch</h4>
    <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.5rem;">
      ${itemsList.map(item => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.7rem; background: rgba(4, 8, 20, 0.6); border-radius: 6px; border: 1px solid var(--silver-border);">
          <div style="display: flex; align-items: center; gap: 0.8rem;">
            <img src="${item.image_url}" style="width: 40px; height: 45px; object-fit: cover; border-radius: 4px;" />
            <div>
              <div style="font-weight: 600; color: #FFF;">${item.name}</div>
              <div style="font-size: 0.72rem; color: var(--silver-muted);">${item.volume || '100ml Extrait'} • Qty: ${item.quantity}</div>
            </div>
          </div>
          <div style="font-weight: 700; color: var(--silver-pure);">
            Rs. ${(item.price * item.quantity).toLocaleString()}
          </div>
        </div>
      `).join('')}
    </div>

    <div style="border-top: 1px solid var(--silver-border); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span style="font-size: 0.75rem; color: var(--silver-muted);">Payment Method:</span>
        <div><strong>${order.payment_method}</strong> ${order.payment_reference ? `(Ref: ${order.payment_reference})` : ''}</div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 0.75rem; color: var(--silver-muted);">Grand Total:</span>
        <div style="font-family: var(--font-serif); font-size: 1.4rem; color: var(--silver-pure); font-weight: 700;">
          Rs. ${Number(order.total_amount).toLocaleString()}
        </div>
      </div>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.8rem;">
      <button class="btn-admin btn-admin-outline" onclick="window.print()">Print Packing Slip</button>
      <button class="btn-admin btn-admin-silver" onclick="closeOrderDetailsModal()">Close</button>
    </div>
  `;

  document.getElementById("order-details-modal").classList.add("open");
}

function closeOrderDetailsModal() {
  const modal = document.getElementById("order-details-modal");
  if (modal) modal.classList.remove("open");
}

// 5. Products Management Tab
async function loadAdminProducts() {
  const tbody = document.getElementById("products-table-tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">Loading Royal Catalog...</td></tr>`;
  AdminState.perfumes = await window.DB.getPerfumes();
  renderProductsTable(AdminState.perfumes);
}

function renderProductsTable(perfumes) {
  const tbody = document.getElementById("products-table-tbody");
  if (!tbody) return;

  if (perfumes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3.5rem 1rem;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(56, 189, 248, 0.1); border: 1px solid var(--silver-border); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.2rem; color: var(--silver-pure);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <h4 style="font-family: var(--font-serif); font-size: 1.15rem; color: #FFF; margin-bottom: 0.5rem;">The Perfume Vault is Empty</h4>
          <p style="font-size: 0.85rem; color: var(--silver-muted); margin-bottom: 1.5rem; max-width: 480px; margin-left: auto; margin-right: auto;">
            Koi dummy product shamil nahi kiya gaya hai. Niche button par click karke apna pehla perfume add karein.
          </p>
          <button class="btn-admin btn-admin-silver" onclick="openAddProductModal()">
            + Add Your First Fragrance
          </button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = perfumes.map(p => `
    <tr>
      <td>
        <img src="${p.image_url}" style="width: 48px; height: 55px; object-fit: cover; border-radius: 6px; border: 1px solid var(--silver-border);" />
      </td>
      <td>
        <div style="font-weight: 600; color: #FFF;">${p.name}</div>
        <div style="font-size: 0.72rem; color: var(--silver-muted);">${p.volume || '100ml Extrait'}</div>
      </td>
      <td><span style="font-size: 0.75rem; color: var(--sapphire-neon);">${p.category}</span></td>
      <td>
        <div><strong>Rs. ${Number(p.price).toLocaleString()}</strong></div>
        ${p.old_price ? `<div style="font-size: 0.72rem; text-decoration: line-through; color: var(--silver-muted);">Rs. ${Number(p.old_price).toLocaleString()}</div>` : ''}
      </td>
      <td>${p.stock || 20}</td>
      <td><span class="status-badge Confirmed">${p.badge || 'Available'}</span></td>
      <td>
        <div style="display: flex; gap: 0.4rem;">
          <button class="btn-admin btn-admin-outline" style="padding: 0.35rem 0.6rem; font-size: 0.72rem;" onclick="openEditProductModal('${p.id}')">
            Edit
          </button>
          <button class="btn-admin btn-admin-outline" style="padding: 0.35rem 0.5rem; font-size: 0.72rem; color: var(--status-cancelled);" onclick="deletePerfume('${p.id}')">
            ✕
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Add/Edit Product Modal
function openAddProductModal() {
  document.getElementById("product-modal-title").innerText = "Add Royal Perfume Flacon";
  document.getElementById("product-form").reset();
  document.getElementById("product-edit-id").value = "";
  document.getElementById("product-modal").classList.add("open");
}

function openEditProductModal(perfumeId) {
  const p = AdminState.perfumes.find(item => item.id === perfumeId);
  if (!p) return;

  document.getElementById("product-modal-title").innerText = `Edit "${p.name}"`;
  document.getElementById("product-edit-id").value = p.id;
  document.getElementById("perfume-name").value = p.name;
  document.getElementById("perfume-subtitle").value = p.subtitle || "";
  document.getElementById("perfume-category").value = p.category;
  document.getElementById("perfume-price").value = p.price;
  document.getElementById("perfume-old-price").value = p.old_price || "";
  document.getElementById("perfume-volume").value = p.volume || "100ml Extrait de Parfum";
  document.getElementById("perfume-stock").value = p.stock || 20;
  document.getElementById("perfume-badge").value = p.badge || "";
  document.getElementById("perfume-top-notes").value = p.top_notes || "";
  document.getElementById("perfume-heart-notes").value = p.heart_notes || "";
  document.getElementById("perfume-base-notes").value = p.base_notes || "";
  document.getElementById("perfume-packaging").value = p.packaging || "";
  document.getElementById("perfume-image").value = p.image_url;

  document.getElementById("product-modal").classList.add("open");
}

function closeProductModal() {
  document.getElementById("product-modal").classList.remove("open");
}

async function saveProductForm(e) {
  e.preventDefault();

  const id = document.getElementById("product-edit-id").value;
  const payload = {
    name: document.getElementById("perfume-name").value.trim(),
    subtitle: document.getElementById("perfume-subtitle").value.trim(),
    category: document.getElementById("perfume-category").value,
    price: Number(document.getElementById("perfume-price").value),
    old_price: document.getElementById("perfume-old-price").value ? Number(document.getElementById("perfume-old-price").value) : null,
    volume: document.getElementById("perfume-volume").value.trim(),
    stock: Number(document.getElementById("perfume-stock").value),
    badge: document.getElementById("perfume-badge").value.trim(),
    top_notes: document.getElementById("perfume-top-notes").value.trim(),
    heart_notes: document.getElementById("perfume-heart-notes").value.trim(),
    base_notes: document.getElementById("perfume-base-notes").value.trim(),
    packaging: document.getElementById("perfume-packaging").value.trim(),
    image_url: document.getElementById("perfume-image").value.trim()
  };

  if (id) {
    await window.DB.updatePerfume(id, payload);
    showAdminToast("Perfume successfully updated.");
  } else {
    await window.DB.addPerfume(payload);
    showAdminToast("New luxury perfume added to vault.");
  }

  closeProductModal();
  loadAdminProducts();
  loadAdminDashboard();
}

async function deletePerfume(perfumeId) {
  if (confirm("Are you sure you want to remove this perfume from the vault?")) {
    await window.DB.deletePerfume(perfumeId);
    showAdminToast("Perfume removed.");
    loadAdminProducts();
    loadAdminDashboard();
  }
}

// 6. Supabase Connection & Schema Helper
async function checkSupabaseHealth() {
  const statusBox = document.getElementById("supabase-health-card");
  if (!statusBox) return;

  statusBox.innerHTML = `
    <div style="padding: 1rem; color: var(--silver-light);">
      Testing live link to <code>${window.DB.config.url}</code>...
    </div>
  `;

  const res = await window.DB.checkConnection();
  if (res.connected && res.tablesCreated) {
    statusBox.innerHTML = `
      <div style="padding: 1.2rem; background: rgba(16, 185, 129, 0.12); border: 1px solid var(--status-delivered); border-radius: 8px;">
        <h4 style="color: var(--status-delivered); margin-bottom: 0.3rem;">● SUPABASE POSTGRESQL ONLINE &amp; SYNCHRONIZED</h4>
        <p style="font-size: 0.85rem; color: var(--silver-light);">${res.message}</p>
        <p style="font-size: 0.78rem; color: var(--silver-muted); margin-top: 0.5rem;">Project: <code>wuvkoexzyxzstrxclspl</code> • API Key Active</p>
      </div>
    `;
  } else if (res.connected && !res.tablesCreated) {
    statusBox.innerHTML = `
      <div style="padding: 1.2rem; background: rgba(245, 158, 11, 0.12); border: 1px solid var(--status-pending); border-radius: 8px;">
        <h4 style="color: var(--status-pending); margin-bottom: 0.3rem;">⚠️ SUPABASE CONNECTED BUT TABLES NOT FOUND</h4>
        <p style="font-size: 0.85rem; color: var(--silver-light); margin-bottom: 0.8rem;">${res.message}</p>
        <p style="font-size: 0.82rem; color: var(--silver-muted);">
          Niche diya gaya SQL script copy karein aur apne Supabase SQL Editor me run karein. Iske baad aap jo bhi products add karenge wo foran save honge.
        </p>
      </div>
    `;
  } else {
    statusBox.innerHTML = `
      <div style="padding: 1.2rem; background: rgba(239, 68, 68, 0.12); border: 1px solid var(--status-cancelled); border-radius: 8px;">
        <h4 style="color: var(--status-cancelled); margin-bottom: 0.3rem;">✕ SUPABASE UNREACHABLE</h4>
        <p style="font-size: 0.85rem; color: var(--silver-light);">${res.message}</p>
        <p style="font-size: 0.8rem; color: var(--silver-muted); margin-top: 0.5rem;">Resilient fallback to LocalStorage is active. Orders and products are securely maintained.</p>
      </div>
    `;
  }
}

async function triggerSeedSupabase() {
  const btn = document.getElementById("seed-supabase-btn");
  if (btn) btn.disabled = true;

  try {
    showAdminToast("Uploading luxury collection to Supabase...");
    await window.DB.seedDefaultPerfumesToSupabase();
    showAdminToast("Default perfumes seeded to Supabase successfully!");
    checkSupabaseHealth();
    loadAdminProducts();
  } catch (err) {
    console.error("Seed error:", err);
    alert("Could not seed to Supabase. Please ensure you have executed the SQL Schema in your Supabase SQL Editor first.\n\nError: " + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function copySqlSchema() {
  const sql = `-- ====================================================================
-- JCD PREMIUM PERFUMES - LUXURY PERFUMES SUPABASE DATABASE SCHEMA
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.perfumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subtitle TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'Extrait de Parfum',
    price NUMERIC(10, 2) NOT NULL,
    old_price NUMERIC(10, 2),
    volume VARCHAR(50) DEFAULT '100ml / 3.4 FL.OZ.',
    stock INTEGER DEFAULT 25,
    badge VARCHAR(50) DEFAULT 'Collector''s Vault',
    top_notes TEXT,
    heart_notes TEXT,
    base_notes TEXT,
    packaging TEXT,
    image_url TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(50),
    delivery_notes TEXT,
    gift_message TEXT,
    luxury_packaging BOOLEAN DEFAULT true,
    free_sample VARCHAR(100),
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping_cost NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Cash on Delivery (COD)',
    payment_reference TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public perfumes are viewable by everyone" ON public.perfumes FOR SELECT USING (true);
CREATE POLICY "Enable insert for perfumes" ON public.perfumes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for perfumes" ON public.perfumes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for perfumes" ON public.perfumes FOR DELETE USING (true);

CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can update order status" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete orders" ON public.orders FOR DELETE USING (true);`;

  navigator.clipboard.writeText(sql).then(() => {
    showAdminToast("SQL Schema copied to clipboard!");
  }).catch(() => {
    alert("Could not automatically copy. Please copy from the supabase-schema.sql file.");
  });
}

// Toast helper
function showAdminToast(msg) {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.background = "#0A1736";
  toast.style.border = "1px solid #38BDF8";
  toast.style.color = "#FFF";
  toast.style.padding = "0.8rem 1.4rem";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 10px 30px rgba(0,0,0,0.8)";
  toast.style.zIndex = "99999";
  toast.style.fontFamily = "var(--font-sans)";
  toast.style.fontSize = "0.85rem";
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
