import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';
import { HelpTip } from './HelpTip';

export default function MoneyFlowBar({ d }: { d: HomePLData }) {
  const equityPct = d.totalCashOut > 0 ? (d.equityBuildingSpend / d.totalCashOut) * 100 : 50;
  const sunkPct = 100 - equityPct;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-foreground">Where your money went</p>
        <HelpTip
          plain="Every dollar that has left your pocket related to this house since you bought it"
          math="Down payment + all mortgage payments + renovations + taxes + insurance + maintenance"
        >
          <p className="text-[13px] font-bold tabular-nums">{formatCurrency(d.totalCashOut)} total cash out</p>
        </HelpTip>
      </div>

      <div className="relative h-8 rounded-lg overflow-hidden flex">
        <HelpTip
          plain="This portion of your spending actually built wealth — you'll get this money back when you sell"
          math={`Down payment (${formatCurrency(d.downPayment)}) + principal paid (${formatCurrency(d.principalPaid)}) + renovation value recovered (${formatCurrency(d.totalRenoValueAdded)})`}
        >
          <div
            className="bg-success/80 flex items-center justify-center transition-all h-8"
            style={{ width: `${equityPct}%`, minWidth: 0 }}
          >
            <span className="text-[11px] font-semibold text-success-foreground whitespace-nowrap px-2">
              Builds equity · {formatCurrency(d.equityBuildingSpend)} ({Math.round(equityPct)}%)
            </span>
          </div>
        </HelpTip>
        <HelpTip
          plain="This money is gone forever — it's the price of living in and maintaining the home"
          math={`Interest (${formatCurrency(d.interestPaid)}) + property tax (${formatCurrency(d.totalPropertyTax)}) + net reno cost (${formatCurrency(d.netRenoCost)}) + insurance (${formatCurrency(d.totalInsurance)}) + maintenance (${formatCurrency(d.totalMaintenance)})`}
        >
          <div
            className="bg-destructive/70 flex items-center justify-center transition-all h-8"
            style={{ width: `${sunkPct}%`, minWidth: 0 }}
          >
            <span className="text-[11px] font-semibold text-destructive-foreground whitespace-nowrap px-2">
              Sunk cost · {formatCurrency(d.sunkCost)} ({Math.round(sunkPct)}%)
            </span>
          </div>
        </HelpTip>
      </div>
    </div>
  );
}
