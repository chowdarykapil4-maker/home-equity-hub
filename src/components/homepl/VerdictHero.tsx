import { formatCurrency, formatPercent } from '@/lib/format';
import { TrendingUp } from 'lucide-react';
import { HomePLData } from '@/hooks/useHomePL';

export default function VerdictHero({ d }: { d: HomePLData }) {
  return (
    <div className="rounded-xl border border-success/20 bg-success/[0.04] px-6 py-8">
      <div className="text-center space-y-3">
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Ownership advantage over renting
        </p>
        <p className={`text-4xl font-bold tracking-tight ${d.ownershipAdvantage >= 0 ? 'text-success' : 'text-destructive'}`}>
          {d.ownershipAdvantage >= 0 ? '+' : ''}{formatCurrency(d.ownershipAdvantage)}
        </p>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          You're building <span className="font-semibold text-foreground">{formatCurrency(d.monthlyWealthCreation)}/mo</span> in wealth that a renter never would
        </p>

        <div className="border-t border-border my-4" />

        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto pt-1">
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <span className="text-base font-bold text-success">{formatCurrency(d.wealthBuilt)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">equity built</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-base font-bold">{formatCurrency(d.sunkCost)}</span>
            <p className="text-[11px] text-muted-foreground">cost of ownership</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-base font-bold">{formatPercent(d.returnOnCash)}</span>
            <p className="text-[11px] text-muted-foreground">return on cash</p>
          </div>
        </div>
      </div>
    </div>
  );
}
