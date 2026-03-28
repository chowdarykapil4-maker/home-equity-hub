import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAppContext } from '@/context/AppContext';
import { HomePLData } from '@/hooks/useHomePL';
import { HelpTip } from './HelpTip';
import { formatCurrency } from '@/lib/format';
import { getEstimatedValueAdded } from '@/types';
import { generateAmortizationSchedule } from '@/lib/amortization';

interface AnnualReportProps {
  d: HomePLData;
  defaultOpen?: boolean;
}

interface YearData {
  year: number;
  label: string;
  months: number;
  principalPaid: number;
  interestPaid: number;
  piRatio: number;
  yearEndBalance: number;
  renoSpend: number;
  renoValueAdded: number;
  propertyTax: number;
  insurance: number;
  maintenance: number;
  totalSunk: number;
  estimatedHomeValue: number;
  yearEndEquity: number;
  equityGained: number;
}

export default function AnnualReport({ d }: AnnualReportProps) {
  const [open, setOpen] = useState(false);
  const [showAllYears, setShowAllYears] = useState(false);
  const { mortgagePayments, projects, homePLConfig, property, valueEntries, mortgage } = useAppContext();

  const { yearData, crossoverYear } = useMemo(() => {
    const sorted = [...mortgagePayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
    const [pYear, pMonth] = d.purchaseDate.split('-').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const completeProjects = projects.filter(p => p.status === 'Complete');

    // Value entries sorted by date for interpolation
    const sortedValues = [...valueEntries].sort((a, b) => a.date.localeCompare(b.date));

    const years: YearData[] = [];
    let prevEquity = d.downPayment;

    for (let y = pYear; y <= currentYear; y++) {
      const isFirstYear = y === pYear;
      const isCurrentYear = y === currentYear;
      const startM = isFirstYear ? pMonth : 1;
      const endM = isCurrentYear ? currentMonth : 12;
      const months = endM - startM + 1;

      let label = `${y}`;
      if (isFirstYear && pMonth > 1) {
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        label = `${y} (${monthNames[pMonth - 1]}-Dec)`;
      }
      if (isCurrentYear && currentMonth < 12) {
        label = `${y} (partial)`;
      }

      // Mortgage data for this year
      const yearPayments = sorted.filter(p => {
        const py = parseInt(p.paymentDate.substring(0, 4));
        const pm = parseInt(p.paymentDate.substring(5, 7));
        return py === y && pm >= startM && pm <= endM;
      });

      const principalPaid = yearPayments.reduce((s, p) => s + p.principalPortion + p.extraPrincipal, 0);
      const interestPaid = yearPayments.reduce((s, p) => s + p.interestPortion, 0);
      const piRatio = (principalPaid + interestPaid) > 0 ? (principalPaid / (principalPaid + interestPaid)) * 100 : 0;
      const yearEndBalance = yearPayments.length > 0
        ? yearPayments[yearPayments.length - 1].remainingBalance
        : (years.length > 0 ? years[years.length - 1].yearEndBalance : mortgage.originalLoanAmount);

      // Renovations completed this year
      const yearRenos = completeProjects.filter(p => {
        if (!p.dateCompleted) return false;
        const ry = parseInt(p.dateCompleted.substring(0, 4));
        return ry === y;
      });
      const renoSpend = yearRenos.reduce((s, p) => s + p.actualCost, 0);
      const renoValueAdded = yearRenos.reduce((s, p) => s + getEstimatedValueAdded(p), 0);

      // Prorated fixed costs
      const fraction = months / 12;
      const propertyTax = homePLConfig.annualPropertyTax * fraction;
      const insurance = homePLConfig.monthlyInsurance * months;
      const maintenance = homePLConfig.annualMaintenance * fraction;

      const totalSunk = interestPaid + propertyTax + insurance + maintenance + Math.max(0, renoSpend - renoValueAdded);

      // Estimate home value at year end
      let estimatedHomeValue: number;
      const yearEndDate = isCurrentYear ? `${y}-${String(currentMonth).padStart(2, '0')}-28` : `${y}-12-31`;

      // Try to find a value entry near year-end
      const nearEntries = sortedValues.filter(v => {
        const vy = parseInt(v.date.substring(0, 4));
        return vy === y;
      });
      if (nearEntries.length > 0) {
        // Use the latest entry in this year
        estimatedHomeValue = nearEntries[nearEntries.length - 1].estimatedValue;
      } else {
        // Linear interpolation
        const totalMonthsOwned = d.monthsOwned;
        const monthsIntoOwnership = (y === pYear)
          ? (12 - pMonth + 1)
          : (y - pYear) * 12 - pMonth + 1 + (isCurrentYear ? currentMonth : 12);
        const fraction = totalMonthsOwned > 0 ? Math.min(1, monthsIntoOwnership / totalMonthsOwned) : 1;
        estimatedHomeValue = d.purchasePrice + (d.currentHomeValue - d.purchasePrice) * fraction;
      }

      const yearEndEquity = estimatedHomeValue - yearEndBalance;
      const equityGained = yearEndEquity - prevEquity;

      years.push({
        year: y, label, months, principalPaid, interestPaid, piRatio,
        yearEndBalance, renoSpend, renoValueAdded, propertyTax, insurance,
        maintenance, totalSunk, estimatedHomeValue, yearEndEquity, equityGained,
      });

      prevEquity = yearEndEquity;
    }

    // P/I crossover year from amortization schedule
    const schedule = generateAmortizationSchedule(mortgage, mortgagePayments);
    const crossoverRow = schedule.find(r => r.principalPortion > r.interestPortion);
    const crossoverYear = crossoverRow ? parseInt(crossoverRow.date.substring(0, 4)) : null;

    return { yearData: years, crossoverYear };
  }, [d, mortgagePayments, projects, homePLConfig, property, valueEntries, mortgage]);

  const reversedYears = [...yearData].reverse();
  const displayYears = showAllYears || reversedYears.length <= 4 ? reversedYears : reversedYears.slice(0, 3);
  const hasMore = reversedYears.length > 4 && !showAllYears;

  // Most recent complete year for collapsed preview
  const now = new Date();
  const mostRecentComplete = yearData.filter(y => y.year < now.getFullYear());
  const previewYear = mostRecentComplete.length > 0 ? mostRecentComplete[mostRecentComplete.length - 1] : yearData[yearData.length - 1];

  // Trend data (oldest to newest, need at least 2 years)
  const trendYears = yearData.filter(y => y.months >= 6); // only meaningful years

  // P/I improvement
  const firstPI = trendYears.length > 0 ? trendYears[0].piRatio : 0;
  const lastPI = trendYears.length > 0 ? trendYears[trendYears.length - 1].piRatio : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between px-3 py-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <span className="text-sm font-medium text-foreground">Annual report</span>
          <div className="flex items-center gap-3">
            {previewYear && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                {previewYear.year}: +{formatCurrency(previewYear.equityGained)} equity gained
              </span>
            )}
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-3">
        {/* Section A — Year strips */}
        <div className="space-y-0">
          {displayYears.map((yr, idx) => (
            <div
              key={yr.year}
              className={`px-3 py-2.5 rounded-md ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}
            >
              {/* Row 1: Year + equity gained */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{yr.label}</span>
                <HelpTip
                  plain="How much your equity grew during this calendar year — from principal paydown, appreciation, and renovation value."
                  math={`Year-end equity (${formatCurrency(yr.yearEndEquity)}) minus start-of-year equity`}
                >
                  <span className={`text-sm font-semibold ${yr.equityGained >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {yr.equityGained >= 0 ? '+' : ''}{formatCurrency(yr.equityGained)}
                  </span>
                </HelpTip>
              </div>

              {/* Row 2: Principal + Interest + P/I bar */}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground">
                  Principal: <span className="text-foreground">{formatCurrency(yr.principalPaid)}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  Interest: <span className="text-foreground">{formatCurrency(yr.interestPaid)}</span>
                </span>
                <HelpTip
                  plain="Percentage of your mortgage payment going to principal (equity) vs interest (sunk cost). Early on, most goes to interest. Over time, this flips — each year more of your money builds wealth."
                  math={`${yr.piRatio.toFixed(0)}% to principal, ${(100 - yr.piRatio).toFixed(0)}% to interest`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-20 h-2 rounded-full overflow-hidden bg-muted flex">
                      <div
                        className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-l-full"
                        style={{ width: `${yr.piRatio}%` }}
                      />
                      <div
                        className="h-full bg-red-400 dark:bg-red-400/70 rounded-r-full"
                        style={{ width: `${100 - yr.piRatio}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{yr.piRatio.toFixed(0)}%</span>
                  </div>
                </HelpTip>
              </div>

              {/* Row 3: Renos + sunk cost */}
              <div className="flex items-center gap-3 mt-0.5">
                {yr.renoSpend > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Renos: <span className="text-foreground">{formatCurrency(yr.renoSpend)}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 ml-1">({formatCurrency(yr.renoValueAdded)} value)</span>
                  </span>
                )}
                <HelpTip
                  plain="Non-recoverable costs for this year: interest + taxes + insurance + maintenance + net renovation cost."
                  math={`Interest (${formatCurrency(yr.interestPaid)}) + tax (${formatCurrency(yr.propertyTax)}) + ins (${formatCurrency(yr.insurance)}) + maint (${formatCurrency(yr.maintenance)})`}
                >
                  <span className="text-xs text-muted-foreground">
                    Sunk cost: <span className="text-foreground">{formatCurrency(yr.totalSunk)}</span>
                  </span>
                </HelpTip>
              </div>

              {/* Row 4: Year-end equity + home value */}
              <div className="flex items-center gap-3 mt-0.5">
                <HelpTip
                  plain="Home value minus mortgage balance as of December 31."
                  math={`${formatCurrency(yr.estimatedHomeValue)} − ${formatCurrency(yr.yearEndBalance)} = ${formatCurrency(yr.yearEndEquity)}`}
                >
                  <span className="text-xs text-muted-foreground">
                    Year-end equity: <span className="text-foreground font-medium">{formatCurrency(yr.yearEndEquity)}</span>
                  </span>
                </HelpTip>
                <span className="text-xs text-muted-foreground">
                  Home value: ~{formatCurrency(yr.estimatedHomeValue)}
                </span>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => setShowAllYears(true)}
              className="w-full text-xs text-primary hover:underline py-1.5"
            >
              Show all {reversedYears.length} years
            </button>
          )}
        </div>

        {/* Section B — Trend line */}
        {trendYears.length >= 2 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              P/I ratio: {trendYears.map(y => `${y.piRatio.toFixed(0)}%`).join(' → ')}
              {lastPI > firstPI
                ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                : <TrendingDown className="h-3 w-3 text-red-400" />
              }
            </span>
            <span className="flex items-center gap-1">
              Sunk: {trendYears.map(y => formatCurrency(y.totalSunk)).join(' → ')}
              {trendYears[trendYears.length - 1].totalSunk < trendYears[0].totalSunk
                ? <TrendingDown className="h-3 w-3 text-emerald-500" />
                : <TrendingUp className="h-3 w-3 text-red-400" />
              }
            </span>
            <span className="flex items-center gap-1">
              Equity: {trendYears.map(y => `+${formatCurrency(y.equityGained)}`).join(' → ')}
              {trendYears[trendYears.length - 1].equityGained > trendYears[0].equityGained
                ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                : <TrendingDown className="h-3 w-3 text-red-400" />
              }
            </span>
          </div>
        )}

        {/* Section C — Insight */}
        {crossoverYear && trendYears.length >= 2 && (
          <div className="mx-3 px-3 py-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
            <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Your P/I ratio has improved from {firstPI.toFixed(0)}% to {lastPI.toFixed(0)}% since purchase.
                {' '}
                <HelpTip
                  plain="The year when more than half of each payment goes to principal instead of interest — a major financial milestone."
                  math={`Based on your ${mortgage.interestRate}% rate and current amortization schedule`}
                >
                  <span className="font-medium">By {crossoverYear}</span>
                </HelpTip>
                , more than half your payment will go to principal.
              </span>
            </p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
