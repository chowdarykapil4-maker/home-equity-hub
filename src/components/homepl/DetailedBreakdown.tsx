import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HelpTip } from './HelpTip';

interface FlowRow {
  label: string;
  value: number;
  type: 'equity' | 'sunk';
  tip: string;
  tipMath?: string;
}

export default function DetailedBreakdown({ d }: { d: HomePLData }) {
  const [open, setOpen] = useState(false);

  const cashFlows: FlowRow[] = ([
    { label: 'Down payment', value: d.downPayment, type: 'equity' as const,
      tip: `The cash you brought to the closing table. Purchase price (${formatCurrency(d.purchasePrice)}) minus loan (${formatCurrency(d.loanAmount)}).` },
    { label: 'Interest to bank', value: d.interestPaid, type: 'sunk' as const,
      tip: "The bank's profit on your loan. Early in a mortgage, ~75% of each payment is interest. This ratio improves over time — by year 10, it flips to ~60% principal." },
    { label: 'Renovation spend', value: d.totalRenoSpend, type: 'sunk' as const,
      tip: `Total spent on renovation projects. About ${d.renoRecoveryPct}% (${formatCurrency(d.totalRenoValueAdded)}) came back as home value. The remaining ${formatCurrency(d.netRenoCost)} is the net cost of improving your living space.` },
    { label: 'Property tax', value: d.totalPropertyTax, type: 'sunk' as const,
      tip: `Property tax over ${d.monthsOwned} months of ownership. A portion (up to $10K/year) is tax-deductible.` },
    { label: 'Principal paid', value: d.principalPaid, type: 'equity' as const,
      tip: "This is NOT a cost — it's forced savings. Every dollar of principal reduces your loan and increases your equity. It shows up here because it left your bank account, but it moved to your equity, not to someone else's pocket." },
    { label: 'Insurance', value: d.totalInsurance, type: 'sunk' as const,
      tip: `Homeowner's insurance at ~${formatCurrency(Math.round(d.totalInsurance / Math.max(d.monthsOwned, 1)))}/month. Protects your asset but doesn't build value.` },
    { label: 'Maintenance', value: d.totalMaintenance, type: 'sunk' as const,
      tip: `Estimated routine maintenance over ${(d.monthsOwned / 12).toFixed(1)} years. Prevents value loss but doesn't create new value.` },
    ...(d.totalHOA > 0 ? [{ label: 'HOA', value: d.totalHOA, type: 'sunk' as const, tip: 'Homeowners association fees — covers shared amenities and common area maintenance.' }] : []),
  ] satisfies FlowRow[]).sort((a, b) => b.value - a.value);

  const maxFlow = Math.max(...cashFlows.map(f => f.value));

  const sunkItems = [
    { label: 'Interest', value: d.interestPaid,
      tip: "Nearly two-thirds of your sunk cost goes to the bank as interest. Good news: this percentage shrinks every year as your amortization schedule shifts toward principal." },
    { label: 'Property tax', value: d.totalPropertyTax,
      tip: "The second biggest sunk cost. Set by the county based on your assessed value and is largely unavoidable." },
    { label: 'Net reno cost', value: d.netRenoCost,
      tip: `Only the portion of renovation spending that didn't come back as home value. Your renovations recovered ${d.renoRecoveryPct}% of every renovation dollar.` },
    { label: 'Insurance', value: d.totalInsurance, tip: "Homeowner's insurance — protects your asset but is a pure sunk cost." },
    { label: 'Maintenance', value: d.totalMaintenance, tip: "Routine upkeep to prevent value loss." },
    ...(d.totalHOA > 0 ? [{ label: 'HOA', value: d.totalHOA, tip: 'HOA fees for shared amenities.' }] : []),
  ].filter(i => i.value > 0)
   .sort((a, b) => b.value - a.value);

  const sunkTotal = sunkItems.reduce((s, i) => s + i.value, 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full rounded-xl border border-border bg-card px-4 py-2 flex items-center justify-between hover:bg-accent/50 transition-colors h-9">
        <span className="text-[13px] font-medium text-foreground">
          <HelpTip plain="Full audit trail of every dollar in and out. Left side shows cash outflows, right side shows the sunk cost composition.">
            Show detailed breakdown
          </HelpTip>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-1.5 rounded-xl border border-border bg-card px-4 py-3 overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cash outflows */}
          <div>
            <HelpTip plain="Every dollar that has left your pocket for this house. Some builds equity (green), some is gone forever (red).">
              <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground mb-2">Cash outflows</p>
            </HelpTip>
            <div className="space-y-1">
              {cashFlows.map(row => {
                const barPct = maxFlow > 0 ? (row.value / maxFlow) * 100 : 0;
                return (
                  <div key={row.label} className="flex items-center gap-1.5 h-6">
                    <HelpTip plain={row.tip}>
                      <span className="text-[11px] text-muted-foreground w-24 shrink-0 truncate">{row.label}</span>
                    </HelpTip>
                    <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${row.type === 'equity' ? 'bg-success/70' : 'bg-destructive/60'}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium tabular-nums w-18 text-right">{formatCurrency(row.value)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sunk cost composition */}
          <div>
            <HelpTip plain={`The ${formatCurrency(sunkTotal)} that's gone forever, broken down by category. Interest is typically the largest component.`}>
              <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground mb-2">
                Sunk cost breakdown · {formatCurrency(sunkTotal)}
              </p>
            </HelpTip>
            <div className="space-y-1">
              {sunkItems.map(item => {
                const pct = sunkTotal > 0 ? (item.value / sunkTotal) * 100 : 0;
                return (
                  <div key={item.label} className="flex items-center gap-1.5 h-6">
                    <HelpTip plain={item.tip}>
                      <span className="text-[11px] text-muted-foreground w-20 shrink-0 truncate">{item.label}</span>
                    </HelpTip>
                    <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-destructive/50" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] tabular-nums text-muted-foreground w-8 text-right">{Math.round(pct)}%</span>
                    <span className="text-[11px] font-medium tabular-nums w-18 text-right">{formatCurrency(item.value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
