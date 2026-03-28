import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';
import ScenarioDelta from './ScenarioDelta';
import { HelpTip } from './HelpTip';

interface Segment {
  label: string;
  value: number;
  color: string;
  type: 'guaranteed' | 'market';
  tip: string;
}

interface Props {
  d: HomePLData;
  baseD?: HomePLData;
  scenarioActive?: boolean;
}

export default function FinancialFlow({ d, baseD, scenarioActive = false }: Props) {
  const b = baseD || d;
  const isUnderwater = d.wealthBuilt < 0;

  const equityPct = d.totalCashOut > 0 ? (d.equityBuildingSpend / d.totalCashOut) * 100 : 50;
  const sunkPct = 100 - equityPct;

  const segments: Segment[] = ([
    { label: 'Down payment', value: d.downPayment, color: 'hsl(142, 71%, 35%)', type: 'guaranteed' as const,
      tip: 'Cash you put down at purchase. Guaranteed — you get this back when you sell, no matter what the market does.' },
    { label: 'Principal paid', value: d.principalPaid, color: 'hsl(142, 60%, 48%)', type: 'guaranteed' as const,
      tip: `The portion of your monthly mortgage that reduces your loan. This is forced savings — your debt shrinks by this amount.` },
    { label: 'Market appreciation', value: Math.max(0, d.marketAppreciation), color: 'hsl(142, 50%, 62%)', type: 'market' as const,
      tip: `Your home is worth more than you paid, beyond renovation value. Market working in your favor — but it could go up or down. Current value (${formatCurrency(d.currentHomeValue)}) − purchase price (${formatCurrency(d.purchasePrice)}) − reno value (${formatCurrency(d.totalRenoValueAdded)})` },
    { label: 'Reno value-add', value: d.totalRenoValueAdded, color: 'hsl(173, 55%, 50%)', type: 'market' as const,
      tip: `Renovation spending that translated into higher home value. You recovered ~${Math.round(d.renoRecoveryPct)}% of your ${formatCurrency(d.totalRenoSpend)} renovation investment.` },
  ] satisfies Segment[]).filter(s => s.value > 0);

  const total = d.wealthBuilt;
  const guaranteedPct = total > 0 ? Math.round((d.guaranteedEquity / total) * 100) : 0;
  const marketPct = 100 - guaranteedPct;

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <HelpTip
          plain="Every dollar that has left your pocket related to this house since purchase. Down payment + all mortgage payments + renovations + taxes + insurance + maintenance."
        >
          <p className="text-[13px] font-medium text-foreground">Where {formatCurrency(d.totalCashOut)} went</p>
        </HelpTip>
        <p className="text-[13px] font-bold text-success tabular-nums">
          {formatCurrency(total)} equity
          <ScenarioDelta scenarioVal={d.wealthBuilt} baseVal={b.wealthBuilt} active={scenarioActive} />
        </p>
      </div>

      {/* Outflow bar */}
      <div className="relative h-6 rounded-lg overflow-hidden flex" style={{ gap: '1px' }}>
        <HelpTip
          plain={`This spending built wealth you'll recover when you sell. Down payment (${formatCurrency(d.downPayment)}) + principal paid (${formatCurrency(d.principalPaid)}) + renovation value recovered (${formatCurrency(d.totalRenoValueAdded)})`}
        >
          <div
            className="bg-success/70 flex items-center justify-center transition-all h-6"
            style={{ width: `${equityPct}%`, minWidth: 0 }}
          >
            <span className="text-[11px] font-semibold text-success-foreground whitespace-nowrap px-2">
              Builds equity · {formatCurrency(d.equityBuildingSpend)} ({Math.round(equityPct)}%)
            </span>
          </div>
        </HelpTip>
        <HelpTip
          plain={`Gone forever — the price of living in and maintaining the home. Interest (${formatCurrency(d.interestPaid)}) + property tax (${formatCurrency(d.totalPropertyTax)}) + net reno cost (${formatCurrency(d.netRenoCost)}) + insurance (${formatCurrency(d.totalInsurance)}) + maintenance (${formatCurrency(d.totalMaintenance)})`}
        >
          <div
            className="bg-destructive/50 flex items-center justify-center transition-all h-6"
            style={{ width: `${sunkPct}%`, minWidth: 0 }}
          >
            <span className="text-[11px] font-semibold text-destructive-foreground whitespace-nowrap px-2">
              Sunk cost · {formatCurrency(d.sunkCost)} ({Math.round(sunkPct)}%)
            </span>
          </div>
        </HelpTip>
      </div>

      {/* Equity composition */}
      {isUnderwater ? (
        <div className="h-5 rounded-lg overflow-hidden bg-destructive/60 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-destructive-foreground">Negative equity: {formatCurrency(d.wealthBuilt)}</span>
        </div>
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground px-1">Equity is built from:</p>
          <div className="relative h-5 rounded-lg overflow-hidden flex">
            {segments.map(seg => {
              const pct = total > 0 ? (seg.value / total) * 100 : 0;
              return (
                <HelpTip key={seg.label} plain={seg.tip}>
                  <div
                    className="flex items-center justify-center transition-all h-5"
                    style={{ width: `${pct}%`, backgroundColor: seg.color, minWidth: 0 }}
                  >
                    {pct > 12 && (
                      <span className="text-[10px] font-semibold text-white whitespace-nowrap px-1">
                        {formatCurrency(seg.value)}
                      </span>
                    )}
                  </div>
                </HelpTip>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-1">
            {segments.map(seg => (
              <div key={seg.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
                <span className="text-[11px] text-muted-foreground">{seg.label}</span>
              </div>
            ))}
          </div>

          {/* Guaranteed vs market */}
          <div className="flex justify-between text-xs px-1">
            <HelpTip plain="Money you get back even if the housing market crashes to your purchase price. Down payment + principal paid.">
              <span className="text-muted-foreground">
                Guaranteed: <span className="font-semibold text-foreground">{formatCurrency(d.guaranteedEquity)} ({guaranteedPct}%)</span>
              </span>
            </HelpTip>
            <HelpTip plain="This equity depends on the market. If home values drop, this shrinks. If they rise, this grows.">
              <span className="text-muted-foreground">
                Market-dependent: <span className="font-semibold text-foreground">
                  {formatCurrency(d.marketDependentEquity)} ({marketPct}%)
                  <ScenarioDelta scenarioVal={d.marketDependentEquity} baseVal={b.marketDependentEquity} active={scenarioActive} />
                </span>
              </span>
            </HelpTip>
          </div>
        </>
      )}
    </div>
  );
}
