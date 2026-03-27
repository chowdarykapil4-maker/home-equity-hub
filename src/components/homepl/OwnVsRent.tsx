import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';

export default function OwnVsRent({ d }: { d: HomePLData }) {
  const ownerTotal = d.totalCashOut;
  const renterTotal = d.totalRentWouldHavePaid;
  const maxBar = Math.max(ownerTotal, renterTotal);

  const ownerEquityPct = ownerTotal > 0 ? (d.wealthBuilt / ownerTotal) * 100 : 0;
  const ownerSunkPct = 100 - ownerEquityPct;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <p className="text-sm font-medium text-foreground">Own vs. rent comparison</p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        {/* Owner meter */}
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">You (owner)</p>
          <div className="relative rounded-lg overflow-hidden" style={{ height: '160px' }}>
            <div className="absolute inset-x-0 bottom-0 flex flex-col" style={{ height: `${(ownerTotal / maxBar) * 100}%` }}>
              <div className="bg-success/80 flex-1 flex items-center justify-center" style={{ flex: ownerEquityPct }}>
                <span className="text-[11px] font-semibold text-success-foreground">{formatCurrency(d.wealthBuilt)} equity</span>
              </div>
              <div className="bg-destructive/60 flex items-center justify-center" style={{ flex: ownerSunkPct }}>
                <span className="text-[11px] font-semibold text-destructive-foreground">{formatCurrency(d.sunkCost)} sunk</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{formatCurrency(ownerTotal)} spent</p>
            <p className="text-sm font-bold text-success">+{formatCurrency(d.wealthBuilt)} in equity</p>
          </div>
        </div>

        {/* Middle connector */}
        <div className="hidden md:flex flex-col items-center justify-center text-center space-y-1 px-2">
          <p className="text-[11px] text-muted-foreground">You spent {formatCurrency(Math.abs(ownerTotal - renterTotal))} more…</p>
          <p className="text-[11px] text-muted-foreground">…but built {formatCurrency(d.wealthBuilt)} in equity</p>
          <p className="text-base font-bold text-success">Net: +{formatCurrency(d.ownershipAdvantage)}</p>
        </div>

        {/* Renter meter */}
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">If you rented</p>
          <div className="relative rounded-lg overflow-hidden" style={{ height: '160px' }}>
            <div className="absolute inset-x-0 bottom-0 bg-destructive/50 flex items-center justify-center" style={{ height: `${(renterTotal / maxBar) * 100}%` }}>
              <span className="text-[11px] font-semibold text-destructive-foreground">{formatCurrency(renterTotal)} rent</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{formatCurrency(renterTotal)} spent</p>
            <p className="text-sm font-bold text-muted-foreground">$0 equity</p>
          </div>
        </div>
      </div>

      {/* Mobile connector */}
      <div className="md:hidden text-center space-y-1 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">You spent {formatCurrency(Math.abs(ownerTotal - renterTotal))} more but built {formatCurrency(d.wealthBuilt)} in equity</p>
        <p className="text-base font-bold text-success">Net advantage: +{formatCurrency(d.ownershipAdvantage)}</p>
      </div>
    </div>
  );
}
