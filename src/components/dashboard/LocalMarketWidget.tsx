import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { HelpTip } from '@/components/homepl/HelpTip';
import { formatCurrency } from '@/lib/format';
import { useHomePL } from '@/hooks/useHomePL';
import { useAppContext } from '@/context/AppContext';
import { RentCastData } from '@/lib/rentcastApi';
import { Link } from 'react-router-dom';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  data: RentCastData | null;
  loading: boolean;
  onRefresh: () => void;
  hasApiKey: boolean;
}

export function LocalMarketWidget({ data, loading, onRefresh, hasApiKey }: Props) {
  const pl = useHomePL();
  const { homePLConfig, property } = useAppContext();
  const [showComps, setShowComps] = useState(false);

  const zipMatch = property.address.match(/\d{5}$/);
  const zipCode = zipMatch ? zipMatch[0] : '—';

  // No data state
  if (!data) {
    return (
      <Card className="rounded-xl">
        <CardContent className="px-4 py-3 text-center">
          {hasApiKey ? (
            <div className="flex items-center justify-center gap-3">
              <p className="text-xs text-muted-foreground">RentCast API connected.</p>
              <button
                onClick={onRefresh}
                disabled={loading}
                className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                {loading ? (
                  <><RefreshCw className="h-3 w-3 animate-spin" /> Fetching...</>
                ) : (
                  'Fetch market data now'
                )}
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Connect RentCast API in{' '}
              <Link to="/property#settings" className="text-primary hover:underline">
                My Property → Settings
              </Link>{' '}
              to see local market data
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const homeValue = pl.currentHomeValue;
  const medianPrice = data.marketStats?.medianPrice || data.marketStats?.averagePrice;
  const vsMed =
    medianPrice && medianPrice > 0
      ? ((homeValue - medianPrice) / medianPrice) * 100
      : null;

  const rentEst = data.rentEstimate?.rent;
  const assumedRent = homePLConfig.estimatedMonthlyRent;
  const rentDiffPct =
    rentEst && assumedRent ? Math.abs((rentEst - assumedRent) / assumedRent) * 100 : 0;

  const dom = data.marketStats?.averageDaysOnMarket;
  const listings =
    data.marketStats?.totalListings ?? data.marketStats?.saleListings ?? null;

  const lastDate = data.lastFetched
    ? new Date(data.lastFetched).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : '—';

  const comps = (data.comparableSales || [])
    .slice()
    .sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));

  return (
    <Card className="rounded-xl">
      <CardContent className="px-4 py-3 space-y-2">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium">Local market · {zipCode}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Updated {lastDate}</span>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ROW 1 — Your Home vs Market */}
        <div className="grid grid-cols-2 text-center">
          <div className="border-r border-border/20 py-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <HelpTip plain="Your home's current estimated value from your blended sources">
                Your Value
              </HelpTip>
            </p>
            <p className="text-sm font-semibold">{formatCurrency(homeValue)}</p>
          </div>
          <div className="border-r border-border/20 py-1 sm:border-r">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <HelpTip plain="The middle sale price in your zip code. Half of homes sell above this, half below. Source: RentCast market data.">
                Market Median
              </HelpTip>
            </p>
            <p className="text-sm font-semibold">
              {medianPrice ? formatCurrency(medianPrice) : '—'}
            </p>
          </div>
          <div className="border-r border-border/20 py-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <HelpTip plain="How your home's value compares to the typical home in your zip code. Being above median means your home is worth more than most in the area.">
                You vs Median
              </HelpTip>
            </p>
            <p
              className={`text-sm font-semibold ${vsMed !== null ? (vsMed >= 0 ? 'text-success' : 'text-warning') : ''}`}
            >
              {vsMed !== null ? `${vsMed >= 0 ? '+' : ''}${vsMed.toFixed(1)}%` : '—'}
            </p>
          </div>
          <div className="py-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <HelpTip plain="What RentCast estimates your property would rent for, based on comparable rentals nearby. Compare this to the rent assumption in your P&L calculations.">
                Rent Estimate
              </HelpTip>
            </p>
            <p className="text-sm font-semibold">
              {rentEst ? `${formatCurrency(rentEst)}/mo` : '—'}
            </p>
            {rentEst && (
              <p
                className={`text-[10px] ${rentDiffPct <= 10 ? 'text-success' : 'text-warning'}`}
              >
                {rentDiffPct <= 10
                  ? '✓ Matches your assumption'
                  : `P&L assumes ${formatCurrency(assumedRent)}`}
              </p>
            )}
          </div>
        </div>

        {/* ROW 2 — Market Temperature */}
        <div className="flex items-center justify-between text-[13px] pt-1 border-t border-border/20">
          <div className="flex items-center gap-2">
            <span>
              <HelpTip plain="How quickly homes are selling in your area. Lower = hotter market. Below 15 days means homes sell fast, often above asking price.">
                Avg days on market: {dom ?? '—'}
              </HelpTip>
            </span>
            {dom != null && (
              <span
                className={`text-xs font-medium ${
                  dom < 15
                    ? 'text-destructive'
                    : dom < 30
                      ? 'text-warning'
                      : dom < 60
                        ? 'text-muted-foreground'
                        : 'text-primary'
                }`}
              >
                {dom < 15
                  ? '● Very hot'
                  : dom < 30
                    ? 'Warm market'
                    : dom < 60
                      ? 'Balanced'
                      : 'Cool market'}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {listings != null ? `${listings} active listings in your zip` : ''}
          </span>
        </div>

        {/* ROW 3 — Comparable Sales (collapsible) */}
        {comps.length > 0 && (
          <div className="border-t border-border/20 pt-1">
            <button
              onClick={() => setShowComps((s) => !s)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              Recent comparable sales ({comps.length})
              {showComps ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showComps && (
              <div className="mt-1 space-y-0">
                {comps.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[11px] py-0.5 border-b border-border/10 last:border-0"
                  >
                    <span className="truncate max-w-[160px]">{c.formattedAddress}</span>
                    <span className="font-medium">
                      {c.lastSalePrice ? formatCurrency(c.lastSalePrice) : c.price ? formatCurrency(c.price) : '—'}
                    </span>
                    <span className="text-muted-foreground">
                      {c.squareFootage ? `${c.squareFootage.toLocaleString()} sqft` : '—'}
                    </span>
                    <span className="text-muted-foreground">
                      {c.squareFootage && (c.lastSalePrice || c.price)
                        ? `$${Math.round((c.lastSalePrice || c.price || 0) / c.squareFootage)}/sqft`
                        : '—'}
                    </span>
                    <span className="text-muted-foreground">
                      {c.distance != null ? `${c.distance.toFixed(1)} mi` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
