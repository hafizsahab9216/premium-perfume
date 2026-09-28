-- ====================================================================
-- JCD PREMIUM PERFUMES - SUPABASE DATABASE SCHEMA
-- Color Theme: Midnight Sapphire Blue & Liquid Silver
-- (Clean Schema: No dummy products pre-seeded; add products via Admin Panel)
-- ====================================================================

-- 1. Create Perfumes Table
CREATE TABLE IF NOT EXISTS public.perfumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subtitle TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'Extrait de Parfum',
    price NUMERIC(10, 2) NOT NULL,
    old_price NUMERIC(10, 2),
    volume VARCHAR(50) DEFAULT '100ml / 3.4 FL.OZ.',
    stock INTEGER DEFAULT 25,
    badge VARCHAR(50) DEFAULT 'New Release',
    top_notes TEXT,
    heart_notes TEXT,
    base_notes TEXT,
    packaging TEXT,
    image_url TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Orders Table
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

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Public Access (Storefront & Admin with anon key)
CREATE POLICY "Public perfumes are viewable by everyone" 
ON public.perfumes FOR SELECT USING (true);

CREATE POLICY "Enable insert for perfumes" 
ON public.perfumes FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for perfumes" 
ON public.perfumes FOR UPDATE USING (true);

CREATE POLICY "Enable delete for perfumes" 
ON public.perfumes FOR DELETE USING (true);

-- Orders Policies
CREATE POLICY "Anyone can insert orders" 
ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view orders" 
ON public.orders FOR SELECT USING (true);

CREATE POLICY "Anyone can update order status" 
ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete orders" 
ON public.orders FOR DELETE USING (true);
