import { useMemo } from 'react'; // v2
import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';
import { useAppContext } from '@/context/AppContext';
import { generateAmortizationSchedule } from '@/lib/amortization';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import ScenarioDelta from './ScenarioDelta';
import { HelpTip } from './HelpTip';

interface Props {
  d: HomePLData;
  baseD?: HomePLData;
  scenarioActive?: boolean;
}

export default function CostEquityChart({ d, baseD, scenarioActive = false }: Props) {
  const b = baseD || d;
  const { mortgage, mortgagePayments, homePLConfig } = useAppContext();

  const historicalGrowthRate = d.trueMonthlyWealthCreation;
  const sunkGrowthRate = d.monthsOwned > 0 ? d.sunkCost / d.monthsOwned : 0;
  const historicalRatio = sunkGrowthRate > 0 ? (historicalGrowthRate / sunkGrowthRate).toFixed(1) : '∞';
  const forwardRatio = sunkGrowthRate > 0 ? (d.sustainableMonthlyRate / sunkGrowthRate).toFixed(1) : '∞';

  const baseRatio = (() => {
    const bEq = b.trueMonthlyWealthCreation;
    const bSunk = b.monthsOwned > 0 ? b.sunkCost / b.monthsOwned : 0;
    return bSunk > 0 ? (bEq / bSunk) : 0;
  })();
  const baseForwardRatio = (() => {
    const bSunk = b.monthsOwned > 0 ? b.sunkCost / b.monthsOwned : 0;
    return bSunk > 0 ? (b.sustainableMonthlyRate / bSunk) : 0;
  })();

  const assumedAppreciation = (homePLConfig.tax?.annualAppreciation || 2) / 100;
  const annualRentIncrease = (homePLConfig.tax?.annualRentIncrease || 3) / 100;

  const { fullChartData, todayMonth, lastMonth, projected10yrEquity } = useMemo(() => {
    const sorted = [...mortgagePayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
    const amortRows = generateAmortizationSchedule(mortgage, sorted);
    const monthlyAppRate = assumedAppreciation / 12;
    const resolvedRent = d.resolvedRent || homePLConfig.estimatedMonthlyRent;

    const historical = d.chartData.map(p => ({ ...p, projected: false }));
    if (historical.length === 0) return { fullChartData: [], todayMonth: null, lastMonth: null, projected10yrEquity: 0 };

    const last = historical[historical.length - 1];
    const todayM = last.month;

    // Find current position in amortization
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentAmortIdx = amortRows.findIndex(r => r.date === currentYM);

    let projHomeValue = d.currentHomeValue;
    let projBalance = sorted.length > 0 ? sorted[sorted.length - 1].remainingBalance : mortgage.originalLoanAmount;
    let projSunk = last.sunkCost;
    let projRent = last.rent;

    const projectionData: { month: string; equity: number; sunkCost: number; rent: number; projected: boolean }[] = [];
    const lastDate = new Date(last.month + '-01');

    for (let m = 1; m <= 120; m++) {
      const projDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + m, 1);
      const monthStr = `${projDate.getFullYear()}-${String(projDate.getMonth() + 1).padStart(2, '0')}`;

      // Find amortization row for this future month
      const amortIdx = currentAmortIdx >= 0 ? currentAmortIdx + m : -1;
      const amortRow = amortIdx >= 0 && amortIdx < amortRows.length ? amortRows[amortIdx] : null;
      const monthPrincipal = amortRow ? amortRow.principalPortion : 0;
      const monthInterest = amortRow ? amortRow.interestPortion : 0;

      projHomeValue = projHomeValue * (1 + monthlyAppRate);
      projBalance = Math.max(0, projBalance - monthPrincipal);

      const projEquity = projHomeValue - projBalance + d.totalRenoValueAdded;

      const monthlyTax = homePLConfig.annualPropertyTax / 12;
      const monthlyMaint = homePLConfig.annualMaintenance / 12;
      projSunk += monthInterest + monthlyTax + homePLConfig.monthlyInsurance + monthlyMaint;

      const yearsOut = m / 12;
      const currentRentMonth = resolvedRent * Math.pow(1 + annualRentIncrease, yearsOut);
      projRent += currentRentMonth;

      projectionData.push({
        month: monthStr,
        equity: Math.round(projEquity),
        sunkCost: Math.round(projSunk),
        rent: Math.round(projRent),
        projected: true,
      });
    }

    return {
      fullChartData: [...historical, ...projectionData],
      todayMonth: todayM,
      lastMonth: projectionData.length > 0 ? projectionData[projectionData.length - 1].month : null,
      projected10yrEquity: projectionData.length > 0 ? projectionData[projectionData.length - 1].equity : 0,
    };
  }, [d.chartData, d.currentHomeValue, d.resolvedRent, d.totalRenoValueAdded, mortgage, mortgagePayments, homePLConfig, assumedAppreciation, annualRentIncrease]);

  const tickInterval = Math.max(1, Math.floor(fullChartData.length / 8));

  return (
    <div className="px-3 pt-1.5 pb-0.5 space-y-0.5">
      <HelpTip
        plain="Tracks how your equity (green) and sunk costs (red) have grown since purchase, with a 10-year projection based on current assumptions. The dashed line shows what a renter would have spent."
      >
        <p className="text-[13px] font-medium text-foreground">Cost & equity over time</p>
      </HelpTip>

      {/* Inline legend */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
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
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm bg-muted border border-border/50" />
          Projected ({(assumedAppreciation * 100).toFixed(0)}%/yr)
        </span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fullChartData}>
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
            <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={tickInterval} />
            <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={l => `Month: ${l}`} />
            {todayMonth && lastMonth && (
              <ReferenceArea x1={todayMonth} x2={lastMonth} fill="hsl(var(--muted))" fillOpacity={0.4} />
            )}
            <Area type="monotone" dataKey="equity" name="Equity" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fill="url(#equityFill)" dot={false} />
            <Area type="monotone" dataKey="sunkCost" name="Sunk cost" stroke="hsl(0, 84%, 60%)" strokeWidth={2} fill="url(#sunkFill)" dot={false} />
            <Area type="monotone" dataKey="rent" name="Renter spent" stroke="hsl(215, 16%, 47%)" strokeWidth={1.5} strokeDasharray="5 5" fill="none" dot={false} />
            {todayMonth && (
              <ReferenceLine x={todayMonth} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: '← Actual | Projected →', position: 'top', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-0.5">
        <HelpTip
          plain={`Historical: includes all wealth gains (principal, appreciation, renovations) vs all sunk costs. Sustainable: uses only your conservative forward rate (principal + ${(assumedAppreciation * 100).toFixed(0)}% appreciation) vs sunk costs. When sustainable exceeds 1.0×, your recurring gains alone outpace your housing costs.`}
          math={`Historical: ${formatCurrency(historicalGrowthRate)}/mo ÷ ${formatCurrency(sunkGrowthRate)}/mo = ${historicalRatio}×\nSustainable: ${formatCurrency(d.sustainableMonthlyRate)}/mo ÷ ${formatCurrency(sunkGrowthRate)}/mo = ${forwardRatio}×`}
        >
          <span>
            Equity growth vs sunk cost: <span className="font-semibold text-success">{historicalRatio}×</span> historical
            {' · '}
            <span className={`font-semibold ${parseFloat(forwardRatio) >= 1 ? 'text-success' : 'text-amber-500'}`}>{forwardRatio}×</span> sustainable
          </span>
        </HelpTip>
        {scenarioActive && (
          <ScenarioDelta scenarioVal={parseFloat(forwardRatio) || 0} baseVal={baseForwardRatio} active={true} />
        )}
        {projected10yrEquity > 0 && (
          <>
            {' · '}
            <HelpTip
              plain={`Projection assumes ${(assumedAppreciation * 100).toFixed(0)}% annual appreciation, current mortgage terms, and ${(annualRentIncrease * 100).toFixed(0)}% annual rent increases. Actual results will vary.`}
            >
              <span className="font-semibold">{formatCurrency(projected10yrEquity)}</span>
            </HelpTip>
            {' equity in 10 years'}
          </>
        )}
      </p>
    </div>
  );
}
