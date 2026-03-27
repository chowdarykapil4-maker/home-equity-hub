import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';

export default function MoneyFlowBar({ d }: { d: HomePLData }) {
  const equityPct = d.totalCashOut > 0 ? (d.equityBuildingSpend / d.totalCashOut) * 100 : 50;
  const sunkPct = 100 - equityPct;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Where your money went</p>
        <p className="text-sm font-bold tabular-nums">{formatCurrency(d.totalCashOut)} total cash out</p>
      </div>

      {/* Stacked bar */}
      <div className="relative h-8 rounded-lg overflow-hidden flex">
        <div
          className="bg-success/80 flex items-center justify-center transition-all"
          style={{ width: `${equityPct}%` }}
        >
          <span className="text-[11px] font-semibold text-success-foreground whitespace-nowrap px-2">
            Builds equity · {formatCurrency(d.equityBuildingSpend)} ({Math.round(equityPct)}%)
          </span>
        </div>
        <div
          className="bg-destructive/70 flex items-center justify-center transition-all"
          style={{ width: `${sunkPct}%` }}
        >
          <span className="text-[11px] font-semibold text-destructive-foreground whitespace-nowrap px-2">
            Sunk cost · {formatCurrency(d.sunkCost)} ({Math.round(sunkPct)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
