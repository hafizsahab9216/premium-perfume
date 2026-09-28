// ====================================================================
// JCD PREMIUM PERFUMES - SUPABASE CLIENT & DATA LAYER
// Integrates remote Supabase PostgreSQL with resilient offline fallback
// ====================================================================

const SUPABASE_CONFIG = {
  url: "https://wuvkoexzyxzstrxclspl.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dmtvZXh6eXh6c3RyeGNsc3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzE5ODcsImV4cCI6MjEwNjE0Nzk4N30.x42tQKF-PzcQYWVtlehQ4B0kpPS987oo8gJVkAv08TM",
  publishableKey: "sb_publishable_OaWS3oQXoMQjp2kLcpYxLw_TpkJoTbI"
};

// Initialize Supabase Client if CDN loaded
let supabaseClient = null;
if (window.supabase && typeof window.supabase.createClient === "function") {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log("💎 Supabase Client initialized successfully.");
  } catch (err) {
    console.warn("Could not initialize Supabase client:", err);
  }
}

// Local Storage Keys
const STORAGE_KEYS = {
  PERFUMES: "lelixir_perfumes_cache",
  ORDERS: "lelixir_orders_cache",
  CART: "lelixir_cart_v1",
  WISHLIST: "lelixir_wishlist_v1"
};

