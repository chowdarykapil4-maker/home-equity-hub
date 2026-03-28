import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';
import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  d: HomePLData;
  scenarioActive?: boolean;
}

function Row({ label, value, color = 'text-foreground', bold = false, indent = false, sub = false }: {
  label: string; value: string; color?: string; bold?: boolean; indent?: boolean; sub?: boolean;
}) {
  return (
    <div className={`flex justify-between items-baseline ${indent ? 'pl-4' : ''} ${sub ? 'text-[10px]' : 'text-xs'} ${bold ? 'font-semibold border-t border-border pt-1 mt-1' : ''}`}>
      <span className={`${indent ? 'font-mono text-muted-foreground' : ''} ${color}`}>{label}</span>
      <span className={`tabular-nums ${color} ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-dashed border-border my-2" />;
}

export default function AdvantageBreakdown({ d, scenarioActive = false }: Props) {
  const isMobile = useIsMobile();
  const mortgagePayments = d.principalPaid + d.interestPaid;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 cursor-help group">
          <span
            className={`text-4xl font-bold tracking-tight border-b border-dashed ${
              d.ownershipAdvantage >= 0 ? 'text-success border-success/40' : 'text-destructive border-destructive/40'
            }`}
          >
            {d.ownershipAdvantage >= 0 ? '+' : ''}{formatCurrency(d.ownershipAdvantage)}
          </span>
          <Info className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={isMobile ? 'bottom' : 'bottom'}
        align="center"
        className={`${isMobile ? 'w-[calc(100vw-32px)]' : 'w-[420px]'} p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-[100]`}
      >
        <div className="space-y-3">
          {/* Header */}
          <div>
            <p className="text-sm font-medium">
              How we calculated {d.ownershipAdvantage >= 0 ? '+' : ''}{formatCurrency(d.ownershipAdvantage)}
            </p>
            <div className="border-t border-border mt-2" />
          </div>

          {/* Step 1 — Cash out */}
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">1 · Total cash out</p>
            <Row label="Down payment" value={formatCurrency(d.downPayment)} />
            <Row label="Mortgage payments" value={formatCurrency(mortgagePayments)} />
            <Row label="├─ Principal portion" value={formatCurrency(d.principalPaid)} color="text-success" indent />
            <Row label="└─ Interest portion" value={formatCurrency(d.interestPaid)} color="text-muted-foreground" indent />
            <Row label="Renovation spend" value={formatCurrency(d.totalRenoSpend)} />
            <Row label="Property tax" value={formatCurrency(d.totalPropertyTax)} color="text-muted-foreground" />
            <Row label="Insurance" value={formatCurrency(d.totalInsurance)} color="text-muted-foreground" />
            <Row label="Maintenance" value={formatCurrency(d.totalMaintenance)} color="text-muted-foreground" />
            <Row label="Total cash out" value={formatCurrency(d.totalCashOut)} bold />
          </div>

          <Divider />

          {/* Step 2 — Equity built */}
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">2 · Equity built</p>
            <Row label="Down payment ✓" value={formatCurrency(d.downPayment)} color="text-success" />
            <Row label="Principal paid ✓" value={formatCurrency(d.principalPaid)} color="text-success" />
            <Row label="Market appreciation ~" value={formatCurrency(d.marketAppreciation)} color="text-muted-foreground" />
            <Row label="Renovation value-add ~" value={formatCurrency(d.totalRenoValueAdded)} color="text-muted-foreground" />
            <Row label="Total equity" value={formatCurrency(d.wealthBuilt)} color="text-success" bold />
          </div>

          <Divider />

          {/* Step 3 — Sunk cost */}
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">3 · Sunk cost (gone forever)</p>
            <Row label="Interest paid" value={formatCurrency(d.interestPaid)} color="text-destructive/80" />
            <Row label="Property tax" value={formatCurrency(d.totalPropertyTax)} color="text-destructive/80" />
            <Row label="Net reno cost" value={formatCurrency(d.netRenoCost)} color="text-destructive/80" />
            <Row label="Insurance" value={formatCurrency(d.totalInsurance)} color="text-destructive/80" />
            <Row label="Maintenance" value={formatCurrency(d.totalMaintenance)} color="text-destructive/80" />
            <Row label="Total sunk cost" value={formatCurrency(d.sunkCost)} color="text-destructive" bold />
          </div>

          <Divider />

          {/* Step 4 — Renter comparison */}
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">4 · If you rented instead</p>
            <Row label={`Rent (${d.monthsOwned} mo × ${formatCurrency(d.totalRentWouldHavePaid / d.monthsOwned)})`} value={formatCurrency(d.totalRentWouldHavePaid)} color="text-destructive/80" />
            <Row label="Equity built" value="$0" color="text-muted-foreground" />
            <Row label="Renter total sunk" value={formatCurrency(d.renterSunkCost)} color="text-destructive" bold />
          </div>

          <Divider />

          {/* Step 5 — Final math */}
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">5 · The math</p>
            <Row label="Your equity" value={formatCurrency(d.wealthBuilt)} color="text-success" />
            <Row label={`− Extra sunk vs renter`} value={`−${formatCurrency(d.sunkCostDiff)}`} color="text-destructive/80" />
            <div className="text-[10px] text-muted-foreground pl-2 -mt-0.5">
              ({formatCurrency(d.ownerSunkCost)} − {formatCurrency(d.renterSunkCost)})
            </div>
            <Row
              label="Ownership advantage"
              value={`${d.ownershipAdvantage >= 0 ? '+' : ''}${formatCurrency(d.ownershipAdvantage)}`}
              color={d.ownershipAdvantage >= 0 ? 'text-success' : 'text-destructive'}
              bold
            />
          </div>

          {/* Plain English */}
          <div className="bg-accent/50 rounded-lg px-3 py-2 text-xs text-foreground leading-relaxed">
            You spent {formatCurrency(d.sunkCostDiff)} more than a renter in sunk costs, but you built {formatCurrency(d.wealthBuilt)} in equity. The net difference is{' '}
            <span className={d.ownershipAdvantage >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
              {d.ownershipAdvantage >= 0 ? '+' : ''}{formatCurrency(d.ownershipAdvantage)}
            </span>{' '}
            in your favor. Of your {formatCurrency(d.wealthBuilt)} total equity, {formatCurrency(d.downPayment)} is your original down payment (transferred wealth) and {formatCurrency(d.trueMonthlyWealthCreation * d.monthsOwned)} is actual wealth created through principal paydown, appreciation, and renovation value.
          </div>

          {/* Footer */}
          <div className="border-t border-border pt-1.5 space-y-0.5">
            <p className="text-[10px] text-muted-foreground">All values auto-calculated from your actual data</p>
            {scenarioActive && (
              <p className="text-[10px] text-amber-600">Currently showing scenario-adjusted values</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
