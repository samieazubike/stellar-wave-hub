CREATE TABLE IF NOT EXISTS public.app_config (
    key text PRIMARY KEY,
    value text,
    updated_at timestamptz DEFAULT now()
);
