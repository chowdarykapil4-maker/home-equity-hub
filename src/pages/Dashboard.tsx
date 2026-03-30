import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getEstimatedValueAdded, getEstimateMidpoint } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { ResponsiveContainer, LineChart as ReLineChart, Line } from 'recharts';
import { useHomePL } from '@/hooks/useHomePL';
import { calculateRentInvest } from '@/lib/rentInvest';
import { calculateTaxAdjusted } from '@/lib/taxCalcs';
import { calculateBreakevenTimeline } from '@/lib/breakeven';
import { Link } from 'react-router-dom';
import { HelpTip } from '@/components/homepl/HelpTip';
import { MonthOverMonthDelta } from '@/components/dashboard/MonthOverMonthDelta';
import { EquityMilestoneTracker } from '@/components/dashboard/EquityMilestoneTracker';
import { MortgagePayoffCountdown } from '@/components/dashboard/MortgagePayoffCountdown';
import { NextRenovationUp } from '@/components/dashboard/NextRenovationUp';

export default function Dashboard() {
  const { property, projects, mortgage, mortgagePayments, valueEntries, financingEntries, homePLConfig } = useAppContext();
  const pl = useHomePL();

  const completedProjects = projects.filter(p => p.status === 'Complete');
  const tax = homePLConfig.tax;
  const rentInvest10 = useMemo(() =>
    calculateRentInvest(10, pl.monthsOwned, pl.downPayment, mortgage, homePLConfig, completedProjects, pl.wealthBuilt, pl.sunkCost, pl.purchaseDate),
    [pl, mortgage, homePLConfig, completedProjects]
  );
  const taxAdj10 = useMemo(() => calculateTaxAdjusted(pl, rentInvest10, tax), [pl, rentInvest10, tax]);
  const breakeven10 = useMemo(() =>
    calculateBreakevenTimeline(pl.downPayment, pl.purchasePrice, mortgage, homePLConfig, tax, 10, pl.totalRenoValueAdded, 15),
    [pl, mortgage, homePLConfig, tax]
  );

  const totalSpent = completedProjects.reduce((s, p) => s + p.actualCost, 0);
  const totalValueAdded = completedProjects.reduce((s, p) => s + getEstimatedValueAdded(p), 0);

  const homeValue = pl.currentHomeValue;
  const mortgageBalance = pl.currentBalance;

  const lastPaymentDate = mortgagePayments.length > 0 ? [...mortgagePayments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))[0].paymentDate : null;

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const paidThisMonth = lastPaymentDate?.startsWith(currentMonthStr);

  const currentYear = now.getFullYear().toString();
  const principalThisYear = mortgagePayments.filter(p => p.paymentDate.startsWith(currentYear)).reduce((s, p) => s + p.principalPortion + p.extraPrincipal, 0);

  const totalHelocDrawn = financingEntries.filter(f => f.type === 'HELOC Draw').reduce((s, f) => s + f.remainingBalance, 0);
  const totalFinancingMonthly = financingEntries.reduce((s, f) => s + f.monthlyPayment, 0);
  const totalMonthlyObligations = mortgage.monthlyPayment + totalFinancingMonthly;

  const netEquity = homeValue - mortgageBalance - totalHelocDrawn;
  const ltv = homeValue > 0 ? (mortgageBalance / homeValue) * 100 : 0;
  const availableHeloc80 = Math.max(0, homeValue * 0.80 - mortgageBalance - totalHelocDrawn);

  const unrealizedGainLoss = homeValue - property.purchasePrice - property.closingCosts - totalSpent;

  const valueTrend = [...valueEntries].sort((a, b) => a.date.localeCompare(b.date)).slice(-6).map(e => ({ date: e.date, v: e.estimatedValue }));
  const latestValueEntry = valueEntries.length > 0 ? [...valueEntries].sort((a, b) => b.date.localeCompare(a.date))[0] : null;
  const daysSinceUpdate = latestValueEntry ? Math.floor((now.getTime() - new Date(latestValueEntry.date).getTime()) / 86400000) : Infinity;

  const valueSources = new Set(valueEntries.map(e => e.source)).size;

  const wishlist = projects.filter(p => p.status === 'Wishlist');
  const planned = projects.filter(p => p.status === 'Planned 2026' || p.status === 'Planned 2027' || p.status === 'In Progress');
  const wishlistVal = wishlist.reduce((s, p) => s + getEstimateMidpoint(p), 0);
  const plannedVal = planned.reduce((s, p) => s + getEstimateMidpoint(p), 0);

  const plannedNoCost = planned.filter(p => p.estimateLow === 0 && p.estimateHigh === 0);

  const owningWins = taxAdj10.afterTaxMargin >= 0;

  const attentionItems: { text: string; link: string; amber: boolean }[] = [];
  if (valueEntries.length === 0) attentionItems.push({ text: 'Add your home value sources for accurate tracking', link: '/property#value-history', amber: true });
  else if (daysSinceUpdate > 60) attentionItems.push({ text: `Home value last updated ${daysSinceUpdate} days ago`, link: '/property#value-history', amber: true });
  if (!paidThisMonth) attentionItems.push({ text: `Log your ${currentMonthStr} mortgage payment`, link: '/mortgage#payments', amber: true });
  if (plannedNoCost.length > 0) attentionItems.push({ text: `${plannedNoCost.length} planned project${plannedNoCost.length > 1 ? 's' : ''} need cost estimates`, link: '/renovations', amber: false });

  return (
    <div className="space-y-3 max-w-5xl mx-auto">
      <h2 className="text-xl font-medium text-foreground leading-none">Dashboard</h2>

      {/* SECTION 2 — Three Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
        {/* Home Value */}
        <Card className="border-l-[3px] border-l-primary rounded-xl">
          <CardContent className="px-4 py-3 flex flex-col justify-between h-full">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Home value</p>
            <p className="text-[28px] font-semibold leading-tight">
              <HelpTip
                plain="Your home's current estimated value. This drives all equity and P&L calculations."
                math={`Source: ${valueEntries.length > 0 ? `blended from ${valueSources} value history source${valueSources !== 1 ? 's' : ''}` : 'manual estimate — add sources in My Property for accuracy'}`}
              >
                {formatCurrency(homeValue)}
              </HelpTip>
            </p>
            {valueTrend.length > 1 && (
              <div className="h-6 mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={valueTrend}><Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} /></ReLineChart>
                </ResponsiveContainer>
              </div>
            )}
            {valueEntries.length > 0 ? (
              <p className="text-[11px] text-muted-foreground mt-1">Blended from {valueSources} source{valueSources !== 1 ? 's' : ''} · last updated {latestValueEntry?.date}</p>
            ) : (
              <Link to="/property#value-history" className="text-[11px] text-warning hover:underline mt-1 inline-block">Manual estimate — add sources in My Property</Link>
            )}
          </CardContent>
        </Card>

        {/* Equity */}
        <Card className="border-l-[3px] border-l-success rounded-xl">
          <CardContent className="px-4 py-3 flex flex-col justify-between h-full">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Equity</p>
            <p className={`text-[28px] font-semibold leading-tight ${netEquity >= 0 ? 'text-success' : 'text-destructive'}`}>
              <HelpTip
                plain="If you sold today and paid off the mortgage, this is roughly what you'd keep before selling costs."
                math={`Home value (${formatCurrency(homeValue)}) − mortgage balance (${formatCurrency(mortgageBalance)}) = ${formatCurrency(netEquity)}`}
              >
                {formatCurrency(netEquity)}
              </HelpTip>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              on {formatCurrency(homeValue)} home ·{' '}
              <HelpTip
                plain="Loan-to-value ratio — what percentage of your home's value you still owe. Below 80% means no PMI required. Lower is better."
                math={`Mortgage (${formatCurrency(mortgageBalance)}) ÷ home value (${formatCurrency(homeValue)}) = ${formatPercent(ltv)}`}
              >
                {formatPercent(ltv)} LTV
              </HelpTip>
            </p>
          </CardContent>
        </Card>

        {/* Ownership Advantage */}
        <Card className="border-l-[3px] border-l-success rounded-xl">
          <CardContent className="px-4 py-3 flex flex-col justify-between h-full">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Ownership advantage</p>
            <p className={`text-[28px] font-semibold leading-tight ${pl.ownershipAdvantage >= 0 ? 'text-success' : 'text-destructive'}`}>
              <HelpTip
                plain={`How much better off you are owning vs renting over ${pl.monthsOwned} months. Accounts for all costs and equity built.`}
                math={`Your equity (${formatCurrency(pl.wealthBuilt)}) − extra sunk cost vs renter (${formatCurrency(pl.sunkCostDiff)}) = ${formatCurrency(pl.ownershipAdvantage)}`}
              >
                {pl.ownershipAdvantage >= 0 ? '+' : ''}{formatCurrency(pl.ownershipAdvantage)}
              </HelpTip>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">vs renting over {pl.monthsOwned} months</p>
            <Link to="/home-pl" className="text-[11px] text-primary hover:underline mt-0.5 inline-block">Full P&L →</Link>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3 — Financial Health Strip */}
      <Card className="rounded-xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-3 md:grid-cols-6">
            <div className="text-center py-3 px-2 border-r border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Mortgage</p>
              <p className="text-sm font-semibold leading-tight">
                <HelpTip plain="Your remaining mortgage balance. This decreases with each monthly payment as principal is paid down.">
                  {formatCurrency(mortgageBalance)}
                </HelpTip>
              </p>
              <p className={`text-[10px] ${paidThisMonth ? 'text-success' : 'text-warning'}`}>{paidThisMonth ? '✓ Paid this month' : 'Payment due'}</p>
            </div>
            <div className="text-center py-3 px-2 border-r border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Monthly cost</p>
              <p className="text-sm font-semibold leading-tight">
                <HelpTip
                  plain="Your true monthly housing cost — only money gone forever (interest, tax, insurance, maintenance). Does NOT include principal since that builds equity."
                  math={`Total sunk cost (${formatCurrency(pl.sunkCost)}) ÷ months owned (${pl.monthsOwned})`}
                >
                  {formatCurrency(pl.monthlyCostOfOwnership)}
                </HelpTip>
              </p>
              <p className="text-[10px] text-muted-foreground">sunk cost/mo</p>
            </div>
            <div className="text-center py-3 px-2 border-r border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Wealth/mo</p>
              <p className="text-sm font-semibold leading-tight text-success">
                <HelpTip plain="Actual new wealth generated each month on average — principal paydown + appreciation + renovation value. Excludes down payment which was a transfer, not new wealth.">
                  {formatCurrency(pl.trueMonthlyWealthCreation || pl.monthlyWealthCreation)}
                </HelpTip>
              </p>
              <p className="text-[10px] text-muted-foreground">equity growth rate</p>
            </div>
            <div className="text-center py-3 px-2 border-r border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Principal YTD</p>
              <p className="text-sm font-semibold leading-tight text-success">
                <HelpTip plain="How much of your mortgage balance you've paid down so far this year. Every dollar of principal is equity you keep.">
                  {formatCurrency(principalThisYear)}
                </HelpTip>
              </p>
              <p className="text-[10px] text-muted-foreground">{currentYear}</p>
            </div>
            <div className="text-center py-3 px-2 border-r border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Monthly obligations</p>
              <p className="text-sm font-semibold leading-tight">
                <HelpTip
                  plain="Total monthly payments across all debt — mortgage P&I plus any renovation financing (0% promos, HELOC payments)."
                  math={`Mortgage (${formatCurrency(mortgage.monthlyPayment)}) + financing (${formatCurrency(totalFinancingMonthly)})`}
                >
                  {formatCurrency(totalMonthlyObligations)}
                </HelpTip>
              </p>
              <p className="text-[10px] text-muted-foreground">Mortgage + financing</p>
            </div>
            <div className="text-center py-3 px-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">HELOC available</p>
              <p className="text-sm font-semibold leading-tight">
                <HelpTip
                  plain="How much you could borrow against your home equity via a HELOC, based on 80% combined loan-to-value ratio."
                  math="Home value × 80% − mortgage − existing HELOC draws = available credit"
                >
                  {formatCurrency(availableHeloc80)}
                </HelpTip>
              </p>
              <p className="text-[10px] text-muted-foreground">at 80% CLTV</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mortgage Payoff Countdown */}
      <MortgagePayoffCountdown />

      {/* Month-over-Month Delta Strip */}
      <MonthOverMonthDelta />

      {/* SECTION 4 — Home P&L Summary */}
      <Card className="rounded-xl">
        <CardContent className="px-4 py-3">
          <div className="grid grid-cols-3 text-center">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Wealth built</p>
              <p className="text-lg font-bold text-success">
                <HelpTip plain="Total equity in your home — down payment + principal paid + market appreciation + renovation value added.">
                  {formatCurrency(pl.wealthBuilt)}
                </HelpTip>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Sunk cost</p>
              <p className="text-lg font-bold text-destructive/70">
                <HelpTip plain="Money spent on the house that you can never recover — interest, property tax, insurance, maintenance, and the portion of renovations that didn't add value.">
                  {formatCurrency(pl.sunkCost)}
                </HelpTip>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">vs rent+invest (10%, after-tax)</p>
              <p className={`text-lg font-bold ${owningWins ? 'text-success' : 'text-warning'}`}>
                <HelpTip
                  plain={`After accounting for taxes on investment gains, ${owningWins ? 'owning' : 'renting and investing'} comes out ahead by this amount over ${pl.monthsOwned} months.`}
                  math={`After-tax ownership wealth − after-tax renter wealth = ${formatCurrency(Math.abs(taxAdj10.afterTaxMargin))} advantage`}
                >
                  {owningWins ? 'Own wins' : 'Rent wins'} +{formatCurrency(Math.abs(taxAdj10.afterTaxMargin))}
                </HelpTip>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 text-center mt-2 pt-2 border-t border-border/30">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Unrealized gain</p>
              <p className={`text-sm font-semibold ${unrealizedGainLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                <HelpTip
                  plain="How much your home has appreciated minus all costs you've put into it. This is 'unrealized' because you'd need to sell to capture it."
                  math={`Home value (${formatCurrency(homeValue)}) − purchase price (${formatCurrency(property.purchasePrice)}) − closing costs (${formatCurrency(property.closingCosts)}) − reno spend (${formatCurrency(totalSpent)})`}
                >
                  {unrealizedGainLoss >= 0 ? '+' : ''}{formatCurrency(unrealizedGainLoss)}
                </HelpTip>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Breakeven</p>
              <p className="text-sm font-semibold">
                <HelpTip plain="The year when owning becomes cheaper than renting and investing the difference at 10% annual return, after accounting for taxes.">
                  {breakeven10.crossoverYear && breakeven10.crossoverYear <= Math.ceil(pl.yearsOwned)
                    ? `Year ${breakeven10.crossoverYear} — past breakeven ✓`
                    : breakeven10.crossoverYear
                      ? `Year ${breakeven10.crossoverYear}`
                      : '15+ years'}
                </HelpTip>
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Link to="/home-pl" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                View full P&L <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equity Milestone Tracker */}
      <EquityMilestoneTracker />

      {/* SECTION 5 — Renovation Snapshot */}
      <Card className="rounded-xl">
        <CardContent className="px-4 py-4 flex items-center justify-center gap-12">
          <div className="flex-[3] flex items-center justify-center gap-2">
            <div className="text-center bg-muted rounded-full px-4 py-2 min-w-[80px]">
              <p className="text-lg font-bold">{wishlist.length}</p>
              <p className="text-[10px] text-muted-foreground">Wishlist</p>
              <p className="text-[10px] text-muted-foreground">{formatCurrency(wishlistVal)}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="text-center bg-primary/10 rounded-full px-4 py-2 min-w-[80px]">
              <p className="text-lg font-bold text-primary">{planned.length}</p>
              <p className="text-[10px] text-muted-foreground">Planned</p>
              <p className="text-[10px] text-muted-foreground">{formatCurrency(plannedVal)}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="text-center bg-success/10 rounded-full px-4 py-2 min-w-[80px]">
              <p className="text-lg font-bold text-success">{completedProjects.length}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
              <p className="text-[10px] text-muted-foreground">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
          <div className="flex-[2] flex flex-col justify-center gap-0.5">
            <p className="text-sm font-semibold">Total invested: {formatCurrency(totalSpent)}</p>
            <p className="text-[13px] text-success">
              Value recovered:{' '}
              <HelpTip plain="The estimated market value added by completed renovations. A 55% recovery means for every $1 spent, $0.55 shows up in home value.">
                {formatCurrency(totalValueAdded)} ({totalSpent > 0 ? Math.round(totalValueAdded / totalSpent * 100) : 0}%)
              </HelpTip>
            </p>
            <p className="text-[13px] text-destructive/70">
              Net reno cost:{' '}
              <HelpTip plain="The portion of renovation spending that didn't translate into home value — this is the true sunk cost of renovations.">
                {formatCurrency(totalSpent - totalValueAdded)}
              </HelpTip>
            </p>
            <Link to="/renovations" className="text-[11px] text-primary hover:underline mt-1 inline-flex items-center gap-1">
              Manage projects <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 6 — Attention Items */}
      {attentionItems.length > 0 && (
        <Card className="rounded-xl bg-muted/50 border-muted">
          <CardContent className="px-4 py-2.5 space-y-1">
            {attentionItems.map((item, i) => (
              <Link key={i} to={item.link} className="flex items-center gap-2 text-xs hover:underline">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${item.amber ? 'bg-warning' : 'bg-muted-foreground'}`} />
                <span className={item.amber ? 'text-warning' : 'text-muted-foreground'}>{item.text}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}