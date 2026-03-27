import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';

export default function OwnVsRent({ d }: { d: HomePLData }) {
  const ownerTotal = d.totalCashOut;
  const renterTotal = d.totalRentWouldHavePaid;

  const ownerEquityPct = ownerTotal > 0 ? (d.wealthBuilt / ownerTotal) * 100 : 0;
  const ownerSunkPct = 100 - ownerEquityPct;
  const renterFillPct = ownerTotal > 0 ? (renterTotal / ownerTotal) * 100 : 50;

  const barHeight = 120;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-3">
      <p className="text-[13px] font-medium text-foreground">Own vs. rent comparison</p>

      <div className="grid grid-cols-[3fr_2fr] gap-0">
        {/* Owner column */}
        <div className="space-y-1.5 pr-px">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">You (owner)</p>
          <div className="rounded-l-lg overflow-hidden flex flex-col" style={{ height: barHeight }}>
            <div className="bg-success/80 flex items-center justify-center" style={{ flex: ownerEquityPct }}>
              <span className="text-[11px] font-semibold text-success-foreground">{formatCurrency(d.wealthBuilt)} equity</span>
            </div>
            <div className="bg-destructive/60 flex items-center justify-center" style={{ flex: ownerSunkPct }}>
              <span className="text-[11px] font-semibold text-destructive-foreground">{formatCurrency(d.sunkCost)} sunk</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{formatCurrency(ownerTotal)} total</p>
            <p className="text-sm font-bold text-success">+{formatCurrency(d.wealthBuilt)} in equity</p>
          </div>
        </div>

        {/* Renter column */}
        <div className="space-y-1.5 border-l border-border pl-px">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">If you rented</p>
          <div className="relative rounded-r-lg overflow-hidden bg-muted/30" style={{ height: barHeight }}>
            <div
              className="absolute inset-x-0 bottom-0 bg-destructive/50 flex items-center justify-center"
              style={{ height: `${Math.min(renterFillPct, 100)}%` }}
            >
              <span className="text-[11px] font-semibold text-destructive-foreground">{formatCurrency(renterTotal)} rent</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{formatCurrency(renterTotal)} total</p>
            <p className="text-sm font-bold text-muted-foreground">$0 equity</p>
          </div>
        </div>
      </div>

      {/* Summary line */}
      <p className="text-[13px] text-center text-muted-foreground">
        You spent {formatCurrency(Math.abs(ownerTotal - renterTotal))} more but built {formatCurrency(d.wealthBuilt)} in equity →{' '}
        <span className="font-bold text-success">Net: +{formatCurrency(d.ownershipAdvantage)}</span>
      </p>
    </div>
  );
}
