-- Auto-refresh settings for RentCast integration
CREATE TABLE public.auto_refresh_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  rentcast_api_key TEXT,
  refresh_interval_days INTEGER NOT NULL DEFAULT 30,
  last_auto_refresh_date DATE,
  api_calls_this_month INTEGER NOT NULL DEFAULT 0,
  api_calls_month_start DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_refresh_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.auto_refresh_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON public.auto_refresh_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public insert" ON public.auto_refresh_settings FOR INSERT WITH CHECK (true);

INSERT INTO public.auto_refresh_settings (id) VALUES ('default');