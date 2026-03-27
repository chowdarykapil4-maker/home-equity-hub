import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Status = 'current' | 'stale' | 'no-key' | 'loading';

export default function RefreshStatus() {
  const [status, setStatus] = useState<Status>('loading');
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [daysAgo, setDaysAgo] = useState(0);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const { data, error } = await supabase
        .from('auto_refresh_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error || !data) {
        setStatus('no-key');
        return;
      }

      if (!data.rentcast_api_key) {
        setStatus('no-key');
        return;
      }

      if (!data.last_auto_refresh_date) {
        setStatus('stale');
        setDaysAgo(999);
        return;
      }

      const lastDate = new Date(data.last_auto_refresh_date);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      const interval = data.refresh_interval_days || 30;

      setLastRefreshed(lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      setDaysAgo(diffDays);

      if (diffDays <= interval) {
        setStatus('current');
      } else {
        setStatus('stale');
      }
    } catch {
      setStatus('no-key');
    }
  }

  if (status === 'loading') return null;

  if (status === 'current') {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
        Value current — refreshed {lastRefreshed}
      </span>
    );
  }

  if (status === 'stale') {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />
        Value stale — last refreshed {daysAgo} days ago
      </span>
    );
  }

  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 inline-block" />
      <a href="/property" className="hover:underline text-primary">Connect RentCast for auto-refresh</a>
    </span>
  );
}
