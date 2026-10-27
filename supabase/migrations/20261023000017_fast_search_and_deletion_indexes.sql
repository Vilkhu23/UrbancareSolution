-- ==============================================================================
-- Migration: 20261023000017_fast_search_and_deletion_indexes.sql
-- Description: Adds high-performance indexes for fast service & package search
--              queries, instant deletion, and an optimized search RPC function.
-- ==============================================================================

BEGIN;

-- 1. Ensure active flag exists on services
ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- 2. High-Performance B-Tree & Functional Indexes for Services
CREATE INDEX IF NOT EXISTS idx_services_name ON public.services(name);
CREATE INDEX IF NOT EXISTS idx_services_subcategory ON public.services(subcategory);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(active);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON public.services(display_order);
CREATE INDEX IF NOT EXISTS idx_services_price ON public.services(price);
CREATE INDEX IF NOT EXISTS idx_services_category_active ON public.services(category_id, active);
CREATE INDEX IF NOT EXISTS idx_services_name_lower ON public.services(LOWER(name));

-- 3. High-Performance Indexes for Service Packages
CREATE INDEX IF NOT EXISTS idx_service_packages_category ON public.service_packages(category_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_name ON public.service_packages(name);
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON public.service_packages(active);
CREATE INDEX IF NOT EXISTS idx_service_packages_name_lower ON public.service_packages(LOWER(name));

-- 4. Optimized Server-Side Search RPC Function (Fast Result Search)
CREATE OR REPLACE FUNCTION public.search_services(
    p_query TEXT DEFAULT '',
    p_category TEXT DEFAULT 'All'
)
RETURNS SETOF public.services
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT *
    FROM public.services
    WHERE (active IS NULL OR active = TRUE)
      AND (
          p_category IS NULL 
          OR p_category = '' 
          OR p_category = 'All' 
          OR category_id = p_category 
          OR LOWER(category_id) = LOWER(p_category)
      )
      AND (
          p_query IS NULL 
          OR p_query = '' 
          OR LOWER(name) LIKE '%' || LOWER(TRIM(p_query)) || '%'
          OR LOWER(COALESCE(subcategory, '')) LIKE '%' || LOWER(TRIM(p_query)) || '%'
          OR LOWER(COALESCE(description, '')) LIKE '%' || LOWER(TRIM(p_query)) || '%'
          OR features::text ILIKE '%' || TRIM(p_query) || '%'
      )
    ORDER BY display_order ASC, name ASC;
$$;

GRANT EXECUTE ON FUNCTION public.search_services(TEXT, TEXT) TO anon, authenticated;

COMMIT;