// Initialize Local Backup Storage as clean empty state
function initializeLocalCache() {
  const cachedPerfumes = localStorage.getItem(STORAGE_KEYS.PERFUMES);
  // If cache is empty or contains old pre-seeded dummy products, reset to empty array
  if (!cachedPerfumes || cachedPerfumes.includes("prod-1") || cachedPerfumes.includes("Sovereign Silver Oud")) {
    localStorage.setItem(STORAGE_KEYS.PERFUMES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  }
}
initializeLocalCache();

// Unified Data Layer
window.DB = {
  config: SUPABASE_CONFIG,
  isSupabaseLive: false,
  tablesCreated: false,

  // Check Supabase connection and tables health
  async checkConnection() {
    if (!supabaseClient) {
      this.isSupabaseLive = false;
      return { connected: false, message: "Supabase client not loaded" };
    }
    try {
      const { data, error } = await supabaseClient.from("perfumes").select("id").limit(1);
      if (error) {
        if (error.code === "PGRST205" || error.message.includes("does not exist") || error.message.includes("schema cache")) {
          this.isSupabaseLive = true;
          this.tablesCreated = false;
          return {
            connected: true,
            tablesCreated: false,
            message: "Connected to Supabase, but SQL tables ('perfumes', 'orders') need to be created. Please run the SQL schema in your Supabase SQL Editor."
          };
        }
        return { connected: false, message: error.message };
      }
      this.isSupabaseLive = true;
      this.tablesCreated = true;
      return {
        connected: true,
        tablesCreated: true,
        message: "Supabase Live & Synchronized with PostgreSQL database."
      };
    } catch (e) {
      console.warn("Connection test exception:", e);
      return { connected: false, message: e.message };
    }
  },

  // 1. Get all perfumes (from Supabase or local backup)
  async getPerfumes() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("perfumes")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          this.tablesCreated = true;
          localStorage.setItem(STORAGE_KEYS.PERFUMES, JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn("Failed fetching from Supabase, using local cache:", err);
      }
    }

    // Fallback to local storage
    const cached = localStorage.getItem(STORAGE_KEYS.PERFUMES);
    return cached ? JSON.parse(cached) : [];
  },

  // 2. Add a new perfume
  async addPerfume(perfume) {
    const newPerfume = {
      ...perfume,
      created_at: new Date().toISOString()
    };

    let savedToSupabase = false;
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from("perfumes").insert([newPerfume]).select();
        if (!error && data && data.length > 0) {
          savedToSupabase = true;
          newPerfume.id = data[0].id;
        }
      } catch (err) {
        console.warn("Error inserting perfume to Supabase:", err);
      }
    }

    if (!newPerfume.id) {
      newPerfume.id = "prod-" + Date.now();
    }

    // Save to local cache
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.PERFUMES) || "[]");
    current.unshift(newPerfume);
    localStorage.setItem(STORAGE_KEYS.PERFUMES, JSON.stringify(current));

    return { success: true, perfume: newPerfume, savedToSupabase };
  },

  // 3. Update perfume
  async updatePerfume(id, updates) {
    let savedToSupabase = false;
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.from("perfumes").update(updates).eq("id", id);
        if (!error) savedToSupabase = true;
      } catch (err) {
        console.warn("Error updating perfume in Supabase:", err);
      }
    }

    // Update local cache
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.PERFUMES) || "[]");
    const idx = current.findIndex(p => p.id === id);
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates };
      localStorage.setItem(STORAGE_KEYS.PERFUMES, JSON.stringify(current));
    }

    return { success: true, savedToSupabase };
  },

  // 4. Delete perfume
  async deletePerfume(id) {
    let deletedFromSupabase = false;
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.from("perfumes").delete().eq("id", id);
        if (!error) deletedFromSupabase = true;
      } catch (err) {
        console.warn("Error deleting perfume from Supabase:", err);
      }
    }

    // Remove from local cache
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.PERFUMES) || "[]");
    const filtered = current.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PERFUMES, JSON.stringify(filtered));

    return { success: true, deletedFromSupabase };
  },

  // 5. Seed default perfumes into Supabase (Admin action)
  async seedDefaultPerfumesToSupabase() {
    if (!supabaseClient) {
      throw new Error("Supabase client is not available.");
    }

    const payload = INITIAL_PERFUMES.map(p => ({
      name: p.name,
      subtitle: p.subtitle,
      category: p.category,
      price: p.price,
      old_price: p.old_price,
      volume: p.volume,
      stock: p.stock,
      badge: p.badge,
      top_notes: p.top_notes,
      heart_notes: p.heart_notes,
      base_notes: p.base_notes,
      packaging: p.packaging,
      image_url: p.image_url,
      is_featured: p.is_featured
    }));

    const { data, error } = await supabaseClient.from("perfumes").insert(payload).select();
    if (error) {
      throw error;
    }
    return data;
  },

  // 6. Create Order (IN-WEBSITE ORDERING PROCESS)
  async createOrder(orderData) {
    // Generate Luxury Order Number e.g. JCD-892415
    const orderNumber = "JCD-" + Math.floor(100000 + Math.random() * 900000);
    const now = new Date().toISOString();

    const orderRecord = {
      order_number: orderNumber,
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone,
      address: orderData.address,
      city: orderData.city,
      postal_code: orderData.postal_code || "",
      delivery_notes: orderData.delivery_notes || "",
      gift_message: orderData.gift_message || "",
      luxury_packaging: orderData.luxury_packaging ?? true,
      free_sample: orderData.free_sample || "",
      items: orderData.items,
      subtotal: orderData.subtotal,
      shipping_cost: orderData.shipping_cost || 0,
      total_amount: orderData.total_amount,
      payment_method: orderData.payment_method || "Cash on Delivery (COD)",
      payment_reference: orderData.payment_reference || "",
      status: "Pending",
      created_at: now,
      updated_at: now
    };

    let savedToSupabase = false;
    let finalOrder = { ...orderRecord };

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from("orders").insert([orderRecord]).select();
        if (!error && data && data.length > 0) {
          savedToSupabase = true;
          finalOrder = data[0];
        } else {
          console.warn("Supabase order insert note:", error);
        }
      } catch (err) {
        console.warn("Exception during Supabase order creation:", err);
      }
    }

    if (!finalOrder.id) {
      finalOrder.id = "ord-" + Date.now();
    }

    // Always persist to local cache for instant viewing in admin / tracking
    const localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]");
    localOrders.unshift(finalOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(localOrders));

    return {
      success: true,
      order: finalOrder,
      orderNumber: finalOrder.order_number,
      savedToSupabase
    };
  },

  // 7. Get Order by Order Number (for Customer Order Tracking)
  async getOrderByNumber(orderNumber) {
    const cleanNum = orderNumber.trim().toUpperCase();

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("orders")
          .select("*")
          .ilike("order_number", cleanNum)
          .maybeSingle();

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn("Supabase tracking lookup err:", err);
      }
    }

    // Check local storage
    const localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]");
    return localOrders.find(o => o.order_number.toUpperCase() === cleanNum) || null;
  },

  // 8. Get All Orders (for Admin Panel)
  async getAllOrders() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn("Supabase fetch orders err:", err);
      }
    }

    // Fallback to local storage
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]");
  },

  // 9. Update Order Status (for Admin Panel)
  async updateOrderStatus(orderId, newStatus) {
    const now = new Date().toISOString();
    let updatedInSupabase = false;

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from("orders")
          .update({ status: newStatus, updated_at: now })
          .eq("id", orderId);

        if (!error) updatedInSupabase = true;
      } catch (err) {
        console.warn("Supabase update order err:", err);
      }
    }

    // Update in local storage
    const localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]");
    const idx = localOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      localOrders[idx].status = newStatus;
      localOrders[idx].updated_at = now;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(localOrders));
    }

    return { success: true, updatedInSupabase };
  },

  // 10. Delete Order (for Admin Panel)
  async deleteOrder(orderId) {
    if (supabaseClient) {
      try {
        await supabaseClient.from("orders").delete().eq("id", orderId);
      } catch (e) {
        console.warn(e);
      }
    }
    const localOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]");
    const filtered = localOrders.filter(o => o.id !== orderId);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filtered));
    return { success: true };
  }
};
