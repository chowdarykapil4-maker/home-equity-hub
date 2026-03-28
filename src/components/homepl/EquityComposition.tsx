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

export default function EquityComposition({ d, baseD, scenarioActive = false }: Props) {
  const b = baseD || d;
  const isUnderwater = d.wealthBuilt < 0;

  if (isUnderwater) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-foreground">Equity composition</p>
          <p className="text-[13px] font-bold text-destructive tabular-nums">{formatCurrency(d.wealthBuilt)}</p>
        </div>
        <div className="relative h-6 rounded-lg overflow-hidden flex">
          <div className="w-full bg-destructive/60 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-destructive-foreground">Negative equity: {formatCurrency(d.wealthBuilt)}</span>
          </div>
        </div>
        <p className="text-xs text-destructive">Home value is below mortgage balance in this scenario</p>
      </div>
    );
  }

  const segments: Segment[] = ([
    { label: 'Down payment', value: d.downPayment, color: 'hsl(142, 71%, 35%)', type: 'guaranteed' as const,
      tip: 'The cash you put down when you bought the house. Guaranteed — you get it back when you sell, no matter what the market does.' },
    { label: 'Principal paid', value: d.principalPaid, color: 'hsl(142, 60%, 48%)', type: 'guaranteed' as const,
      tip: `The portion of your monthly mortgage payment that reduces your loan. Each month ~${formatCurrency(Math.round(d.principalPaid / Math.max(d.monthsOwned, 1)))} of your payment goes to principal.` },
    { label: 'Market appreciation', value: Math.max(0, d.marketAppreciation), color: 'hsl(142, 50%, 62%)', type: 'market' as const,
      tip: `Your home is worth more than what you paid, beyond renovations. Current value (${formatCurrency(d.currentHomeValue)}) − purchase price (${formatCurrency(d.purchasePrice)}) − reno value (${formatCurrency(d.totalRenoValueAdded)})` },
    { label: 'Reno value-add', value: d.totalRenoValueAdded, color: 'hsl(173, 55%, 50%)', type: 'market' as const,
      tip: `The portion of renovation spending that translated into higher home value. You spent ${formatCurrency(d.totalRenoSpend)} and ~${d.renoRecoveryPct}% came back as value.` },
  ] satisfies Segment[]).filter(s => s.value > 0);

  const total = d.wealthBuilt;
  const guaranteedPct = total > 0 ? Math.round((d.guaranteedEquity / total) * 100) : 0;
  const marketPct = 100 - guaranteedPct;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-foreground">Equity composition</p>
        <p className="text-[13px] font-bold text-success tabular-nums">
          {formatCurrency(total)}
          <ScenarioDelta scenarioVal={d.wealthBuilt} baseVal={b.wealthBuilt} active={scenarioActive} />
        </p>
      </div>

      <div className="relative h-6 rounded-lg overflow-hidden flex">
        {segments.map(seg => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          return (
            <HelpTip key={seg.label} plain={seg.tip}>
              <div
                className="flex items-center justify-center transition-all h-6"
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

      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-muted-foreground">{seg.label}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs border-t border-border pt-1.5">
        <HelpTip plain="Money you get back even if the housing market crashes to your purchase price. It's your down payment plus every dollar of principal you've paid.">
          <span className="text-muted-foreground">
            Guaranteed: <span className="font-semibold text-foreground">{formatCurrency(d.guaranteedEquity)} ({guaranteedPct}%)</span>
          </span>
        </HelpTip>
        <HelpTip plain="This equity exists because your home is worth more than what you paid. If the market drops, this shrinks. If it rises, this grows.">
          <span className="text-muted-foreground">
            Market-dependent: <span className="font-semibold text-foreground">
              {formatCurrency(d.marketDependentEquity)} ({marketPct}%)
              <ScenarioDelta scenarioVal={d.marketDependentEquity} baseVal={b.marketDependentEquity} active={scenarioActive} />
            </span>
          </span>
        </HelpTip>
      </div>
    </div>
  );
}
