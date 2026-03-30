import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { fetchAllRentCastData, RentCastData } from '@/lib/rentcastApi';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

const STORAGE_KEY = 'casakat_rentcast_data';

export function useRentCastRefresh() {
  const { property, addValueEntry, valueEntries } = useAppContext();
  const [data, setData] = useState<RentCastData | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const refresh = useCallback(
    async (force = false) => {
      try {
        const { data: settings } = await supabase
          .from('auto_refresh_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (settings?.rentcast_api_key) setHasApiKey(true);
        if (!settings?.rentcast_api_key) return;

        const intervalDays = settings.refresh_interval_days || 30;
        const lastRefresh = settings.last_auto_refresh_date
          ? new Date(settings.last_auto_refresh_date)
          : null;
        const now = new Date();
        const daysSince = lastRefresh
          ? Math.floor((now.getTime() - lastRefresh.getTime()) / 86400000)
          : Infinity;

        if (!force && daysSince < intervalDays) return;

        setLoading(true);

        const zipMatch = property.address.match(/\d{5}$/);
        const zipCode = zipMatch ? zipMatch[0] : '94560';

        const result = await fetchAllRentCastData(
          settings.rentcast_api_key,
          property.address,
          zipCode,
        );

        if (result.error) {
          if (result.error.includes('Failed to fetch') || result.error.includes('CORS') || result.error.includes('NetworkError')) {
            toast.error('RentCast API cannot be called directly from the browser. Use the edge function refresh or enter values manually.');
          } else {
            console.error('RentCast refresh failed:', result.error);
          }
          setLoading(false);
          return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
        setData(result);

        // Auto-create a Value History entry if we got a value estimate
        if (result.valueEstimate?.price) {
          const todayStr = now.toISOString().split('T')[0];
          const alreadyHasToday = valueEntries.some(
            (e) => e.date === todayStr && e.source === 'RentCast AVM',
          );
          if (!alreadyHasToday) {
            addValueEntry({
              id: `rentcast-${todayStr}`,
              date: todayStr,
              estimatedValue: result.valueEstimate.price,
              source: 'RentCast AVM',
              notes: `Auto-refreshed. Range: ${formatCurrency(result.valueEstimate.priceRangeLow)} – ${formatCurrency(result.valueEstimate.priceRangeHigh)}`,
            });
          }
        }

        // Update Supabase refresh tracking
        const callsUsed = [
          result.valueEstimate,
          result.rentEstimate,
          result.marketStats,
        ].filter(Boolean).length;

        const monthStart = settings.api_calls_month_start
          ? new Date(settings.api_calls_month_start)
          : null;
        const isNewMonth =
          !monthStart ||
          monthStart.getMonth() !== now.getMonth() ||
          monthStart.getFullYear() !== now.getFullYear();

        await supabase
          .from('auto_refresh_settings')
          .update({
            last_auto_refresh_date: now.toISOString(),
            api_calls_this_month: isNewMonth
              ? callsUsed
              : settings.api_calls_this_month + callsUsed,
            api_calls_month_start: isNewMonth
              ? now.toISOString()
              : settings.api_calls_month_start,
            updated_at: now.toISOString(),
          })
          .eq('id', 'default');

        toast.success(
          `Home value refreshed — ${formatCurrency(result.valueEstimate?.price || 0)}`,
        );
        setLoading(false);
      } catch (error) {
        console.error('RentCast refresh error:', error);
        setLoading(false);
      }
    },
    [property.address, addValueEntry, valueEntries],
  );

  // Auto-refresh on mount
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, refresh, hasApiKey };
}
