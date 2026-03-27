import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';

interface Segment {
  label: string;
  value: number;
  color: string;
  type: 'guaranteed' | 'market';
}

export default function EquityComposition({ d }: { d: HomePLData }) {
  const segments: Segment[] = ([
    { label: 'Down payment', value: d.downPayment, color: 'hsl(142, 71%, 35%)', type: 'guaranteed' as const },
    { label: 'Principal paid', value: d.principalPaid, color: 'hsl(142, 60%, 48%)', type: 'guaranteed' as const },
    { label: 'Market appreciation', value: d.marketAppreciation, color: 'hsl(142, 50%, 62%)', type: 'market' as const },
    { label: 'Reno value-add', value: d.totalRenoValueAdded, color: 'hsl(173, 55%, 50%)', type: 'market' as const },
  ] satisfies Segment[]).filter(s => s.value > 0);

  const total = d.wealthBuilt;
  const guaranteedPct = total > 0 ? Math.round((d.guaranteedEquity / total) * 100) : 0;
  const marketPct = 100 - guaranteedPct;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-foreground">Equity composition</p>
        <p className="text-[13px] font-bold text-success tabular-nums">{formatCurrency(total)}</p>
      </div>

      <div className="relative h-6 rounded-lg overflow-hidden flex">
        {segments.map(seg => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          return (
            <div
              key={seg.label}
              className="flex items-center justify-center transition-all"
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${formatCurrency(seg.value)}`}
            >
              {pct > 12 && (
                <span className="text-[10px] font-semibold text-white whitespace-nowrap px-1">
                  {formatCurrency(seg.value)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend — inline */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-muted-foreground">{seg.label}</span>
          </div>
        ))}
      </div>

      {/* Guaranteed vs market */}
      <div className="flex justify-between text-xs border-t border-border pt-1.5">
        <span className="text-muted-foreground">
          Guaranteed: <span className="font-semibold text-foreground">{formatCurrency(d.guaranteedEquity)} ({guaranteedPct}%)</span>
        </span>
        <span className="text-muted-foreground">
          Market-dependent: <span className="font-semibold text-foreground">{formatCurrency(d.marketDependentEquity)} ({marketPct}%)</span>
        </span>
      </div>
    </div>
  );
}
