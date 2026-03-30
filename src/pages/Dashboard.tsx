import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getEstimatedValueAdded, getEstimateMidpoint } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart as ReLineChart, Line } from 'recharts';
import { useHomePL } from '@/hooks/useHomePL';
import { calculateRentInvest } from '@/lib/rentInvest';
import { calculateTaxAdjusted } from '@/lib/taxCalcs';
import { calculateBreakevenTimeline } from '@/lib/breakeven';
import { Link } from 'react-router-dom';

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

  // Unique value sources
  const valueSources = new Set(valueEntries.map(e => e.source)).size;

  // Renovation pipeline
  const wishlist = projects.filter(p => p.status === 'Wishlist');
  const planned = projects.filter(p => p.status === 'Planned 2026' || p.status === 'Planned 2027' || p.status === 'In Progress');
  const wishlistVal = wishlist.reduce((s, p) => s + getEstimateMidpoint(p), 0);
  const plannedVal = planned.reduce((s, p) => s + getEstimateMidpoint(p), 0);

  // Planned projects missing cost estimates
  const plannedNoCost = planned.filter(p => p.estimateLow === 0 && p.estimateHigh === 0);

  const owningWins = taxAdj10.afterTaxMargin >= 0;

  // Attention items
  const attentionItems: { text: string; link: string; amber: boolean }[] = [];
  if (valueEntries.length === 0) attentionItems.push({ text: 'Add your home value sources for accurate tracking', link: '/property#value-history', amber: true });
  else if (daysSinceUpdate > 60) attentionItems.push({ text: `Home value last updated ${daysSinceUpdate} days ago`, link: '/property#value-history', amber: true });
  if (!paidThisMonth) attentionItems.push({ text: `Log your ${currentMonthStr} mortgage payment`, link: '/mortgage#payments', amber: true });
  if (plannedNoCost.length > 0) attentionItems.push({ text: `${plannedNoCost.length} planned project${plannedNoCost.length > 1 ? 's' : ''} need cost estimates`, link: '/renovations', amber: false });

  return (
    <div className="space-y-3 max-w-7xl mx-auto">
      {/* SECTION 1 — Title */}
      <h2 className="text-xl font-medium text-foreground leading-none">Dashboard</h2>

      {/* SECTION 2 — Three Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Home Value */}
        <Card className="border-l-[3px] border-l-primary rounded-xl">
          <CardContent className="px-4 py-3">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Home value</p>
            <p className="text-[28px] font-semibold leading-tight">{formatCurrency(homeValue)}</p>
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
          <CardContent className="px-4 py-3">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Equity</p>
            <p className={`text-[28px] font-semibold leading-tight ${netEquity >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(netEquity)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">on {formatCurrency(homeValue)} home · {formatPercent(ltv)} LTV</p>
          </CardContent>
        </Card>

        {/* Ownership Advantage */}
        <Card className="border-l-[3px] border-l-success rounded-xl">
          <CardContent className="px-4 py-3">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Ownership advantage</p>
            <p className={`text-[28px] font-semibold leading-tight ${pl.ownershipAdvantage >= 0 ? 'text-success' : 'text-destructive'}`}>
              {pl.ownershipAdvantage >= 0 ? '+' : ''}{formatCurrency(pl.ownershipAdvantage)}
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
            {[
              { label: 'Mortgage', value: formatCurrency(mortgageBalance), sub: paidThisMonth ? '✓ Paid this month' : 'Payment due', subClass: paidThisMonth ? 'text-success' : 'text-warning' },
              { label: 'Monthly cost', value: formatCurrency(pl.monthlyCostOfOwnership), sub: 'sunk cost/mo', subClass: 'text-muted-foreground' },
              { label: 'Wealth/mo', value: formatCurrency(pl.trueMonthlyWealthCreation || pl.monthlyWealthCreation), sub: 'equity growth rate', subClass: 'text-muted-foreground', valueClass: 'text-success' },
              { label: 'Principal YTD', value: formatCurrency(principalThisYear), sub: currentYear, subClass: 'text-muted-foreground', valueClass: 'text-success' },
              { label: 'Monthly obligations', value: formatCurrency(totalMonthlyObligations), sub: 'Mortgage + financing', subClass: 'text-muted-foreground' },
              { label: 'HELOC available', value: formatCurrency(availableHeloc80), sub: 'at 80% CLTV', subClass: 'text-muted-foreground' },
            ].map((m, i) => (
              <div key={i} className={`text-center py-3 px-2 ${i < 5 ? 'border-r border-border/30' : ''}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                <p className={`text-sm font-semibold leading-tight ${m.valueClass || ''}`}>{m.value}</p>
                <p className={`text-[10px] ${m.subClass}`}>{m.sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4 — Home P&L Summary + Unrealized Gain */}
      <Card className="rounded-xl">
        <CardContent className="px-4 py-3">
          {/* Row 1: P&L metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Wealth built</p>
              <p className="text-[13px] font-semibold text-success">{formatCurrency(pl.wealthBuilt)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sunk cost</p>
              <p className="text-[13px] font-semibold text-destructive/70">{formatCurrency(pl.sunkCost)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">vs rent+invest (10%, after-tax)</p>
              <p className={`text-[13px] font-semibold ${owningWins ? 'text-success' : 'text-warning'}`}>
                {owningWins ? 'Own wins' : 'Rent wins'} +{formatCurrency(Math.abs(taxAdj10.afterTaxMargin))}
              </p>
            </div>
          </div>
          {/* Row 2: Unrealized + breakeven */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Unrealized gain</p>
                <p className={`text-[13px] font-semibold ${unrealizedGainLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {unrealizedGainLoss >= 0 ? '+' : ''}{formatCurrency(unrealizedGainLoss)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Breakeven</p>
                <p className="text-[13px] font-semibold">
                  {breakeven10.crossoverYear && breakeven10.crossoverYear <= Math.ceil(pl.yearsOwned)
                    ? `Year ${breakeven10.crossoverYear} — past breakeven ✓`
                    : breakeven10.crossoverYear
                      ? `Year ${breakeven10.crossoverYear}`
                      : '15+ years'}
                </p>
              </div>
            </div>
            <Link to="/home-pl" className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
              View full P&L <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 5 — Renovation Snapshot */}
      <Card className="rounded-xl">
        <CardContent className="px-4 py-3">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left: pipeline */}
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
            {/* Right: stats */}
            <div className="flex-[2] flex flex-col justify-center gap-0.5">
              <p className="text-sm font-semibold">Total invested: {formatCurrency(totalSpent)}</p>
              <p className="text-[13px] text-success">Value recovered: {formatCurrency(totalValueAdded)} ({totalSpent > 0 ? Math.round(totalValueAdded / totalSpent * 100) : 0}%)</p>
              <p className="text-[13px] text-destructive/70">Net reno cost: {formatCurrency(totalSpent - totalValueAdded)}</p>
              <Link to="/renovations" className="text-[11px] text-primary hover:underline mt-1 inline-flex items-center gap-1">
                Manage projects <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
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
