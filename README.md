# 💎 JCD PREMIUM PERFUMES - Haute Parfumerie & Extrait de Parfum

An ultra-luxurious, responsive website crafted for **JCD PREMIUM PERFUMES** with **Midnight Sapphire Blue & Liquid Silver** aesthetics, expensive packaging presentation, **100% in-website direct order processing** (zero WhatsApp redirect), customer order tracking, **Executive Admin Panel**, and **Supabase PostgreSQL backend**.

---

## ✨ Key Features & Architecture

### 1. 👑 Ultra-Premium Visual Design & Aesthetics
- **Theme Color Palette**: Deep Midnight Navy Blue (`#050B16`, `#0B1733`), Metallic Liquid Silver (`#FFFFFF`, `#E2E8F0`, `#94A3B8`), and Glowing Sapphire Blue (`#38BDF8`, `#1E40AF`).
- **Expensive Packaging Presentation Showcase**:
  1. *Heavy Machined Silver Cap*: Magnetic zinc-silver alloy with engraved imperial crest.
  2. *Sapphire French Crystal Flacon*: Ombré crystal-cut glass.
  3. *Midnight Velvet Casket*: Keepsake presentation chest lined with crushed navy velvet and silver satin pull-ribbon.
  4. *Silver Wax Authenticity Seal*: Hand-stamped serial certificate signed by the master perfumer.
- **Olfactory Pyramid Modal**: Detailed breakdown of Top, Heart, and Base notes for every perfume.
- **Clean Initial Catalog**: Koi demo products shamil nahi hain; aap apne authentic perfumes aur photos **Admin Panel** se direct list karenge.

### 2. 🛍️ Complete In-Website Direct Ordering Process (NO WhatsApp!)
- **Dynamic Slide-Over Luxury Bag (Cart)**:
  - Add to bag with quantity modifier.
  - Choose complimentary **3ml Luxury Sample Flaconette**.
  - Complimentary Velvet Gift Packaging toggle with silver-inked greeting card note.
  - Subtotal & Free Insured White-Glove Courier calculations.
- **Frictionless In-App Checkout Modal**:
  - Customer contact information (Name, Email, Phone).
  - Complete delivery address (Address, City, Postal Code, Special delivery instructions).
  - Payment method selection:
    - **Cash on Delivery (COD)**
    - **Direct Bank Transfer / Card** (displays bank details and transaction ID input).
  - Direct order submission straight into the **Supabase `orders` table** (or resilient local backup).
- **Instant Order Confirmation Screen**:
  - Unique Order Reference Code (e.g., `LXB-892415`).
  - Printable / Downloadable receipt button.
- **Live In-Website Order Tracking**:
  - Customers can type their Order ID anytime into the tracking section to view live dispatch status (*Order Placed → Confirmed → Casket Packaging → Dispatched → Delivered*).

### 3. 🔐 Executive Admin Panel (`admin.html`)
- **Protected Lockscreen**: Secure master access key (Default password: `admin123` or `royale`).
- **Executive Dashboard**: Live sales revenue, total orders count, active inventory count, pending dispatch counter.
- **Orders Ledger**:
  - View all customer orders.
  - Filter by status (*Pending, Confirmed, Processing, Shipped, Delivered, Cancelled*) or search by client name, city, phone, order number.
  - 1-click status dropdown: changing status updates Supabase in real-time and immediately updates the customer's tracking view on the website!
  - Full Order Dossier with item breakdown, customer address, gift card note, and printable packing slip.
  - Delete / purge order option.
- **Perfume Vault Inventory (CRUD)**:
  - Add new perfumes with notes, packaging descriptions, prices, stock, and images.
  - Edit and delete existing perfumes.
- **Supabase Cloud Controller**:
  - Real-time connection diagnostic widget.
  - 1-Click "Copy SQL Schema" button.
  - 1-Click "Seed Default Perfumes to Supabase" button.

---

## 🗄️ Supabase Backend Configuration

Your Supabase project is already integrated inside [`js/supabase-config.js`](file:///c:/Users/Admin/Desktop/DIGITAL%20MINDS%20IT%20TRACK/js/supabase-config.js):
- **Project URL**: `https://wuvkoexzyxzstrxclspl.supabase.co`
- **Anon Public Key**: Configured
- **Publishable Key**: `sb_publishable_OaWS3oQXoMQjp2kLcpYxLw_TpkJoTbI`

### How to Create Tables in Supabase (2 Minutes):
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/wuvkoexzyxzstrxclspl/sql).
2. Go to the **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Open the file [`supabase-schema.sql`](file:///c:/Users/Admin/Desktop/DIGITAL%20MINDS%20IT%20TRACK/supabase-schema.sql) in this project (or click "Copy SQL Schema" inside the Admin Panel), paste the code, and click **Run**.
5. That's it! The tables `perfumes` and `orders` with public Row Level Security (RLS) policies are active.
6. Open [`admin.html`](file:///c:/Users/Admin/Desktop/DIGITAL%20MINDS%20IT%20TRACK/admin.html), go to the **Supabase Cloud** tab, and click **"Seed Default Perfumes to Supabase"** to populate your database with the collection!

*Note: Even before running the SQL script, the website operates seamlessly with its built-in offline resilient cache so you and your customers can test adding to cart, placing orders, and tracking immediately without errors.*

---

## 🚀 How to Run the Website

You can open [`index.html`](file:///c:/Users/Admin/Desktop/DIGITAL%20MINDS%20IT%20TRACK/index.html) directly in any web browser, or launch a local web server:

### Using Python:
```bash
cd "c:\Users\Admin\Desktop\DIGITAL MINDS IT TRACK"
python -m http.server 8000
```
Then visit:
- **Customer Storefront**: `http://localhost:8000/index.html`
- **Admin Panel**: `http://localhost:8000/admin.html` (Password: `admin123`)

---

## 📁 File Structure
```
c:\Users\Admin\Desktop\DIGITAL MINDS IT TRACK\
├── index.html               # Main Luxury Perfume Boutique
├── admin.html               # Executive Admin Panel (Password: admin123)
├── css/
│   ├── style.css            # Storefront styling (Silver & Sapphire Blue theme)
│   └── admin.css            # Admin panel dashboard styling
├── js/
│   ├── perfumes-data.js     # Curated perfumes with olfactory notes & packaging specs
│   ├── supabase-config.js   # Supabase client data layer & resilient fallback
│   ├── app.js               # Storefront cart, checkout, tracking, and modals
│   └── admin.js             # Admin metrics, order manager, product CRUD, Supabase sync
├── supabase-schema.sql      # Supabase PostgreSQL schema with RLS policies
└── README.md                # Documentation & instructions
```
