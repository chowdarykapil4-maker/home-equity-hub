import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import ScenarioDelta from './ScenarioDelta';
import { HelpTip } from './HelpTip';

interface Props {
  d: HomePLData;
  baseD?: HomePLData;
  scenarioActive?: boolean;
}

export default function CostEquityChart({ d, baseD, scenarioActive = false }: Props) {
  const b = baseD || d;
  const todayKey = d.chartData.length > 0 ? d.chartData[d.chartData.length - 1].month : null;
  const equityGrowthRate = d.trueMonthlyWealthCreation;
  const sunkGrowthRate = d.monthsOwned > 0 ? d.sunkCost / d.monthsOwned : 0;
  const ratio = sunkGrowthRate > 0 ? (equityGrowthRate / sunkGrowthRate).toFixed(1) : '∞';

  const baseRatio = (() => {
    const bEq = b.trueMonthlyWealthCreation;
    const bSunk = b.monthsOwned > 0 ? b.sunkCost / b.monthsOwned : 0;
    return bSunk > 0 ? (bEq / bSunk) : 0;
  })();

  return (
    <div className="px-4 py-2 space-y-2">
      <HelpTip
        plain="Tracks how your equity (green) and sunk costs (red) have grown month by month since purchase. The dashed line shows what a renter would have spent. When green pulls above red, you're building wealth faster than you're losing it."
      >
        <p className="text-[13px] font-medium text-foreground">Cost & equity over time</p>
      </HelpTip>

      {/* Inline legend */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-[2px] rounded-full" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }} />
          Equity built
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-[2px] rounded-full" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }} />
          Sunk cost
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-[2px] rounded-full border-t border-dashed" style={{ borderColor: 'hsl(215, 16%, 47%)' }} />
          Renter would have spent
        </span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={d.chartData}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="sunkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={5} />
            <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={l => `Month: ${l}`} />
            <Area type="monotone" dataKey="equity" name="Equity" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fill="url(#equityFill)" dot={false} />
            <Area type="monotone" dataKey="sunkCost" name="Sunk cost" stroke="hsl(0, 84%, 60%)" strokeWidth={2} fill="url(#sunkFill)" dot={false} />
            <Area type="monotone" dataKey="rent" name="Renter spent" stroke="hsl(215, 16%, 47%)" strokeWidth={1.5} strokeDasharray="5 5" fill="none" dot={false} />
            {todayKey && (
              <ReferenceLine x={todayKey} stroke="hsl(215, 16%, 47%)" strokeDasharray="3 3" label={{ value: 'Today', position: 'top', fontSize: 10, fill: 'hsl(215, 16%, 47%)' }} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Your equity is growing{' '}
        <HelpTip
          plain={`For every $1 you lose to sunk costs, $${ratio} in new wealth is generated (excluding your initial down payment). This ratio improves each year as more of your mortgage goes to principal.`}
          math={`Monthly true wealth creation (${formatCurrency(equityGrowthRate)}) ÷ monthly sunk cost (${formatCurrency(sunkGrowthRate)}) = ${ratio}×`}
        >
          <span className="font-semibold text-success">{ratio}×</span>
        </HelpTip>
        {' '}faster than your sunk cost
        {scenarioActive && (
          <ScenarioDelta scenarioVal={parseFloat(ratio as string) || 0} baseVal={baseRatio} active={true} />
        )}
      </p>
    </div>
  );
}
